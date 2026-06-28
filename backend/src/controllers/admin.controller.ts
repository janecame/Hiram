import type { Request, Response } from "express";
import { pool } from "../db";
import { UserModel } from "../models/user.model";
import { ItemModel } from "../models/item.model";
import { NotificationModel } from "../models/notification.model";
import { emitToUser } from "../socket";

async function writeAuditLog(
  adminId: string,
  targetType: "user" | "item",
  targetId: string,
  action: "disable" | "enable",
  reason?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO public.admin_audit_log (admin_id, target_type, target_id, action, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, targetType, targetId, action, reason ?? null]
  );
}

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
    const verificationStatus = (req.query["verificationStatus"] as string) ?? "all";
    const sort = (req.query["sort"] as string) ?? "newest";
    const { users, total, totalPages } = await UserModel.findAllAdmin({
      page,
      pageSize,
      search,
      accountType: accountType as "solo" | "business" | "all",
      verificationStatus: verificationStatus as "unsubmitted" | "pending" | "verified" | "rejected" | "all",
      sort: sort as "newest" | "oldest" | "name_asc" | "name_desc",
    });
    res.json({ users, total, totalPages, page, pageSize });
  },

  async setUserVerification(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as {
      status?: "pending" | "verified" | "rejected";
      reason?: string;
    };
    if (!status || !["pending", "verified", "rejected"].includes(status)) {
      res.status(400).json({ error: "status must be 'pending', 'verified', or 'rejected'" });
      return;
    }
    const user = await UserModel.setVerification(id, status, reason);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    if (status === "verified") {
      const notif = await NotificationModel.create(
        user.id,
        "id_verified",
        "Your government ID was verified — you're all set!"
      );
      emitToUser(user.id, "notification", notif);
    } else if (status === "rejected") {
      const notif = await NotificationModel.create(
        user.id,
        "id_rejected",
        `Your ID was rejected: ${reason ?? "see your profile for details"}.`
      );
      emitToUser(user.id, "notification", notif);
    }

    res.json(user);
  },

  async setUserDisabled(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { disabled, reason } = req.body as { disabled?: boolean; reason?: string };

    if (typeof disabled !== "boolean") {
      res.status(400).json({ error: "disabled (boolean) is required" });
      return;
    }
    if (id === req.user!.id) {
      res.status(400).json({ error: "Cannot disable your own account" });
      return;
    }

    const user = await UserModel.setDisabled(id, disabled, reason);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    await writeAuditLog(req.user!.id, "user", id, disabled ? "disable" : "enable", reason);

    if (disabled) {
      const notif = await NotificationModel.create(
        user.id,
        "account_disabled",
        `Your account has been disabled${reason ? `: ${reason}` : ". Please contact support."}`
      );
      emitToUser(user.id, "notification", notif);
    } else {
      const notif = await NotificationModel.create(
        user.id,
        "account_enabled",
        "Your account has been re-enabled. Welcome back!"
      );
      emitToUser(user.id, "notification", notif);
    }

    res.json(user);
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
      includeDisabled: true,
    });
    res.json(result);
  },

  async setItemDisabled(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { disabled, reason } = req.body as { disabled?: boolean; reason?: string };

    if (typeof disabled !== "boolean") {
      res.status(400).json({ error: "disabled (boolean) is required" });
      return;
    }

    const item = await ItemModel.setDisabled(id, disabled, reason);
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }

    await writeAuditLog(req.user!.id, "item", id, disabled ? "disable" : "enable", reason);

    if (disabled) {
      const notif = await NotificationModel.create(
        item.ownerId,
        "item_disabled",
        `Your listing "${item.title}" has been disabled${reason ? `: ${reason}` : "."}  Please review our guidelines.`
      );
      emitToUser(item.ownerId, "notification", notif);
    }

    res.json(item);
  },

  async deleteItem(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const deleted = await ItemModel.adminDeleteItem(id);
    if (!deleted) { res.status(404).json({ error: "Item not found" }); return; }
    res.json({ ok: true });
  },
};
