import { pool } from "../db";
import type { Review, NewReviewInput } from "../types/review";

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row["id"] as string,
    requestId: row["request_id"] as string,
    reviewerId: row["reviewer_id"] as string,
    reviewerName: row["reviewer_name"] as string,
    itemId: row["item_id"] as string,
    itemTitle: row["item_title"] as string,
    rating: Number(row["rating"]),
    comment: (row["comment"] as string | null) ?? undefined,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

// Shared SELECT-with-joins so all methods return identically-shaped rows.
const SELECT_WITH_JOINS = `
  SELECT r.id, r.request_id, r.reviewer_id, r.item_id,
         r.rating, r.comment, r.created_at,
         u.name AS reviewer_name,
         i.title AS item_title
  FROM public.reviews r
  JOIN public.users u ON u.id = r.reviewer_id
  JOIN public.items i ON i.id = r.item_id
`;

export const ReviewModel = {
  async create(input: NewReviewInput, reviewerId: string): Promise<Review> {
    const requestResult = await pool.query(
      `SELECT id, item_id, borrower_id, lister_id, status FROM public.requests WHERE id = $1`,
      [input.requestId]
    );
    const request = requestResult.rows[0] as Record<string, unknown> | undefined;
    if (!request) {
      throw Object.assign(new Error("Request not found"), { status: 404 });
    }
    if (request["status"] !== "completed") {
      throw Object.assign(
        new Error("You can only review completed rentals"),
        { status: 400 }
      );
    }
    if (request["borrower_id"] !== reviewerId) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    if (await this.existsForRequest(input.requestId, reviewerId)) {
      throw Object.assign(
        new Error("You already reviewed this rental"),
        { status: 409 }
      );
    }

    const itemId = request["item_id"] as string;
    // The borrower reviews the rental, so the reviewee is the lister.
    const revieweeId = request["lister_id"] as string;
    let inserted;
    try {
      inserted = await pool.query(
        `INSERT INTO public.reviews
           (request_id, reviewer_id, reviewee_id, item_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [input.requestId, reviewerId, revieweeId, itemId, input.rating, input.comment ?? null]
      );
    } catch (err) {
      // Defensive: race on the UNIQUE(request_id, reviewer_id) constraint.
      if ((err as { code?: string }).code === "23505") {
        throw Object.assign(
          new Error("You already reviewed this rental"),
          { status: 409 }
        );
      }
      throw err;
    }

    const id = (inserted.rows[0] as Record<string, unknown>)["id"] as string;
    const result = await pool.query(
      `${SELECT_WITH_JOINS}
       WHERE r.id = $1`,
      [id]
    );
    return rowToReview(result.rows[0] as Record<string, unknown>);
  },

  async findByItem(itemId: string): Promise<Review[]> {
    const result = await pool.query(
      `${SELECT_WITH_JOINS}
       WHERE r.item_id = $1
       ORDER BY r.created_at DESC`,
      [itemId]
    );
    return result.rows.map((row) => rowToReview(row as Record<string, unknown>));
  },

  async existsForRequest(
    requestId: string,
    reviewerId: string
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM public.reviews
       WHERE request_id = $1 AND reviewer_id = $2`,
      [requestId, reviewerId]
    );
    return result.rows.length > 0;
  },
};
