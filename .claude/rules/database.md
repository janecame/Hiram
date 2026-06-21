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
| Database | Local PostgreSQL (already available) |
| Driver | `pg` (node-postgres) |
| Geo queries | PostGIS — `ST_DWithin` for "items within X km" |
| Auth | JWT-based (no Supabase Auth) |
| File storage | Local or S3-compatible (Phase 3+) |
| Realtime | Phase 3+ |

`distanceKm` is currently a random float. When PostGIS lands, it becomes a computed field from `ST_Distance(item.location, user.location)`.

## Migration workflow (Phase 2)

Migration SQL files live in `backend/migrations/`. Apply with `psql` directly or a migration runner such as `node-pg-migrate`. No Supabase CLI.

## SQL guard

The `.claude/hooks/guard-sql.ps1` hook blocks `sqlcmd` calls containing `DROP TABLE`, `TRUNCATE TABLE`, `DROP DATABASE`, `INSERT INTO`, `UPDATE`, or `DELETE FROM`. To run those statements, execute them manually in a SQL client — Claude cannot run them.