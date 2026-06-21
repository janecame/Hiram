import type { Request, Response } from "express";
import { RequestModel } from "../models/request.model";
import type { NewRequestInput, RequestStatus } from "../types/request";

export const RequestController = {
  async create(req: Request, res: Response): Promise<void> {
    const borrowerId = req.user!.id;
    const newRequest = await RequestModel.create(
      req.body as NewRequestInput,
      borrowerId
    );
    res.status(201).json(newRequest);
  },

  async list(req: Request, res: Response): Promise<void> {
    const role =
      req.query["role"] === "lister" ? "lister" : "borrower";
    const requests = await RequestModel.findAll({ role, userId: req.user!.id });
    res.status(200).json(requests);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.body as { status: RequestStatus };
    try {
      const updated = await RequestModel.updateStatus(
        req.params["id"] as string,
        status,
        req.user!.id
      );
      res.status(200).json(updated);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 403) {
        res.status(403).json({ error: "Not allowed" });
        return;
      }
      if (status === 404) {
        res.status(404).json({ error: "Request not found" });
        return;
      }
      throw err;
    }
  },
};
