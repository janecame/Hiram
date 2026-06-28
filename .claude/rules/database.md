# Database Rules

## Current state: live PostgreSQL on AWS RDS

Driver: `pg` (node-postgres). No ORM — raw SQL only. PostGIS is installed and active.
Connection pool lives in `backend/src/db.ts`, reads `DATABASE_URL` from env.

## Live tables

| Table | Key columns |
|---|---|
| `users` | id (uuid), name, email, password_hash, account_type, phone, address, id_submitted, business_docs_submitted, verified, verification_status, id_image_url, id_rejection_reason, is_admin, created_at |
| `items` | id (uuid), owner_id (FK users), title, category, condition, status, description, brand, price_per_day, price_per_hour, image_url, area, province, city, barangay, address_detail, location (geography), requirements, quantity, archived, created_at |
| `requests` | id, item_id, borrower_id, lister_id, status (request_status enum), start_date, end_date, use_hours, message, created_at |
| `blocked_dates` | id, item_id, blocked_on (date), UNIQUE(item_id, blocked_on) |
| `reviews` | id, request_id, reviewer_id, item_id, rating (1–5), comment, created_at |
| `notifications` | id, recipient_id, type (text), message, read, request_id, created_at |
| `conversations` | id, item_id, borrower_id, lister_id, UNIQUE(item_id, borrower_id, lister_id) |
| `messages` | id, conversation_id, sender_id, content, read, created_at |

Views: `public.item_ratings` (avg_rating, review_count per item_id)

Enums: `account_type`, `item_category`, `item_condition`, `item_status`, `request_status` (includes `return_requested`)

## PostGIS

`items.location` is `geography`. Usage:
- `findAll` — `ST_Distance(i.location, ST_MakePoint($lng, $lat)::geography)` when userLat/userLng present
- `create` / `update` — `ST_MakePoint(lng, lat)::geography`
- `findById` — `ST_Y(i.location::geometry)` → lat, `ST_X(i.location::geometry)` → lng

## Migration workflow

- SQL files live in `backend/migrations/`, applied in filename order by `npm run migrate` (idempotent runner).
- 16 migrations applied. Next migration is numbered `016+`.
- Write idempotent SQL (`IF NOT EXISTS`, `IF NOT EXISTS` for enum values).
- Always include `created_at TIMESTAMPTZ DEFAULT NOW()` on new tables.
- The `guard-sql.ps1` hook blocks `sqlcmd` DROP/TRUNCATE/INSERT/UPDATE/DELETE — run DDL migrations manually via `psql` or `npm run migrate`.

## Source of truth

**Always query `information_schema` via `mcp__postgres__query` to verify actual live columns** — do not trust migration files alone. The live DB and migration files can diverge.

## Mock data

`backend/src/data/mock-items.ts` and `backend/src/data/seed.ts` are used by `npm run seed` to seed the DB from mock items. The frontend no longer uses mock data directly — all API calls hit the Express backend via Vite proxy.
