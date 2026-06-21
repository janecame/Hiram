import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pool } from "../db";

/**
 * Applies the raw SQL migration files in backend/migrations/ in filename order.
 *
 * The migrations are not wrapped in a tracking table — instead this runner is
 * idempotent: "already exists" errors (duplicate type/table/index/object) are
 * logged and skipped, so it is safe to run against a database that was already
 * provisioned. After the base migrations it ensures the `quantity` column on
 * items exists (added after the original schema was first applied).
 */

// Postgres error codes that mean "this object is already there" — safe to skip.
const ALREADY_EXISTS = new Set([
  "42710", // duplicate_object (type, etc.)
  "42P07", // duplicate_table
  "42P06", // duplicate_schema
  "42723", // duplicate_function
  "42P16", // invalid_table_definition (duplicate view via CREATE)
  "42701", // duplicate_column
]);

async function run(): Promise<void> {
  const dir = join(__dirname, "..", "..", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    try {
      await pool.query(sql);
      console.log(`✓ applied ${file}`);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code && ALREADY_EXISTS.has(code)) {
        console.log(`• skipped ${file} (already applied: ${code})`);
      } else {
        console.error(`✗ failed ${file}:`, err);
        throw err;
      }
    }
  }

  // Ensure the quantity column exists (added after the original items schema).
  await pool.query(
    `ALTER TABLE public.items
       ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1`
  );
  await pool.query(
    `ALTER TABLE public.items
       DROP CONSTRAINT IF EXISTS items_quantity_check`
  );
  await pool.query(
    `ALTER TABLE public.items
       ADD CONSTRAINT items_quantity_check CHECK (quantity >= 1)`
  );
  console.log("✓ ensured items.quantity column + check constraint");

  await pool.end();
  console.log("Migrations complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
