import type { Request, Response } from "express";
import { BlockedDateModel } from "../models/blocked-date.model";

export const BlockedDateController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const dates = await BlockedDateModel.findByItem(req.params["id"] as string);
      res.status(200).json(dates);
    } catch (err) {
      console.error("GET /api/items/:id/blocked-dates failed:", err);
      res.status(500).json({ error: "Failed to load blocked dates" });
    }
  },

  async add(req: Request, res: Response): Promise<void> {
    const { date } = req.body as { date: string };
    try {
      await BlockedDateModel.add(req.params["id"] as string, date, req.user!.id);
      res.status(201).json({ date });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 403) {
        res.status(403).json({ error: "Not allowed" });
        return;
      }
      if (status === 404) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      console.error("POST /api/items/:id/blocked-dates failed:", err);
      res.status(500).json({ error: "Failed to block date" });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    const date = req.params["date"] as string;
    try {
      await BlockedDateModel.remove(req.params["id"] as string, date, req.user!.id);
      res.status(204).end();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 403) {
        res.status(403).json({ error: "Not allowed" });
        return;
      }
      if (status === 404) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      throw err;
    }
  },
};
