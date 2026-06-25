-- 013_add_address_fields.sql
-- Adds manual PSGC address columns + a free-text address detail column.
-- All nullable so existing rows keep working; `area` stays NOT NULL and the
-- search filter (i.area ILIKE) is unaffected.
--
-- Apply with psql (the mcp__postgres tool is read-only and cannot run this):
--   psql "$DATABASE_URL" -f backend/migrations/013_add_address_fields.sql

ALTER TABLE public.items
  ADD COLUMN province       text,
  ADD COLUMN city           text,
  ADD COLUMN barangay       text,
  ADD COLUMN address_detail text;
