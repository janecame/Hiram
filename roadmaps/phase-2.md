# Phase 2 — Real Backend & Infrastructure

**Goal:** Replace all mock data with a real Supabase database. Add auth, image storage, maps, and location.

---

## Features

### Database — Supabase (PostgreSQL + PostGIS)
- Migrate items and users from in-memory mock to Supabase tables
- `distanceKm` becomes a real computed field via `ST_Distance` / `ST_DWithin` (PostGIS)
- Migrations live in `supabase/migrations/`

### Auth — Supabase Auth
- Email + password sign-up and login
- Session tokens; protected routes on frontend
- Guest browsing still allowed (same as Phase 1)
- `owner` field on items becomes a real `userId` FK

### Image upload — Supabase Storage
- Upload item images via the listing form
- Images stored in a Supabase Storage bucket
- `imageUrl` on `Item` points to a signed or public Supabase URL
- Falls back to category icon if no image (same UX as Phase 1)

### Map & location
- Map view on BrowsePage (Mapbox or Leaflet)
- Map picker on listing form — lister pins item location
- Auto-detect user location (browser Geolocation API) with manual fallback
- `location` field on `Item` — PostGIS `GEOGRAPHY(Point)` column

### Meet-up location confirmation
- Lister and borrower agree on a meet-up spot
- Shown on item detail page after a borrow request is accepted

### Credential verification (admin-side)
- Uploaded IDs and business papers are flagged for manual review
- `verified` status on user profile (boolean; set by admin)

---

## API changes

`frontend/src/api/items.ts` is the **only frontend file** that changes — swap fake `Promise` delays for real `fetch()` calls to Supabase REST or the Express backend (now connected to Supabase).

---

## Stack additions

| Addition | Purpose |
|---|---|
| Supabase JS SDK | DB, Auth, Storage client |
| PostGIS | Geo queries |
| Supabase CLI | Migrations, local dev |
| Mapbox GL JS or Leaflet | Map view & picker |
| Supabase Storage | Item image hosting |