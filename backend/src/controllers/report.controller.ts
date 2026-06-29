import type { Request, Response } from "express";
import { ReportModel } from "../models/report.model";
import { RequestModel } from "../models/request.model";
import { NotificationModel } from "../models/notification.model";
import { emitToUser } from "../socket";
import type { NewReportInput, ReportStatus } from "../types/report";

const VALID_REASONS = [
  "item_not_handed_over",
  "item_damaged",
  "no_show",
  "abusive_behavior",
  "other",
];

export const ReportController = {
  async create(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { requestId, reportedId, reason, description } = req.body as NewReportInput;

    if (!requestId || !reportedId || !reason || !description?.trim()) {
      res.status(400).json({ error: "requestId, reportedId, reason, and description are required" });
      return;
    }
    if (!VALID_REASONS.includes(reason)) {
      res.status(400).json({ error: "Invalid reason" });
      return;
    }

    const request = await RequestModel.findById(requestId);
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }

    if (request.status !== "approved" && request.status !== "completed") {
      res.status(400).json({ error: "Reports can only be filed on approved or completed rentals" });
      return;
    }

    const isLister = request.listerId === userId;
    const isBorrower = request.borrowerId === userId;
    if (!isLister && !isBorrower) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (reportedId !== request.listerId && reportedId !== request.borrowerId) {
      res.status(400).json({ error: "Reported user is not part of this rental" });
      return;
    }
    if (reportedId === userId) {
      res.status(400).json({ error: "Cannot report yourself" });
      return;
    }

    const alreadyReported = await ReportModel.existsByReporterAndRequest(userId, requestId);
    if (alreadyReported) {
      res.status(409).json({ error: "You have already filed a report for this rental" });
      return;
    }

    const report = await ReportModel.create({ requestId, reportedId, reason, description: description.trim() }, userId);
    res.status(201).json(report);
  },

  async listByRequest(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { requestId } = req.params as { requestId: string };

    const request = await RequestModel.findById(requestId);
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }

    const isLister = request.listerId === userId;
    const isBorrower = request.borrowerId === userId;
    if (!isLister && !isBorrower) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const reports = await ReportModel.findByRequest(requestId);
    res.json(reports);
  },

  async myList(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const reports = await ReportModel.findByReporter(userId);
    res.json(reports);
  },

  async adminList(req: Request, res: Response): Promise<void> {
    const status = req.query["status"] as ReportStatus | undefined;
    const reports = await ReportModel.findAll(status);
    res.json(reports);
  },

  async adminSetStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { status, note } = req.body as { status?: ReportStatus; note?: string };

    if (!status || !["resolved", "dismissed"].includes(status)) {
      res.status(400).json({ error: "status must be 'resolved' or 'dismissed'" });
      return;
    }
    if (!note?.trim()) {
      res.status(400).json({ error: "A resolution note is required" });
      return;
    }

    const report = await ReportModel.setStatus(id, status, note.trim());
    if (!report) { res.status(404).json({ error: "Report not found" }); return; }

    const statusLabel = status === "resolved" ? "resolved" : "dismissed";
    const notif = await NotificationModel.create(
      report.reporterId,
      "report_filed",
      `Your report on "${report.itemTitle}" has been ${statusLabel}. Note: ${note.trim()}`,
      report.requestId
    );
    emitToUser(report.reporterId, "notification", notif);

    res.json(report);
  },
};
