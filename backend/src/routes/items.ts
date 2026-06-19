import { Router } from "express";
import type { Request, Response } from "express";
import { MOCK_ITEMS } from "../data/mock-items";
import type { Item, NewItemInput, Category } from "../types/item";

const router = Router();
let items: Item[] = [...MOCK_ITEMS];

// GET /api/items?category=tools&sort=cheapest
router.get("/", (_req: Request, res: Response) => {
  const category = _req.query["category"] as string | undefined;
  const sort = _req.query["sort"] as string | undefined;

  let result = [...items];

  if (category && category !== "all") {
    result = result.filter((item) => item.category === (category as Category));
  }

  if (sort === "cheapest") {
    result.sort((a, b) => a.pricePerDay - b.pricePerDay);
  } else if (sort === "nearest") {
    result.sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    // newest (default)
    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  res.json(result);
});

// GET /api/items/:id
router.get("/:id", (req: Request, res: Response) => {
  const item = items.find((i) => i.id === req.params["id"]);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

// POST /api/items
router.post("/", (req: Request, res: Response) => {
  const input = req.body as NewItemInput;
  const newItem: Item = {
    ...input,
    id: String(Date.now()),
    distanceKm: Math.round(Math.random() * 100) / 10,
    // New listings start available; rating accrues from reviews later.
    status: "available",
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  res.status(201).json(newItem);
});

export default router;
