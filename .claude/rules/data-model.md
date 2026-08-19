# Data Model

Field tables below track the TypeScript types, which are kept in sync manually between
`backend/src/types/` and `frontend/src/types/` (no shared package). Verified 2026-08-19.

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
| `imageUrl` | string (optional) | S3 URL; falls back to category icon if absent. Uploads are currently disabled — see `backend-style.md` |
| `distanceKm` | number (optional) | computed via PostGIS `ST_Distance` when user coords present |
| `lat` | number (optional) | stored as PostGIS `location` geography; returned via `ST_Y` |
| `lng` | number (optional) | stored as PostGIS `location` geography; returned via `ST_X` |
| `province` | string (optional) | PSGC province name |
| `city` | string (optional) | PSGC city / municipality name |
| `barangay` | string (optional) | PSGC barangay name |
| `provinceCode` | string (optional) | stable PSGC code, so edit-form dropdowns can pre-select |
| `cityCode` | string (optional) | stable PSGC code |
| `barangayCode` | string (optional) | stable PSGC code |
| `addressDetail` | string (optional) | block / lot / street / landmark — free text |
| `area` | string | NOT-NULL composed display string, e.g. "Barangay Villamonte, Bacolod City" |
| `ownerId` | string (uuid) | FK → users.id |
| `owner` | string | owner display name, joined on read |
| `condition` | `like-new \| good \| fair` | |
| `status` | `available \| unavailable \| reserved` | |
| `archived` | boolean | default false; owner action. Browse excludes archived items |
| `disabled` | boolean | default false; **admin** action. Excluded from public browse |
| `disabledReason` | string (optional) | admin-supplied reason |
| `quantity` | number | integer ≥ 1; default 1 |
| `rating` | number (optional) | avg from `item_ratings` view; undefined if no reviews yet |
| `reviewCount` | number (optional) | from `item_ratings` view |
| `requirements` | string (optional) | personal requirements the lister sets for borrowers |
| `createdAt` | ISO string | |

`archived` (owner-hidden) and `disabled` (admin-suspended) are separate flags — do not conflate them.

Type constants (`CATEGORIES`, `CONDITIONS`, `CATEGORY_LABELS`, `CONDITION_LABELS`) live in `frontend/src/types/item.ts`. Always drive select options and labels from these — never hardcode strings.

### Known FE/BE drift

`NewItemInput` is **not** identical across the two workspaces. Both omit `id`, `createdAt`,
`distanceKm`, `status`, `rating`, `owner`, `ownerId`, `archived`, `disabled`, `disabledReason` —
but the backend also omits `reviewCount` and the frontend does not. The frontend can therefore
construct a payload carrying `reviewCount` that the backend contract does not accept. Sync these
before adding fields to either.

## `User`

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `name` | string | |
| `email` | string | |
| `accountType` | `solo \| business` | |
| `phone` | string | non-optional in the type |
| `address` | string | non-optional in the type |
| `avatarUrl` | string (optional) | profile photo |
| `defaultProvince` / `defaultCity` / `defaultBarangay` | string (optional) | default pickup PSGC names |
| `defaultProvinceCode` / `defaultCityCode` / `defaultBarangayCode` | string (optional) | default pickup PSGC codes |
| `defaultAddressDetail` | string (optional) | default pickup free text |
| `defaultMeetup` | string (optional) | preferred meetup note |
| `defaultLat` / `defaultLng` | number (optional) | default pickup coordinates |
| `idSubmitted` | boolean | government ID image on file |
| `businessDocsSubmitted` | boolean | for business accounts |
| `verificationStatus` | `unsubmitted \| pending \| verified \| rejected` | manual admin review state |
| `idImageUrl` | string (optional) | S3 URL (`ids/` prefix); **stripped from public reads** — owner and admins only |
| `idRejectionReason` | string (optional) | shown to user on rejection; also stripped from public reads |
| `isAdmin` | boolean | default false; controls admin panel access |
| `disabled` | boolean | admin-suspended account |
| `disabledReason` | string (optional) | admin-supplied reason |
| `termsAcceptedAt` | ISO string (optional) | drives the `TermsGate` component |
| `createdAt` | ISO string | |

There is **no** `verified` boolean on the TypeScript `User` type — use `verificationStatus === "verified"`. (A `verified` column does still exist on the `users` table; it is not surfaced in the type.)

The `users` table also carries `token_valid_after` (session revocation), which is not part of the public `User` type.

### ID verification flow

`unsubmitted → pending → verified / rejected` (rejected users may re-submit → back to `pending`)

- User uploads ID on their profile → `POST /api/users/me/id` → status becomes `pending`.
- Admin reviews in `/admin` → `PATCH /api/admin/users/:id/verification` with `{ status, reason? }`.
- On approve/reject, a notification is created and pushed via Socket.io (`emitToUser`).
- Status constants (`VERIFICATION_STATUSES`, `VERIFICATION_STATUS_LABELS`) live in `frontend/src/types/user.ts`.

## Adding new fields to `Item`

1. Write a migration SQL file in `backend/migrations/` (next number: **025**)
2. Update `backend/src/types/item.ts`
3. Update `frontend/src/types/item.ts` to match (no shared package — sync manually, including `NewItemInput`)
4. Update `backend/src/models/item.model.ts` — `rowToItem`, INSERT, UPDATE as needed
5. Update `backend/src/data/mock-items.ts` and `backend/src/data/seed.ts` if the field needs seeding
6. Apply the migration via `npm run migrate` (or `psql`)
