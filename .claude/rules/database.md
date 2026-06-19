# Database Rules

## Current phase: no database

All data is in-memory. There is no database, no migrations, and no ORM. Do not add database dependencies until Phase 2 is explicitly started.

## Mock data locations

- `frontend/src/data/mock-items.ts` — seed array used by `src/api/items.ts` in the browser
- `backend/src/data/mock-items.ts` — same seed data served via Express

These two files must stay in sync. When adding or changing seed items, update both.

## Planned Phase 2 stack

| Layer | Choice |
|---|---|
| Database | Supabase (PostgreSQL) |
| Geo queries | PostGIS — `ST_DWithin` for "items within X km" |
| Auth | Supabase Auth |
| File storage | Supabase Storage (item images) |
| Realtime | Supabase Realtime (future messaging) |

`distanceKm` is currently a random float. When PostGIS lands, it becomes a computed field from `ST_Distance(item.location, user.location)`.

## Migration workflow (Phase 2)

Migrations will live in `.claude/skills/generate-migration/` (directory placeholder already exists). SQL files go there; apply via Supabase CLI (`supabase db push`) or the dashboard.

## SQL guard

The `.claude/hooks/guard-sql.ps1` hook blocks `sqlcmd` calls containing `DROP TABLE`, `TRUNCATE TABLE`, `DROP DATABASE`, `INSERT INTO`, `UPDATE`, or `DELETE FROM`. To run those statements, execute them manually in a SQL client — Claude cannot run them.