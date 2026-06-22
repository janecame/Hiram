import { pool } from "../db";
import type { Item, NewItemInput, Category, ItemStatus } from "../types/item";

export type ListFilters = {
  category?: Category | "all";
  sort?: "cheapest" | "nearest" | "newest";
  status?: ItemStatus | "all";
  search?: string;
  owner?: string;
  page?: number;
  pageSize?: number;
};

export interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SORT_CLAUSES: Record<string, string> = {
  cheapest: "i.price_per_day ASC",
  nearest: "i.created_at DESC",
  newest: "i.created_at DESC",
};

function rowToItem(row: Record<string, unknown>): Item {
  return {
    id: row["id"] as string,
    ownerId: row["owner_id"] as string,
    title: row["title"] as string,
    category: row["category"] as Item["category"],
    description: row["description"] as string,
    brand: (row["brand"] as string | null) ?? undefined,
    pricePerDay: parseFloat(row["price_per_day"] as string),
    pricePerHour: row["price_per_hour"]
      ? parseFloat(row["price_per_hour"] as string)
      : undefined,
    imageUrl: (row["image_url"] as string | null) ?? undefined,
    distanceKm: Math.round((Math.random() * 9 + 0.3) * 10) / 10,
    area: row["area"] as string,
    owner: row["owner"] as string,
    condition: row["condition"] as Item["condition"],
    status: row["status"] as Item["status"],
    rating: row["avg_rating"] ? parseFloat(row["avg_rating"] as string) : undefined,
    reviewCount:
      row["review_count"] != null ? Number(row["review_count"]) : undefined,
    requirements: (row["requirements"] as string | null) ?? undefined,
    quantity: row["quantity"] != null ? Number(row["quantity"]) : 1,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

export const ItemModel = {
  async findAll(filters: ListFilters = {}): Promise<PaginatedItems> {
    const {
      category,
      sort = "newest",
      status,
      search = "",
      owner,
      page = 1,
      pageSize = 8,
    } = filters;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (category && category !== "all") {
      conditions.push(`i.category = $${p++}::item_category`);
      params.push(category);
    }
    if (status && status !== "all") {
      conditions.push(`i.status = $${p++}::item_status`);
      params.push(status);
    }
    if (search.trim()) {
      conditions.push(
        `(i.title ILIKE $${p} OR i.description ILIKE $${p} OR i.area ILIKE $${p})`
      );
      params.push(`%${search.trim()}%`);
      p++;
    }
    if (owner) {
      conditions.push(`u.name = $${p++}`);
      params.push(owner);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = SORT_CLAUSES[sort] ?? SORT_CLAUSES["newest"];

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM public.items i
       JOIN public.users u ON u.id = i.owner_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]["count"] as string, 10);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;

    const result = await pool.query(
      `SELECT i.*, u.name AS owner,
              ir.avg_rating, ir.review_count
       FROM public.items i
       JOIN public.users u ON u.id = i.owner_id
       LEFT JOIN public.item_ratings ir ON ir.item_id = i.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );

    return {
      items: result.rows.map(rowToItem),
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  },

  async findById(id: string): Promise<Item | undefined> {
    const result = await pool.query(
      `SELECT i.*, u.name AS owner,
              ir.avg_rating, ir.review_count
       FROM public.items i
       JOIN public.users u ON u.id = i.owner_id
       LEFT JOIN public.item_ratings ir ON ir.item_id = i.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] ? rowToItem(result.rows[0]) : undefined;
  },

  async update(
    id: string,
    input: Partial<NewItemInput>,
    ownerId: string
  ): Promise<Item | "not_found" | "forbidden"> {
    const existing = await pool.query(
      `SELECT owner_id FROM public.items WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) return "not_found";
    if ((existing.rows[0] as Record<string, unknown>)["owner_id"] !== ownerId)
      return "forbidden";

    const result = await pool.query(
      `UPDATE public.items SET
         title          = COALESCE($2, title),
         category       = COALESCE($3::item_category, category),
         condition      = COALESCE($4::item_condition, condition),
         description    = COALESCE($5, description),
         brand          = $6,
         price_per_day  = COALESCE($7, price_per_day),
         price_per_hour = $8,
         image_url      = $9,
         area           = COALESCE($10, area),
         requirements   = $11,
         quantity       = COALESCE($12, quantity)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        input.title ?? null,
        input.category ?? null,
        input.condition ?? null,
        input.description ?? null,
        input.brand ?? null,
        input.pricePerDay ?? null,
        input.pricePerHour ?? null,
        input.imageUrl ?? null,
        input.area ?? null,
        input.requirements ?? null,
        input.quantity ?? null,
      ]
    );
    const row = result.rows[0] as Record<string, unknown>;
    const ownerResult = await pool.query(
      `SELECT name FROM public.users WHERE id = $1`,
      [ownerId]
    );
    row["owner"] = ownerResult.rows[0]?.["name"] ?? "";
    return rowToItem(row);
  },

  async create(input: NewItemInput, ownerId: string): Promise<Item> {
    const result = await pool.query(
      `INSERT INTO public.items
         (owner_id, title, category, condition, description, brand,
          price_per_day, price_per_hour, image_url, area, requirements, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        ownerId,
        input.title,
        input.category,
        input.condition,
        input.description,
        input.brand ?? null,
        input.pricePerDay,
        input.pricePerHour ?? null,
        input.imageUrl ?? null,
        input.area,
        input.requirements ?? null,
        input.quantity ?? 1,
      ]
    );

    const row = result.rows[0] as Record<string, unknown>;
    const ownerResult = await pool.query(
      `SELECT name FROM public.users WHERE id = $1`,
      [ownerId]
    );
    row["owner"] = ownerResult.rows[0]?.["name"] ?? "";
    return rowToItem(row);
  },
};
