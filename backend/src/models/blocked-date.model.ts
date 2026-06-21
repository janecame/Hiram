import { pool } from "../db";

function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value as string;
}

async function assertOwnsItem(itemId: string, ownerId: string): Promise<void> {
  const result = await pool.query(
    `SELECT owner_id FROM public.items WHERE id = $1`,
    [itemId]
  );
  if (!result.rows[0]) {
    throw Object.assign(new Error("Item not found"), { status: 404 });
  }
  const itemOwner = (result.rows[0] as Record<string, unknown>)["owner_id"] as string;
  if (itemOwner !== ownerId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}

export const BlockedDateModel = {
  async findByItem(itemId: string): Promise<string[]> {
    const result = await pool.query(
      `SELECT blocked_on FROM public.blocked_dates
       WHERE item_id = $1
       ORDER BY blocked_on ASC`,
      [itemId]
    );
    return result.rows.map((row) =>
      toDateString((row as Record<string, unknown>)["blocked_on"])
    );
  },

  async add(itemId: string, date: string, ownerId: string): Promise<void> {
    await assertOwnsItem(itemId, ownerId);
    await pool.query(
      `INSERT INTO public.blocked_dates (item_id, blocked_on)
       VALUES ($1, $2)
       ON CONFLICT (item_id, blocked_on) DO NOTHING`,
      [itemId, date]
    );
  },

  async remove(itemId: string, date: string, ownerId: string): Promise<void> {
    await assertOwnsItem(itemId, ownerId);
    await pool.query(
      `DELETE FROM public.blocked_dates WHERE item_id = $1 AND blocked_on = $2`,
      [itemId, date]
    );
  },
};
