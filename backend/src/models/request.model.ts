import { pool } from "../db";
import type { BorrowRequest, NewRequestInput, RequestStatus } from "../types/request";

function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value as string;
}

function rowToRequest(row: Record<string, unknown>): BorrowRequest {
  return {
    id: row["id"] as string,
    itemId: row["item_id"] as string,
    itemTitle: row["item_title"] as string,
    itemArea: row["item_area"] as string,
    borrowerId: row["borrower_id"] as string,
    borrowerName: row["borrower_name"] as string,
    listerId: row["lister_id"] as string,
    listerName: row["lister_name"] as string,
    status: row["status"] as RequestStatus,
    startDate: toDateString(row["start_date"]),
    endDate: toDateString(row["end_date"]),
    useHours: row["use_hours"] as boolean,
    message: (row["message"] as string | null) ?? undefined,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

// Shared SELECT-with-joins so all methods return identically-shaped rows.
const SELECT_WITH_JOINS = `
  SELECT r.id, r.item_id, r.borrower_id, r.lister_id, r.status,
         r.start_date, r.end_date, r.use_hours, r.message, r.created_at,
         i.title AS item_title, i.area AS item_area,
         b.name AS borrower_name, l.name AS lister_name
  FROM public.requests r
  JOIN public.items i ON i.id = r.item_id
  JOIN public.users b ON b.id = r.borrower_id
  JOIN public.users l ON l.id = r.lister_id
`;

export const RequestModel = {
  async create(input: NewRequestInput, borrowerId: string): Promise<BorrowRequest> {
    const itemResult = await pool.query(
      `SELECT owner_id FROM public.items WHERE id = $1`,
      [input.itemId]
    );
    if (!itemResult.rows[0]) {
      throw Object.assign(new Error("Item not found"), { status: 404 });
    }
    const listerId = (itemResult.rows[0] as Record<string, unknown>)["owner_id"] as string;

    const inserted = await pool.query(
      `INSERT INTO public.requests
         (item_id, borrower_id, lister_id, start_date, end_date, use_hours, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        input.itemId,
        borrowerId,
        listerId,
        input.startDate,
        input.endDate,
        input.useHours,
        input.message ?? null,
      ]
    );

    const id = (inserted.rows[0] as Record<string, unknown>)["id"] as string;
    const found = await this.findById(id);
    return found!;
  },

  async findAll(filters: {
    role: "lister" | "borrower";
    userId: string;
  }): Promise<BorrowRequest[]> {
    const column = filters.role === "lister" ? "r.lister_id" : "r.borrower_id";
    const result = await pool.query(
      `${SELECT_WITH_JOINS}
       WHERE ${column} = $1
       ORDER BY r.created_at DESC`,
      [filters.userId]
    );
    return result.rows.map((row) => rowToRequest(row as Record<string, unknown>));
  },

  async findById(id: string): Promise<BorrowRequest | undefined> {
    const result = await pool.query(
      `${SELECT_WITH_JOINS}
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0]
      ? rowToRequest(result.rows[0] as Record<string, unknown>)
      : undefined;
  },

  async updateStatus(
    id: string,
    status: RequestStatus,
    actorId: string
  ): Promise<BorrowRequest> {
    const existing = await this.findById(id);
    if (!existing) {
      throw Object.assign(new Error("Request not found"), { status: 404 });
    }

    // Authorization: borrower may cancel, or mark return_requested when approved.
    const isBorrower = existing.borrowerId === actorId;
    const isLister = existing.listerId === actorId;
    const borrowerAllowed: RequestStatus[] =
      existing.status === "approved"
        ? ["cancelled", "return_requested"]
        : ["cancelled"];
    const listerAllowed: RequestStatus[] = ["approved", "declined", "completed"];

    const allowed =
      (isBorrower && borrowerAllowed.includes(status)) ||
      (isLister && listerAllowed.includes(status));
    if (!allowed) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    await pool.query(
      `UPDATE public.requests SET status = $1 WHERE id = $2`,
      [status, id]
    );

    if (status === "approved") {
      const itemId = existing.itemId;
      const quantityResult = await pool.query(
        `SELECT quantity FROM public.items WHERE id = $1`,
        [itemId]
      );
      const quantity = quantityResult.rows[0]
        ? Number((quantityResult.rows[0] as Record<string, unknown>)["quantity"])
        : 1;

      const approvedCountResult = await pool.query(
        `SELECT COUNT(*) FROM public.requests WHERE item_id = $1 AND status = 'approved'`,
        [itemId]
      );
      const approvedCount = parseInt(
        (approvedCountResult.rows[0] as Record<string, unknown>)["count"] as string,
        10
      );

      if (approvedCount >= quantity) {
        await pool.query(
          `UPDATE public.requests
           SET status = 'declined'
           WHERE item_id = $1 AND status = 'pending' AND id <> $2`,
          [itemId, id]
        );
      }
    }

    const updated = await this.findById(id);
    return updated!;
  },
};
