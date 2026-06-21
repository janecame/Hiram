import type { Request, Response } from "express";
import { ItemModel } from "../models/item.model";
import type { ListFilters } from "../models/item.model";
import type { Category, NewItemInput } from "../types/item";
import type { ItemStatus } from "../types/item";

export const ItemController = {
  async list(req: Request, res: Response): Promise<void> {
    const filters: ListFilters = {
      category: req.query["category"] as Category | "all" | undefined,
      sort: req.query["sort"] as ListFilters["sort"] | undefined,
      status: req.query["status"] as ItemStatus | "all" | undefined,
      search: req.query["search"] as string | undefined,
      owner: req.query["owner"] as string | undefined,
      page: req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined,
      pageSize: req.query["pageSize"]
        ? parseInt(req.query["pageSize"] as string, 10)
        : undefined,
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
};
