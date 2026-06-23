import type { Request, Response } from "express";
import { pool } from "../db";
import { UserModel } from "../models/user.model";
import { ItemModel } from "../models/item.model";

export const AdminController = {
  async getStats(_req: Request, res: Response): Promise<void> {
    const [userCount, itemCount, requestCount] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM public.users`),
      pool.query(`SELECT COUNT(*) FROM public.items`),
      pool.query(`SELECT COUNT(*) FROM public.requests`),
    ]);
    res.json({
      users: parseInt(userCount.rows[0]["count"] as string, 10),
      items: parseInt(itemCount.rows[0]["count"] as string, 10),
      requests: parseInt(requestCount.rows[0]["count"] as string, 10),
    });
  },

  async listUsers(req: Request, res: Response): Promise<void> {
    const page = parseInt((req.query["page"] as string) ?? "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) ?? "20", 10);
    const search = (req.query["search"] as string) ?? "";
    const accountType = (req.query["accountType"] as string) ?? "all";
    const sort = (req.query["sort"] as string) ?? "newest";
    const { users, total, totalPages } = await UserModel.findAllAdmin({
      page,
      pageSize,
      search,
      accountType: accountType as "solo" | "business" | "all",
      sort: sort as "newest" | "oldest" | "name_asc" | "name_desc",
    });
    res.json({ users, total, totalPages, page, pageSize });
  },

  async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    if (id === req.user!.id) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }
    const deleted = await UserModel.deleteById(id);
    if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ok: true });
  },

  async listItems(req: Request, res: Response): Promise<void> {
    const page = parseInt((req.query["page"] as string) ?? "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) ?? "20", 10);
    const search = (req.query["search"] as string) ?? "";
    const category = (req.query["category"] as string) ?? "all";
    const status = (req.query["status"] as string) ?? "all";
    const sort = (req.query["sort"] as string) ?? "newest";
    const result = await ItemModel.findAll({
      page,
      pageSize,
      search,
      category: category as "all",
      status: status as "all",
      sort: sort as "newest" | "cheapest",
    });
    res.json(result);
  },

  async deleteItem(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const deleted = await ItemModel.adminDeleteItem(id);
    if (!deleted) { res.status(404).json({ error: "Item not found" }); return; }
    res.json({ ok: true });
  },
};
