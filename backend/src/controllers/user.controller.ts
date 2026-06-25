import type { Request, Response } from "express";
import { UserModel } from "../models/user.model";

export const UserController = {
  async getByName(req: Request, res: Response): Promise<void> {
    const name = decodeURIComponent(req.params["name"] ?? "");
    const user = await UserModel.findByName(name);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    const { name, email, phone, address, accountType } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      accountType?: "solo" | "business";
    };
    if (!name && !email && !phone && !address && !accountType) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    const user = await UserModel.update(req.user!.id, { name, email, phone, address, accountType });
    res.json(user);
  },

  async submitId(req: Request, res: Response): Promise<void> {
    const { imageUrl } = req.body as { imageUrl?: string };
    if (!imageUrl) {
      res.status(400).json({ error: "imageUrl is required" });
      return;
    }
    const user = await UserModel.submitId(req.user!.id, imageUrl);
    res.json(user);
  },
};
