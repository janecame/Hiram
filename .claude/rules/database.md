# Database Rules

## Current state: live PostgreSQL on Neon

Migrated from AWS RDS to Neon (serverless Postgres, `neondb`) in August 2026 via `pg_dump --schema-only` + `psql` restore. The old RDS connection string is preserved as `AWS_RDS_DATABASE_URL` in `backend/.env` but is no longer active.

Driver: `pg` (node-postgres). No ORM — raw SQL only. PostGIS is installed and active.
Connection pool lives in `backend/src/db.ts`, reads `DATABASE_URL` from env (Neon, pooled endpoint, SSL required).

## Live tables

| Table | Key columns |
|---|---|
| `users` | id (uuid), name, email, password_hash, account_type, phone, address, avatar_url, default_province, default_city, default_barangay, default_province_code, default_city_code, default_barangay_code, default_address_detail, default_meetup, default_lat, default_lng, id_submitted, business_docs_submitted, verified, verification_status, id_image_url, id_rejection_reason, is_admin, disabled, disabled_reason, terms_accepted_at, token_valid_after, created_at |
| `items` | id (uuid), owner_id (FK users), title, category, condition, status, description, brand, price_per_day, price_per_hour, image_url, area, province, city, barangay, province_code, city_code, barangay_code, address_detail, location (geography), requirements, quantity, archived, disabled, disabled_reason, created_at |
| `requests` | id, item_id, borrower_id, lister_id, status (request_status enum), start_date, end_date, proposed_start_date, proposed_end_date, use_hours, message, created_at |
| `blocked_dates` | id, item_id, blocked_on (date), UNIQUE(item_id, blocked_on) |
| `reviews` | id, request_id, reviewer_id, item_id, rating (1–5), comment, review_type, created_at |
| `notifications` | id, recipient_id, type (text), message, read, request_id, created_at |
| `conversations` | id, item_id, borrower_id, lister_id, UNIQUE(item_id, borrower_id, lister_id) |
| `messages` | id, conversation_id, sender_id, content, read, created_at |
| `reports` | id, request_id, reporter_id, reported_id, reason, description, status (text, default `open`), resolution_note, created_at |
| `payments` | id, request_id (UNIQUE), borrower_id, lister_id, amount numeric(10,2), status (payment_status), method (payment_method), paymongo_checkout_session_id (UNIQUE), paymongo_payment_id, checkout_url, paid_at, created_at |
| `admin_audit_log` | id, admin_id (FK users, ON DELETE SET NULL), target_type, target_id, action, reason, created_at |

Views: `public.item_ratings` (avg_rating, review_count per item_id)

Enums:
- `account_type` — solo, business
- `item_category` — tools, outdoor, events, electronics, appliances
- `item_condition` — like-new, good, fair
- `item_status` — available, unavailable, reserved
- `request_status` — pending, approved, declined, cancelled, completed, `return_requested` (added in 008), `counter_offered` (added in 016)
- `verification_status` — unsubmitted, pending, verified, rejected (014)
- `payment_status` — pending, paid, failed, refunded, expired (022)
- `payment_method` — paymongo, cash (023)

## PostGIS

`items.location` is `geography`. Usage:
- `findAll` — `ST_Distance(i.location, ST_MakePoint($lng, $lat)::geography)` when userLat/userLng present
- `create` / `update` — `ST_MakePoint(lng, lat)::geography`
- `findById` — `ST_Y(i.location::geometry)` → lat, `ST_X(i.location::geometry)` → lng

## Migration workflow

- SQL files live in `backend/migrations/`, applied in filename order by `npm run migrate` (idempotent runner, `src/data/run-migrations.ts`).
- **24 migrations applied. Next migration is numbered `025`.**
- Write idempotent SQL (`IF NOT EXISTS`; `ALTER TYPE ... ADD VALUE IF NOT EXISTS` for enum values, wrapped in a `DO $$ ... EXCEPTION WHEN duplicate_object` block for new types).
- Always include `created_at TIMESTAMPTZ DEFAULT NOW()` on new tables.
- The `guard-sql.ps1` hook blocks destructive `psql` statements (DROP/TRUNCATE/DELETE/UPDATE/INSERT). Run DDL migrations via `npm run migrate`, or manually via `psql` if the guard blocks something intentional.

## Source of truth

**Always query `information_schema` via `mcp__postgres__query` to verify actual live columns** — do not trust migration files alone. The live DB and migration files can diverge. The table list above was reconstructed from migrations `001`–`024` during the 2026-08-19 audit while the Postgres MCP server was unavailable; re-verify against the live DB before relying on it for a schema change.

A `claims` table was referenced in older docs. It appears in **no** migration and **no** backend source as of 2026-08-19 — treat it as nonexistent unless the live DB says otherwise.

## Mock data

`backend/src/data/mock-items.ts` and `backend/src/data/seed.ts` are used by `npm run seed` to seed the DB from mock items. `frontend/src/data/mock-items.ts` and `mock-users.ts` are legacy fixtures the running app no longer uses — all frontend calls hit the Express backend.
