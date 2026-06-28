import type { Request, Response } from "express";
import { UserModel } from "../models/user.model";

export const UserController = {
  async getByName(req: Request, res: Response): Promise<void> {
    const name = decodeURIComponent(req.params["name"] ?? "");
    const user = await UserModel.findByName(name);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  },

  async search(req: Request, res: Response): Promise<void> {
    const q = ((req.query["q"] as string) ?? "").trim();
    if (!q) { res.json([]); return; }
    const users = await UserModel.searchByName(q);
    res.json(users);
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    const {
      name, email, phone, address, accountType,
      defaultProvince, defaultCity, defaultBarangay,
      defaultProvinceCode, defaultCityCode, defaultBarangayCode,
      defaultAddressDetail, defaultMeetup,
      defaultLat, defaultLng,
    } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      accountType?: "solo" | "business";
      defaultProvince?: string;
      defaultCity?: string;
      defaultBarangay?: string;
      defaultProvinceCode?: string;
      defaultCityCode?: string;
      defaultBarangayCode?: string;
      defaultAddressDetail?: string;
      defaultMeetup?: string;
      defaultLat?: number;
      defaultLng?: number;
    };
    const hasField = [name, email, phone, address, accountType, defaultProvince, defaultCity, defaultBarangay, defaultProvinceCode, defaultCityCode, defaultBarangayCode, defaultAddressDetail, defaultMeetup, defaultLat, defaultLng].some((v) => v !== undefined);
    if (!hasField) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    const user = await UserModel.update(req.user!.id, {
      name, email, phone, address, accountType,
      defaultProvince, defaultCity, defaultBarangay,
      defaultProvinceCode, defaultCityCode, defaultBarangayCode,
      defaultAddressDetail, defaultMeetup,
      defaultLat, defaultLng,
    });
    res.json(user);
  },

  async updateAvatar(req: Request, res: Response): Promise<void> {
    const { avatarUrl } = req.body as { avatarUrl?: string };
    if (!avatarUrl) {
      res.status(400).json({ error: "avatarUrl is required" });
      return;
    }
    const user = await UserModel.update(req.user!.id, { avatarUrl });
    res.json(user);
  },

  async acceptTerms(req: Request, res: Response): Promise<void> {
    const user = await UserModel.acceptTerms(req.user!.id);
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
