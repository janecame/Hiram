import type { Request, Response } from "express";
import { ItemModel } from "../models/item.model";
import type { ListFilters } from "../models/item.model";
import type { Category, NewItemInput } from "../types/item";
import type { ItemStatus } from "../types/item";

export const ItemController = {
  async list(req: Request, res: Response): Promise<void> {
    const archivedParam = req.query["archived"] as string | undefined;
    const filters: ListFilters = {
      category: req.query["category"] as Category | "all" | undefined,
      sort: req.query["sort"] as ListFilters["sort"] | undefined,
      status: req.query["status"] as ItemStatus | "all" | undefined,
      search: req.query["search"] as string | undefined,
      owner: req.query["owner"] as string | undefined,
      archived: archivedParam === "true" ? true : archivedParam === "false" ? false : undefined,
      page: req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined,
      pageSize: req.query["pageSize"]
        ? parseInt(req.query["pageSize"] as string, 10)
        : undefined,
      userLat: req.query["userLat"] ? parseFloat(req.query["userLat"] as string) : undefined,
      userLng: req.query["userLng"] ? parseFloat(req.query["userLng"] as string) : undefined,
    };
    const result = await ItemModel.findAll(filters);
    res.json(result);
  },

  async detail(req: Request, res: Response): Promise<void> {
    const item = await ItemModel.findById(req.params["id"] as string);
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item);
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = req.body as NewItemInput;
    const ownerId = req.user!.id;
    const newItem = await ItemModel.create(input, ownerId);
    res.status(201).json(newItem);
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params["id"] as string;
    const input = req.body as Partial<NewItemInput>;
    const ownerId = req.user!.id;
    const result = await ItemModel.update(id, input, ownerId);
    if (result === "not_found") {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    if (result === "forbidden") {
      res.status(403).json({ error: "You do not own this item" });
      return;
    }
    res.json(result);
  },

  async setArchive(req: Request, res: Response): Promise<void> {
    const id = req.params["id"] as string;
    const { archived } = req.body as { archived: boolean };
    const ownerId = req.user!.id;
    const result = await ItemModel.setArchived(id, archived, ownerId);
    if (result === "not_found") {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    if (result === "forbidden") {
      res.status(403).json({ error: "You do not own this item" });
      return;
    }
    res.json(result);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const id = req.params["id"] as string;
    const ownerId = req.user!.id;
    const result = await ItemModel.deleteItem(id, ownerId);
    if (result === "not_found") {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    if (result === "forbidden") {
      res.status(403).json({ error: "You do not own this item" });
      return;
    }
    res.json({ ok: true });
  },
};
