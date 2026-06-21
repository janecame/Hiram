# Project Scope

## Phase 1 — what is being built now

### Listing form (create item)
- Brand field, price per hour rate
- Image upload — falls back to category icon if none provided
- Manual address/location input; map picker and auto-detect are Phase 2

### Item detail page (borrow)
- Duration selector — hours or days
- Personal requirements displayed by lister
- Lister profile link
- Availability status badge
- Reviews section
- Chat (UI only; real messaging is Phase 2)

### Browse / item card
- Status badge — available / unavailable / reserved
- Rating display

### User profiles
- Profile page with listed items
- Account type: solo or business
- Credentials: email, phone, government ID; business papers for business accounts
- Credential verification is Phase 2

### Authorization
- Guests can browse and view listings
- Borrowing requires an account — guest is prompted to sign up or log in
- The "Request to Borrow" flow is functional UI backed by mock data only

## Out of scope (Phase 1)

Real database, real auth, payments, map picker, auto-detect geolocation, real-time messaging, meet-up location confirmation, credential verification, image storage service.

## Phase 2 — database migration

Phase 2 wires the backend to the **local PostgreSQL** instance (already available). Full schema is in `database_architecture.md`. Migration files go in `backend/migrations/`.

Steps:
1. Add `pg` to backend; create `backend/src/db.ts` connection pool (reads `DATABASE_URL` from env).
2. Apply migrations for `users` and `items` tables.
3. Seed from `backend/src/data/mock-items.ts`.
4. Replace `backend/src/models/item.model.ts` in-memory store with SQL — controllers stay the same.
5. Enable Vite dev proxy so `frontend/src/api/items.ts` calls Express instead of mock delays.
6. Add JWT auth (`jsonwebtoken` + `bcryptjs`): `POST /api/auth/register`, `POST /api/auth/login`; protect `/list` route.
7. Add PostGIS; replace random `distanceKm` with `ST_Distance` at query time.

See `roadmaps/` for the full phase breakdown.
