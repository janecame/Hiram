import { pool } from "../db";
import type { Item, NewItemInput, Category, ItemStatus } from "../types/item";

export type ListFilters = {
  category?: Category | "all";
  sort?: "cheapest" | "nearest" | "newest";
  status?: ItemStatus | "all";
  search?: string;
  owner?: string;
  archived?: boolean;
  page?: number;
  pageSize?: number;
  userLat?: number;
  userLng?: number;
};

export interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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
    distanceKm: row["distance_km"] != null
      ? parseFloat(row["distance_km"] as string)
      : undefined,
    lat: row["lat"] != null ? parseFloat(row["lat"] as string) : undefined,
    lng: row["lng"] != null ? parseFloat(row["lng"] as string) : undefined,
    province: (row["province"] as string | null) ?? undefined,
    city: (row["city"] as string | null) ?? undefined,
    barangay: (row["barangay"] as string | null) ?? undefined,
    addressDetail: (row["address_detail"] as string | null) ?? undefined,
    area: row["area"] as string,
    owner: row["owner"] as string,
    condition: row["condition"] as Item["condition"],
    status: row["status"] as Item["status"],
    rating: row["avg_rating"] ? parseFloat(row["avg_rating"] as string) : undefined,
    reviewCount:
      row["review_count"] != null ? Number(row["review_count"]) : undefined,
    requirements: (row["requirements"] as string | null) ?? undefined,
    quantity: row["quantity"] != null ? Number(row["quantity"]) : 1,
    archived: row["archived"] as boolean,
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
      archived,
      page = 1,
      pageSize = 8,
      userLat,
      userLng,
    } = filters;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    // Default: exclude archived. Only include archived when explicitly requested.
    if (archived === true) {
      conditions.push(`i.archived = true`);
    } else {
      conditions.push(`i.archived = false`);
    }

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

    const hasCoords = userLat != null && userLng != null;
    const mainParams = [...params];

    // Add distance expression when user coords are present.
    // ST_MakePoint takes (lng, lat) — longitude first.
    let distanceSelect = "";
    let orderBy: string;

    if (hasCoords) {
      distanceSelect = `, ST_Distance(
          i.location::geography,
          ST_SetSRID(ST_MakePoint($${p}, $${p + 1}), 4326)::geography
        ) / 1000 AS distance_km`;
      mainParams.push(userLng, userLat);
      p += 2;

      orderBy =
        sort === "nearest"
          ? "distance_km ASC NULLS LAST"
          : sort === "cheapest"
          ? "i.price_per_day ASC"
          : "i.created_at DESC";
    } else {
      orderBy =
        sort === "cheapest" ? "i.price_per_day ASC" : "i.created_at DESC";
    }

    const result = await pool.query(
      `SELECT i.*, u.name AS owner,
              ir.avg_rating, ir.review_count,
              ST_Y(i.location::geometry) AS lat, ST_X(i.location::geometry) AS lng
              ${distanceSelect}
       FROM public.items i
       JOIN public.users u ON u.id = i.owner_id
       LEFT JOIN public.item_ratings ir ON ir.item_id = i.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${p} OFFSET $${p + 1}`,
      [...mainParams, pageSize, offset]
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
              ir.avg_rating, ir.review_count,
              ST_Y(i.location::geometry) AS lat, ST_X(i.location::geometry) AS lng
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
         quantity       = COALESCE($12, quantity),
         province       = COALESCE($15, province),
         city           = COALESCE($16, city),
         barangay       = COALESCE($17, barangay),
         address_detail = $18,
         location       = CASE
                            WHEN $13::float IS NOT NULL AND $14::float IS NOT NULL
                            THEN ST_SetSRID(ST_MakePoint($13::float, $14::float), 4326)::geography
                            ELSE location
                          END
       WHERE id = $1
       RETURNING *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`,
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
        input.lng ?? null,
        input.lat ?? null,
        input.province ?? null,
        input.city ?? null,
        input.barangay ?? null,
        input.addressDetail ?? null,
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

  async adminDeleteItem(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM public.items WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async setArchived(
    id: string,
    archived: boolean,
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
      `UPDATE public.items SET archived = $2 WHERE id = $1
       RETURNING *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`,
      [id, archived]
    );
    const row = result.rows[0] as Record<string, unknown>;
    const ownerResult = await pool.query(
      `SELECT name FROM public.users WHERE id = $1`,
      [ownerId]
    );
    row["owner"] = ownerResult.rows[0]?.["name"] ?? "";
    return rowToItem(row);
  },

  async deleteItem(
    id: string,
    ownerId: string
  ): Promise<"ok" | "not_found" | "forbidden"> {
    const existing = await pool.query(
      `SELECT owner_id FROM public.items WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) return "not_found";
    if ((existing.rows[0] as Record<string, unknown>)["owner_id"] !== ownerId)
      return "forbidden";

    await pool.query(`DELETE FROM public.items WHERE id = $1`, [id]);
    return "ok";
  },

  async create(input: NewItemInput, ownerId: string): Promise<Item> {
    const hasLocation = input.lat != null && input.lng != null;
    const locationParam = hasLocation
      ? `ST_SetSRID(ST_MakePoint($17, $18), 4326)::geography`
      : `NULL`;

    const result = await pool.query(
      `INSERT INTO public.items
         (owner_id, title, category, condition, description, brand,
          price_per_day, price_per_hour, image_url, area, requirements, quantity,
          province, city, barangay, address_detail, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,${locationParam})
       RETURNING *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`,
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
        input.province ?? null,
        input.city ?? null,
        input.barangay ?? null,
        input.addressDetail ?? null,
        ...(hasLocation ? [input.lng, input.lat] : []),
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
