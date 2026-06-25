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
| `distanceKm` | number | computed via PostGIS `ST_Distance` when user coords present; undefined otherwise |
| `lat` | number (optional) | from the map pin; stored as PostGIS `location`, returned via `ST_Y` |
| `lng` | number (optional) | from the map pin; stored as PostGIS `location`, returned via `ST_X` |
| `province` | string (optional) | PSGC province name (manual select) |
| `city` | string (optional) | PSGC city / municipality name (manual select) |
| `barangay` | string (optional) | PSGC barangay name (manual select) |
| `addressDetail` | string (optional) | block / lot / street / landmark — free text |
| `area` | string | NOT-NULL composed display string, e.g. "Barangay Villamonte, Bacolod City, Negros Occidental" |
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
| `idSubmitted` | boolean | government ID image on file |
| `businessDocsSubmitted` | boolean | for business accounts (unverified — Phase 2) |
| `verificationStatus` | `unsubmitted \| pending \| verified \| rejected` | manual admin review state for the government ID |
| `idImageUrl` | string (optional) | uploaded government-ID image (S3, `ids/` prefix); **stripped from public reads** — only the owner and admins receive it |
| `idRejectionReason` | string (optional) | reason shown to the user when an ID is rejected; also stripped from public reads |
| `createdAt` | ISO string | |

### ID verification flow

`unsubmitted → pending → verified / rejected` (rejected users may re-submit, which returns them to `pending`).

- User uploads an ID image on their profile → `POST /api/users/me/id` → status becomes `pending`.
- Admin reviews in the Admin panel → `PATCH /api/admin/users/:id/verification` with `{ status, reason? }`.
- The legacy `verified` boolean column is kept in sync (`= verification_status === 'verified'`).
- Status constants (`VERIFICATION_STATUSES`, `VERIFICATION_STATUS_LABELS`) live in `frontend/src/types/user.ts`.
- Migration: `backend/migrations/014_add_id_verification.sql`.

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
