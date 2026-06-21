# Data Model

## `Item`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `category` | `tools \| outdoor \| events \| electronics \| appliances` | |
| `description` | string | |
| `brand` | string (optional) | |
| `pricePerDay` | number | PHP |
| `pricePerHour` | number (optional) | PHP |
| `imageUrl` | string (optional) | falls back to category icon if absent |
| `distanceKm` | number | random float now; PostGIS in Phase 2 |
| `area` | string | e.g. "Bacolod City" |
| `owner` | string | name only; becomes `owner_id` (UUID) in Phase 2 |
| `condition` | `like-new \| good \| fair` | |
| `status` | `available \| unavailable \| reserved` | |
| `rating` | number (optional) | 0–5 average; computed from reviews in Phase 2 |
| `requirements` | string (optional) | personal requirements the lister sets for borrowers |
| `createdAt` | ISO string | |

Type constants (`CATEGORIES`, `CONDITIONS`, `CATEGORY_LABELS`, `CONDITION_LABELS`) live in `frontend/src/types/item.ts`. Always drive select options and labels from these — never hardcode strings.

## `User` (Phase 1 — mock only)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `accountType` | `solo \| business` | |
| `email` | string | |
| `phone` | string | |
| `address` | string | |
| `idSubmitted` | boolean | credential on file (unverified in Phase 1) |
| `businessDocsSubmitted` | boolean | for business accounts |
| `createdAt` | ISO string | |

## Adding new fields to `Item`

1. Update `backend/src/types/item.ts`
2. Update `frontend/src/types/item.ts` to match (no shared package — keep in sync manually)
3. Update `backend/src/data/mock-items.ts` seed data
4. Update `frontend/src/data/mock-items.ts` seed data

## Mock API contract (`frontend/src/api/items.ts`)

All functions return a `Promise` with a small artificial delay so TanStack Query behaves realistically. This is the **sole file** that changes when a real backend lands — signatures stay the same.

- `listItems(filters)` → `Item[]`
- `getItem(id)` → `Item | null`
- `createItem(input)` → `Item`
