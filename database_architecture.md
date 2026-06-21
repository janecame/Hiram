# Hiram — Database Architecture

Platform: **Local PostgreSQL 15 + PostGIS**
Target: Phase 2 migration and beyond.

---

## Stack

| Layer | Choice |
|---|---|
| Database | Local PostgreSQL 15 (already available) |
| Driver | `pg` (node-postgres) |
| Geo | PostGIS (`GEOGRAPHY(Point, 4326)`) |
| Auth | JWT-based session auth (no external auth service) |
| Storage | Local / S3-compatible (Phase 3+) |
| Realtime | Phase 3+ |
| Migrations | SQL files in `backend/migrations/`; apply via `psql` |

---

## Schema overview

```
public.users
    │
    └── public.items
                    │
                    └── public.requests
                            │
                            ├── public.messages
                            ├── public.blocked_dates
                            ├── public.payments
                            └── public.reviews
                                        │
                                        └── public.claims
```

---

## Enums

```sql
CREATE TYPE account_type      AS ENUM ('solo', 'business');
CREATE TYPE item_category     AS ENUM ('tools', 'outdoor', 'events', 'electronics', 'appliances');
CREATE TYPE item_condition    AS ENUM ('like-new', 'good', 'fair');
CREATE TYPE item_status       AS ENUM ('available', 'unavailable', 'reserved');
CREATE TYPE request_status    AS ENUM ('pending', 'approved', 'declined', 'cancelled', 'completed');
CREATE TYPE payment_status    AS ENUM ('pending', 'captured', 'released', 'refunded', 'failed');
CREATE TYPE claim_status      AS ENUM ('open', 'resolved', 'dismissed');
```

---

## Tables

### `public.users`

Stand-alone users table; no dependency on an external auth service.

```sql
CREATE TABLE public.users (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     text        NOT NULL,
  email                    text        NOT NULL UNIQUE,
  password_hash            text        NOT NULL,
  account_type             account_type NOT NULL DEFAULT 'solo',
  phone                    text,
  address                  text,
  id_submitted             boolean     NOT NULL DEFAULT false,
  business_docs_submitted  boolean     NOT NULL DEFAULT false,
  verified                 boolean     NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now()
);
```

| Column | Notes |
|---|---|
| `id` | UUID primary key, generated server-side |
| `email` | Used for login; unique |
| `password_hash` | bcrypt hash; never returned to clients |
| `name` | Display name |
| `account_type` | `solo` or `business` |
| `phone` | PH format, e.g. `+63917...` |
| `address` | Free-text; full address or area |
| `id_submitted` | Government ID on file (unverified until Phase 2 admin review) |
| `business_docs_submitted` | Business papers (business accounts only) |
| `verified` | Set by admin after credential review |

---

### `public.items`

```sql
CREATE TABLE public.items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  category        item_category NOT NULL,
  condition       item_condition NOT NULL,
  status          item_status   NOT NULL DEFAULT 'available',
  description     text        NOT NULL,
  brand           text,
  price_per_day   numeric(10,2) NOT NULL CHECK (price_per_day > 0),
  price_per_hour  numeric(10,2)           CHECK (price_per_hour > 0),
  image_url       text,
  area            text        NOT NULL,
  location        geography(Point, 4326),
  requirements    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

| Column | Notes |
|---|---|
| `owner_id` | FK to `users.id`; replaces the mock `owner: string` name |
| `location` | PostGIS point. `NULL` until Phase 2 map picker lands |
| `area` | Human-readable area label (e.g. "Bacolod City"); retained alongside `location` for display |
| `image_url` | Public URL of uploaded image; falls back to category icon in UI when `NULL` |
| `status` | Phase 3: derived from approved requests + blocked dates via trigger; Phase 1–2: manually set |
| `price_per_hour` | Optional; lister may offer hourly rate |

> `distanceKm` is **not a column** — it is computed at query time with `ST_Distance(items.location, $userPoint)`.

> `rating` is **not a column** — it is a computed average joined from `reviews`. See [Item rating view](#item-rating-view).

---

### `public.requests`

Borrow requests submitted by a borrower for a specific item. Introduced in Phase 3.

```sql
CREATE TABLE public.requests (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      uuid          NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  borrower_id  uuid          NOT NULL REFERENCES public.users(id),
  lister_id    uuid          NOT NULL REFERENCES public.users(id),
  status       request_status NOT NULL DEFAULT 'pending',
  start_date   date          NOT NULL,
  end_date     date          NOT NULL,
  use_hours    boolean       NOT NULL DEFAULT false,
  message      text,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT   no_self_borrow CHECK (borrower_id <> lister_id),
  CONSTRAINT   valid_date_range CHECK (end_date >= start_date)
);
```

| Column | Notes |
|---|---|
| `lister_id` | Denormalized from `items.owner_id` for efficient RLS and notification queries |
| `use_hours` | `true` = duration is in hours (uses `price_per_hour`); `false` = daily rate |
| `status` flow | `pending` → `approved` or `declined`; approved can go to `completed` or `cancelled` |

---

### `public.messages`

One chat thread per request. Introduced in Phase 3 (Supabase Realtime).

```sql
CREATE TABLE public.messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid        NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  sender_id   uuid        NOT NULL REFERENCES public.users(id),
  body        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

### `public.blocked_dates`

Dates the lister manually marks as unavailable. Introduced in Phase 3.

```sql
CREATE TABLE public.blocked_dates (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid  NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  blocked_on date  NOT NULL,
  UNIQUE (item_id, blocked_on)
);
```

---

### `public.payments`

Payment record per approved request. Introduced in Phase 4.

```sql
CREATE TABLE public.payments (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid          NOT NULL UNIQUE REFERENCES public.requests(id),
  amount        numeric(10,2) NOT NULL CHECK (amount > 0),
  deposit       numeric(10,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  status        payment_status NOT NULL DEFAULT 'pending',
  provider      text          NOT NULL,
  provider_ref  text,
  created_at    timestamptz   NOT NULL DEFAULT now()
);
```

| Column | Notes |
|---|---|
| `amount` | Rental cost (rate × duration) |
| `deposit` | Security deposit set by lister; held during rental |
| `provider` | e.g. `paymongo` |
| `provider_ref` | External payment ID from the gateway |

---

### `public.reviews`

Mutual post-rental ratings. Both parties rate after `request.status = 'completed'`. Introduced in Phase 4.

```sql
CREATE TABLE public.reviews (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid    NOT NULL REFERENCES public.requests(id),
  reviewer_id  uuid    NOT NULL REFERENCES public.users(id),
  reviewee_id  uuid    NOT NULL REFERENCES public.users(id),
  item_id      uuid    NOT NULL REFERENCES public.items(id),
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_id)
);
```

---

### `public.claims`

Damage claims filed by the lister after a rental. Introduced in Phase 4.

```sql
CREATE TABLE public.claims (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid         NOT NULL REFERENCES public.requests(id),
  lister_id     uuid         NOT NULL REFERENCES public.users(id),
  description   text         NOT NULL,
  evidence_urls text[]       NOT NULL DEFAULT '{}',
  status        claim_status NOT NULL DEFAULT 'open',
  created_at    timestamptz  NOT NULL DEFAULT now()
);
```

---

## Item rating view

`rating` on an item is computed, not stored. Add a view (or use inline SQL) to avoid stale aggregates:

```sql
CREATE VIEW public.item_ratings AS
SELECT
  item_id,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(*)                        AS review_count
FROM public.reviews
GROUP BY item_id;
```

Query item with rating:

```sql
SELECT i.*, ir.avg_rating, ir.review_count
FROM public.items i
LEFT JOIN public.item_ratings ir ON ir.item_id = i.id
WHERE i.id = $1;
```

---

## Geo queries

Distance from a user's current coordinates to each item:

```sql
SELECT
  i.*,
  ST_Distance(
    i.location,
    ST_MakePoint($userLon, $userLat)::geography
  ) / 1000 AS distance_km
FROM public.items i
WHERE ST_DWithin(
  i.location,
  ST_MakePoint($userLon, $userLat)::geography,
  $radiusMeters
)
ORDER BY distance_km;
```

"Sort by nearest" becomes `ORDER BY distance_km ASC`.

---

## Indexes

```sql
-- Browse page filters
CREATE INDEX idx_items_category   ON public.items (category);
CREATE INDEX idx_items_status     ON public.items (status);
CREATE INDEX idx_items_owner      ON public.items (owner_id);
CREATE INDEX idx_items_created    ON public.items (created_at DESC);

-- Geo queries
CREATE INDEX idx_items_location   ON public.items USING GIST (location);

-- Request lookups
CREATE INDEX idx_requests_item    ON public.requests (item_id);
CREATE INDEX idx_requests_borrower ON public.requests (borrower_id);
CREATE INDEX idx_requests_lister  ON public.requests (lister_id);
CREATE INDEX idx_requests_status  ON public.requests (status);

-- Chat
CREATE INDEX idx_messages_request ON public.messages (request_id, created_at);

-- Reviews
CREATE INDEX idx_reviews_item     ON public.reviews (item_id);
CREATE INDEX idx_reviews_reviewee ON public.reviews (reviewee_id);

-- Blocked dates
CREATE INDEX idx_blocked_item     ON public.blocked_dates (item_id);
```

---

## Authorization

There is no database-level RLS (that is a Supabase feature). Authorization is enforced in the Express layer via JWT middleware:

- Routes that mutate data require a valid JWT in the `Authorization: Bearer <token>` header.
- The JWT payload carries `userId`; controllers compare it against `owner_id` / `borrower_id` / `lister_id` as needed.
- Read routes (browse, item detail, public profiles) are open to unauthenticated requests.

Apply auth middleware selectively per route in `backend/src/routes/`. A shared `requireAuth` middleware extracts and verifies the JWT and attaches `req.user` for downstream controller use.

---

## Auth notes

User registration is handled entirely by the Express backend: the `POST /api/auth/register` route inserts directly into `public.users` with a bcrypt-hashed password. No database trigger is needed.

---

## Phase rollout

| Table | Phase |
|---|---|
| `users` | 2 |
| `items` | 2 |
| `requests` | 3 |
| `messages` | 3 |
| `blocked_dates` | 3 |
| `payments` | 4 |
| `reviews` | 4 |
| `claims` | 4 |

---

## Migration convention

Migration files live in `backend/migrations/`. Timestamp-prefixed SQL files:

```
backend/migrations/
  20260701000000_create_enums.sql
  20260701000001_create_users.sql
  20260701000002_create_items.sql
  20260701000003_create_requests.sql
  20260701000004_create_messages.sql
  20260701000005_create_blocked_dates.sql
  20260701000006_create_payments.sql
  20260701000007_create_reviews.sql
  20260701000008_create_claims.sql
  20260701000009_create_indexes.sql
  20260701000010_create_auth.sql
```

Apply with:

```bash
psql -U <user> -d hiram -f backend/migrations/<file>.sql
# or run all in order:
for f in backend/migrations/*.sql; do psql -U <user> -d hiram -f "$f"; done
```

---

## Phase 2 migration plan (mock → real)

1. Add `pg` to the backend workspace; create `backend/src/db.ts` with a connection pool (reads `DATABASE_URL` from env).
2. Apply migrations through `create_items` (Phase 2 scope only) against the local Postgres instance.
3. Seed from `backend/src/data/mock-items.ts`.
4. Replace `backend/src/models/item.model.ts` in-memory store with SQL queries via the `pg` pool — controller files do not change.
5. Enable the Vite dev proxy so `frontend/src/api/items.ts` calls the Express backend instead of using mock delays.
6. Wire JWT auth (`jsonwebtoken` + `bcryptjs`): add `POST /api/auth/register` and `POST /api/auth/login`; protect the `/list` route on the frontend; inject `owner_id` from the JWT payload on item creation.
7. Add PostGIS extension; replace the random `distanceKm` with `ST_Distance` computed at query time.