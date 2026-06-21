import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import { MOCK_ITEMS } from "./mock-items";

/**
 * Seeds the database from MOCK_ITEMS.
 *
 * Each item's `owner` is a display name only (no real user yet), so for every
 * distinct owner we look up an existing user by name and reuse it, or insert a
 * placeholder user (email `<slug>@hiram.test`, password "password123").
 *
 * The script is idempotent and non-destructive: an owner that already exists is
 * reused, and an item that already exists (matched by title + owner) is skipped.
 * It is safe to run against a database that was already seeded — it will not
 * delete real users or listings.
 *
 * Run with:  npm run seed   (from backend/)
 */

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "user"
  );
}

async function findOrCreateUser(
  name: string,
  passwordHash: string
): Promise<{ id: string; created: boolean }> {
  const existing = await pool.query(
    `SELECT id FROM public.users WHERE name = $1 LIMIT 1`,
    [name]
  );
  if (existing.rows[0]) {
    return { id: existing.rows[0]["id"] as string, created: false };
  }

  const inserted = await pool.query(
    `INSERT INTO public.users (name, email, password_hash, account_type)
     VALUES ($1, $2, $3, 'solo')
     RETURNING id`,
    [name, `${slug(name)}@hiram.test`, passwordHash]
  );
  return { id: inserted.rows[0]["id"] as string, created: true };
}

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash("password123", 10);

  let usersCreated = 0;
  let itemsCreated = 0;
  let itemsSkipped = 0;

  for (const item of MOCK_ITEMS) {
    const owner = await findOrCreateUser(item.owner, passwordHash);
    if (owner.created) usersCreated++;

    const dup = await pool.query(
      `SELECT 1 FROM public.items WHERE title = $1 AND owner_id = $2`,
      [item.title, owner.id]
    );
    if (dup.rowCount && dup.rowCount > 0) {
      itemsSkipped++;
      continue;
    }

    await pool.query(
      `INSERT INTO public.items
         (owner_id, title, category, condition, status, description, brand,
          price_per_day, price_per_hour, image_url, area, requirements, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        owner.id,
        item.title,
        item.category,
        item.condition,
        item.status,
        item.description,
        item.brand ?? null,
        item.pricePerDay,
        item.pricePerHour ?? null,
        item.imageUrl ?? null,
        item.area,
        item.requirements ?? null,
        item.quantity ?? 1,
      ]
    );
    itemsCreated++;
  }

  console.log(
    `Seed complete — users created: ${usersCreated}, items created: ${itemsCreated}, items skipped (already present): ${itemsSkipped}`
  );
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
