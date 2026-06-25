import "dotenv/config";
import { Pool, types } from "pg";

// Return `date` columns (OID 1082) as the raw "YYYY-MM-DD" string instead of a
// JS Date at local midnight. Parsing to a Date and calling toISOString() shifts
// the day backwards in timezones ahead of UTC (e.g. PH UTC+8 turned 2026-10-10
// into 2026-10-09). Calendar dates have no timezone, so keep them as strings.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  ssl: { rejectUnauthorized: false },
});
