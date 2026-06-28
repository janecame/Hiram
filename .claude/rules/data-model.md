# Data Model

## `Item`

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | server-generated |
| `title` | string | |
| `category` | `tools \| outdoor \| events \| electronics \| appliances` | |
| `description` | string | |
| `brand` | string (optional) | |
| `pricePerDay` | number | PHP |
| `pricePerHour` | number (optional) | PHP |
| `imageUrl` | string (optional) | S3 URL; falls back to category icon if absent |
| `distanceKm` | number (optional) | computed via PostGIS `ST_Distance` when user coords present |
| `lat` | number (optional) | stored as PostGIS `location` geography; returned via `ST_Y` |
| `lng` | number (optional) | stored as PostGIS `location` geography; returned via `ST_X` |
| `province` | string (optional) | PSGC province name |
| `city` | string (optional) | PSGC city / municipality name |
| `barangay` | string (optional) | PSGC barangay name |
| `addressDetail` | string (optional) | block / lot / street / landmark — free text |
| `area` | string | NOT-NULL composed display string, e.g. "Barangay Villamonte, Bacolod City" |
| `ownerId` | string (uuid) | FK → users.id |
| `condition` | `like-new \| good \| fair` | |
| `status` | `available \| unavailable \| reserved` | |
| `archived` | boolean | default false; Browse excludes archived items |
| `quantity` | number | integer ≥ 1; default 1 |
| `rating` | number (optional) | avg from `item_ratings` view; undefined if no reviews yet |
| `reviewCount` | number (optional) | from `item_ratings` view |
| `requirements` | string (optional) | personal requirements the lister sets for borrowers |
| `createdAt` | ISO string | |

Type constants (`CATEGORIES`, `CONDITIONS`, `CATEGORY_LABELS`, `CONDITION_LABELS`) live in `frontend/src/types/item.ts`. Always drive select options and labels from these — never hardcode strings.

## `User`

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `name` | string | |
| `accountType` | `solo \| business` | |
| `email` | string | |
| `phone` | string (optional) | |
| `address` | string (optional) | |
| `isAdmin` | boolean | default false; controls admin panel access |
| `idSubmitted` | boolean | government ID image on file |
| `businessDocsSubmitted` | boolean | for business accounts |
| `verified` | boolean | kept in sync with `verificationStatus === 'verified'` |
| `verificationStatus` | `unsubmitted \| pending \| verified \| rejected` | manual admin review state |
| `idImageUrl` | string (optional) | S3 URL (`ids/` prefix); **stripped from public reads** — owner and admins only |
| `idRejectionReason` | string (optional) | shown to user on rejection; also stripped from public reads |
| `createdAt` | ISO string | |

### ID verification flow

`unsubmitted → pending → verified / rejected` (rejected users may re-submit → back to `pending`)

- User uploads ID on their profile → `POST /api/users/me/id` → status becomes `pending`.
- Admin reviews in `/admin` → `PATCH /api/admin/users/:id/verification` with `{ status, reason? }`.
- On approve/reject, a notification is created and pushed via Socket.io (`emitToUser`).
- Status constants (`VERIFICATION_STATUSES`, `VERIFICATION_STATUS_LABELS`) live in `frontend/src/types/user.ts`.

## Adding new fields to `Item`

1. Write a migration SQL file in `backend/migrations/` (next number: 016+)
2. Update `backend/src/types/item.ts`
3. Update `frontend/src/types/item.ts` to match (no shared package — sync manually)
4. Update `backend/src/models/item.model.ts` — `rowToItem`, INSERT, UPDATE as needed
5. Update `backend/src/data/mock-items.ts` and `backend/src/data/seed.ts` if the field needs seeding
6. Apply the migration via `psql` or `npm run migrate`
