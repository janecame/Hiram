import "dotenv/config";
import { Pool, types } from "pg";

// Return `date` columns (OID 1082) as the raw "YYYY-MM-DD" string instead of a
// JS Date at local midnight. Parsing to a Date and calling toISOString() shifts
// the day backwards in timezones ahead of UTC (e.g. PH UTC+8 turned 2026-10-10
// into 2026-10-09). Calendar dates have no timezone, so keep them as strings.
types.setTypeParser(1082, (value) => value);

// Prefer a real DATABASE_URL (Neon, which requires SSL); fall back to
// LOCAL_DATABASE_URL for local Postgres, which does not support SSL at all.
const connectionString = process.env["DATABASE_URL"] ?? process.env["LOCAL_DATABASE_URL"];
const ssl = process.env["DATABASE_URL"] ? { rejectUnauthorized: false } : false;

export const pool = new Pool({
  connectionString,
  ssl,
  // Neon scales to zero when idle, so a cold start can take well over 5 seconds.
  connectionTimeoutMillis: 15000,
});
