import type { Request, Response } from "express";
import { RequestModel } from "../models/request.model";
import { NotificationModel } from "../models/notification.model";
import { emitToUser } from "../socket";
import type { NewRequestInput, RequestStatus } from "../types/request";
import type { NotificationType } from "../types/notification";

// Postgres CHECK / FK / unique violations mean the client sent bad input —
// map them to 400 instead of letting the rejection crash the server.
const PG_CONSTRAINT_CODES: Record<string, string> = {
  "23514": "That request isn't allowed (check the dates and item).",
  "23503": "That item no longer exists.",
  "23505": "You already have a request like this.",
};

function pgConstraintMessage(err: unknown): string | undefined {
  const code = (err as { code?: string }).code;
  if (!code) return undefined;
  // no_self_borrow surfaces as 23514 — give it a friendlier message.
  if (code === "23514" && (err as { constraint?: string }).constraint === "no_self_borrow") {
    return "You cannot borrow your own item.";
  }
  return PG_CONSTRAINT_CODES[code];
}

export const RequestController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const borrowerId = req.user!.id;
      const newRequest = await RequestModel.create(
        req.body as NewRequestInput,
        borrowerId
      );
      const notif = await NotificationModel.create(
        newRequest.listerId,
        'request_received',
        `${newRequest.borrowerName} wants to borrow your "${newRequest.itemTitle}".`,
        newRequest.id
      );
      emitToUser(newRequest.listerId, 'notification', notif);
      res.status(201).json(newRequest);
    } catch (err) {
      if ((err as { status?: number }).status === 404) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      const message = pgConstraintMessage(err);
      if (message) {
        res.status(400).json({ error: message });
        return;
      }
      console.error("POST /api/requests failed:", err);
      res.status(500).json({ error: "Failed to create request" });
    }
  },

  async list(req: Request, res: Response): Promise<void> {
    try {
      const role = req.query["role"] === "lister" ? "lister" : "borrower";
      const requests = await RequestModel.findAll({ role, userId: req.user!.id });
      res.status(200).json(requests);
    } catch (err) {
      console.error("GET /api/requests failed:", err);
      res.status(500).json({ error: "Failed to load requests" });
    }
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.body as { status: RequestStatus };
    try {
      const updated = await RequestModel.updateStatus(
        req.params["id"] as string,
        status,
        req.user!.id
      );

      const notifMap: Record<string, { recipient: string; type: NotificationType; message: string }> = {
        approved: {
          recipient: updated.borrowerId,
          type: 'request_approved',
          message: `Your request for "${updated.itemTitle}" was approved.`,
        },
        declined: {
          recipient: updated.borrowerId,
          type: 'request_declined',
          message: `Your request for "${updated.itemTitle}" was declined.`,
        },
        cancelled: {
          recipient: updated.listerId,
          type: 'request_cancelled',
          message: `${updated.borrowerName} cancelled their request for "${updated.itemTitle}".`,
        },
        return_requested: {
          recipient: updated.listerId,
          type: 'return_requested',
          message: `${updated.borrowerName} has marked "${updated.itemTitle}" as returned. Please confirm.`,
        },
        completed: {
          recipient: updated.borrowerId,
          type: 'return_confirmed',
          message: `Your return of "${updated.itemTitle}" was confirmed. Thanks for borrowing!`,
        },
      };
      const notif = notifMap[status];
      if (notif) {
        const created = await NotificationModel.create(notif.recipient, notif.type, notif.message, updated.id);
        emitToUser(notif.recipient, 'notification', created);
      }

      res.status(200).json(updated);
    } catch (err) {
      const errStatus = (err as { status?: number }).status;
      if (errStatus === 403) {
        res.status(403).json({ error: "Not allowed" });
        return;
      }
      if (errStatus === 404) {
        res.status(404).json({ error: "Request not found" });
        return;
      }
      console.error("PATCH /api/requests/:id/status failed:", err);
      res.status(500).json({ error: "Failed to update request" });
    }
  },
};
