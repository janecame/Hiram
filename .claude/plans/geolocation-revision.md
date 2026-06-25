# Plan: Geolocation Revision — Manual Address + Map Pin + Road Directions

> Supersedes the GPS→PSGC auto-fill approach in `geolocation-feature.md`.
> **Status: NOT executed.** Saved for a fresh session to implement.

## Why this revision

The previous flow tried to auto-fill the PSGC dropdowns from `navigator.geolocation`
via Nominatim reverse-geocode. PSGC entries are keyed by **code**, but the geocoder
returns place **names**, so name-matching frequently conflicts/fails.

**Fix:** decouple the two concerns.
- **Address text = manual.** PSGC autocomplete (Province / City / Barangay) + one free-text
  detail field. No geocoding feeds the dropdowns.
- **Coordinates = the map pin.** `navigator.geolocation` drops the pin; the lister drags to
  adjust. The pin alone sets `lat`/`lng`. Saved so borrowers see the exact location.
- **Borrower side:** detail page shows real road directions (distance + ETA) from the
  borrower to the item.

---

## Confirmed decisions

1. **Address detail = single collapsed column** `address_detail` (block / lot / street /
   landmark all typed into one field). PSGC trio stays as separate columns.
2. **Migration applied via `psql`** — by the user, in a new session. Do NOT auto-run.
3. **Mandatory fields:** `province`, `city`, `barangay`, `lat`, `lng`.
   `address_detail` is optional. `area` remains the NOT-NULL composed display string.
4. **Routing:** direct OSRM demo fetch + react-leaflet `<Polyline>` (no
   `leaflet-routing-machine` plugin).

---

## Current state (verified against live DB)

Live `public.items` columns: `id, owner_id, title, category, condition, status,
description, brand, price_per_day, price_per_hour, image_url, area, location (geography,
nullable), requirements, created_at, quantity`.

- `area` is `text NOT NULL`; `location` is `geography` nullable.
- `ItemModel` already persists `lat`/`lng` as PostGIS via `ST_MakePoint(lng, lat)` and
  returns them via `ST_Y`/`ST_X` (create / update / findAll / findById).
- `findAll` computes `distance_km` with `ST_Distance` when `userLat`/`userLng` present.
- Backend seed: `backend/src/data/seed.ts` reads `backend/src/data/mock-items.ts`.
- `frontend/src/data/mock-items.ts` is legacy (API hits the backend) — leave untouched.
- Frontend deps `leaflet`, `react-leaflet@4`, `@types/leaflet` already installed — no new deps.

---

## Step 0 — Migration (USER runs this in the new session)

`backend/migrations/013_add_address_fields.sql`:

```sql
ALTER TABLE public.items
  ADD COLUMN province       text,
  ADD COLUMN city           text,
  ADD COLUMN barangay       text,
  ADD COLUMN address_detail text;
```

- All nullable so existing rows keep working; `area` stays NOT NULL and search
  (`i.area ILIKE`) is unaffected.
- Apply with `psql` (confirm `psql` is on PATH and the DB connection works first).
- The `mcp__postgres` tool is read-only and cannot run this; the `guard-sql.ps1` hook only
  blocks `sqlcmd`, not `psql`.

---

## Step 1 — Backend types (`backend/src/types/item.ts`)

Add to `Item` (auto-included in `NewItemInput` via `Omit`):

```ts
  province?: string;
  city?: string;
  barangay?: string;
  /** Block / lot / street / landmark — free text */
  addressDetail?: string;
```

(`area` and `lat`/`lng` already exist.)

---

## Step 2 — Backend model (`backend/src/models/item.model.ts`)

- `rowToItem`: map `province`, `city`, `barangay`, and `address_detail` →
  `addressDetail`.
- `create` INSERT: add the 4 columns to the column list + `VALUES` params.
- `update` SET: add the 4 columns with `COALESCE`/passthrough matching the existing style.
- `findAll` / `findById`: `SELECT i.*` already returns the new columns — no SQL change.

---

## Step 3 — Backend seed (`backend/src/data/mock-items.ts` + `seed.ts`)

- Add `province`, `city`, `barangay`, `addressDetail` to the seed item shape and the
  INSERT in `seed.ts` so re-seeding populates the new columns. Use coords already implied
  by existing `area` strings (e.g. Bacolod barangays) so seeded items have a pin.

---

## Step 4 — Frontend types (`frontend/src/types/item.ts`)

Mirror Step 1 exactly (manual sync — no shared package).

---

## Step 5 — Form schema (`frontend/src/schemas/item-form.ts`)

- `province`, `city`, `barangay`: required `z.string().min(1, ...)`.
- `addressDetail`: `z.string().optional()`.
- `lat`, `lng`: **required** `z.number(...)` (change from optional) with a message like
  "Set the item location on the map".

---

## Step 6 — `PHLocationPicker` (`frontend/src/components/PHLocationPicker.tsx`)

- **Remove** the Nominatim forward-geocode block in `handleBarangayChange` and the
  `onCoordsChange` prop.
- **Remove** the `autoFillProvince` / `autoFillCity` props + their effects and the
  `lastAuto*` refs (the name→code matching that caused the conflict).
- Change the upward callback to emit the selected PSGC names, e.g.
  `onChange({ province, city, barangay })` (or three setters). Parent composes `area`.
- Keep the cascading province → city → barangay fetch logic as-is otherwise.

---

## Step 7 — ListItemPage + EditItemPage

(`frontend/src/pages/ListItemPage.tsx`, `frontend/src/pages/EditItemPage.tsx`)

- **Remove** the reverse-geocode logic in `handleDetectLocation` and the
  `autoFillProvince`/`autoFillCity` state — the detect button now only sets the map pin.
- Add a manual **Address detail** `TextField` (block / lot / street / landmark),
  bound via `register("addressDetail")`.
- Wire `PHLocationPicker` to set `province`/`city`/`barangay` form values.
- **Embed the Leaflet `LocationPicker`** (the existing click/drag map):
  - "Use my current location" → `navigator.geolocation.getCurrentPosition` → `setValue("lat"/"lng")` → pin appears.
  - Click/drag on the map updates `lat`/`lng`.
  - Show validation error when `lat`/`lng` unset on submit.
- On submit, compose `area` from the parts, e.g.
  `[addressDetail, barangay, city, province].filter(Boolean).join(", ")`, and send all
  fields + `lat`/`lng`.
- EditItemPage: prefill PSGC selections + `addressDetail` + existing pin from the loaded item.

---

## Step 8 — ItemDetailPage road directions (`frontend/src/pages/ItemDetailPage.tsx`)

- Keep reading borrower coords from `useUserLocation` / `sessionStorage`.
- When borrower coords + `item.lat`/`lng` are present, fetch OSRM:
  ```
  https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
  ```
  Use `routes[0].geometry` (GeoJSON) → `<Polyline>`, `routes[0].distance` (m) and
  `.duration` (s) → "≈ 3.2 km · 11 min driving".
- Render borrower + item `<Marker>`s and the route Polyline on a Leaflet map (extend
  `LocationMap` or add a `RouteMap`).
- Fallbacks: if borrower location denied → show item-only map + haversine/backend
  `distanceKm`. If OSRM fails → straight `<Polyline>` + haversine distance.
- ⚠️ Production caveat: `router.project-osrm.org` is a demo server, not for production
  load — swap to hosted OSRM / OpenRouteService (API key) in a later phase.

---

## Step 9 — Sync docs

- Update `.claude/rules/data-model.md` Item table with the new fields.
- No change to `api/items.ts` signatures.

---

## Files to create / modify

| File | Action |
|---|---|
| `backend/migrations/013_add_address_fields.sql` | **Create** (user runs via psql) |
| `backend/src/types/item.ts` | Edit — 4 fields |
| `backend/src/models/item.model.ts` | Edit — rowToItem + create + update |
| `backend/src/data/mock-items.ts` | Edit — seed fields |
| `backend/src/data/seed.ts` | Edit — INSERT new columns |
| `frontend/src/types/item.ts` | Edit — mirror |
| `frontend/src/schemas/item-form.ts` | Edit — required PSGC + lat/lng, optional detail |
| `frontend/src/components/PHLocationPicker.tsx` | Edit — strip geocode/autofill, emit names |
| `frontend/src/pages/ListItemPage.tsx` | Edit — manual detail + pin map + compose area |
| `frontend/src/pages/EditItemPage.tsx` | Edit — same + prefill |
| `frontend/src/pages/ItemDetailPage.tsx` | Edit — OSRM route + Polyline |
| `.claude/rules/data-model.md` | Edit — document new fields |

## Out of scope

- Hosted/production routing backend (demo OSRM is fine for now).
- Storing block/lot/street/landmark as separate columns (collapsed into `address_detail`).
- PostGIS distance on `GET /api/items/:id` (frontend OSRM/haversine is enough).