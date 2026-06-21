# Hiram Phase 2–4 Execution Plan

This plan is written for autonomous execution. All design decisions are already made — do not ask clarifying questions, execute the steps in order. Read this entire file before starting.

---

## Decisions locked in (do not deviate)

### Phase 2
- Database: local PostgreSQL, accessed via MCP postgres tool (`mcp__postgres__query`)
- Migrations: raw SQL files in `backend/migrations/`, applied via MCP postgres tool
- Seed: `npm run seed` script that reads `backend/src/data/mock-items.ts` and inserts via MCP
- **No PostGIS** — `distanceKm` stays as `Math.random()` for now
- Add `quantity` field to items (integer, default 1, min 1)

### Phase 3
- Request form: inline section on the existing item detail page (not a modal, not a new page)
- Lister inbox: new page `/dashboard` — shows pending requests to approve/decline + approved requests to mark completed
- Borrower history: new tab on existing profile page
- Lister marks a request "completed" (means item was returned)
- Auto-decline logic: when a request is approved, count currently approved requests for that item. If count >= item.quantity, auto-decline all remaining pending requests for that item. If count < item.quantity, leave others pending.
- **No WebSocket chat** — skip messaging entirely for now

### Phase 4
- Reviews: borrower only (not mutual)
- Review prompt appears after lister marks request "completed" — borrower sees a "Leave a Review" button in their request history tab
- `item_ratings` view replaces mock `rating` field
- Damage claims: skipped entirely

---

## API Contracts (both backend and frontend must match these exactly)

### Types to add

**`Request` type** (add to `backend/src/types/request.ts` and `frontend/src/types/request.ts`):
```typescript
export type RequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed';

export interface BorrowRequest {
  id: string;
  itemId: string;
  itemTitle: string;       // joined from items
  itemArea: string;        // joined from items
  borrowerId: string;
  borrowerName: string;    // joined from users
  listerId: string;
  listerName: string;      // joined from users
  status: RequestStatus;
  startDate: string;       // ISO date string YYYY-MM-DD
  endDate: string;         // ISO date string YYYY-MM-DD
  useHours: boolean;
  message?: string;
  createdAt: string;
}

export interface NewRequestInput {
  itemId: string;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  useHours: boolean;
  message?: string;
}
```

**`Review` type** (add to `backend/src/types/review.ts` and `frontend/src/types/review.ts`):
```typescript
export interface Review {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;    // joined from users
  itemId: string;
  itemTitle: string;       // joined from items
  rating: number;          // 1–5
  comment?: string;
  createdAt: string;
}

export interface NewReviewInput {
  requestId: string;
  rating: number;
  comment?: string;
}
```

### Request endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/requests` | required | Borrower submits a borrow request |
| `GET` | `/api/requests?role=lister` | required | Lister's inbox (all requests where lister_id = me) |
| `GET` | `/api/requests?role=borrower` | required | Borrower's history (all requests where borrower_id = me) |
| `PATCH` | `/api/requests/:id/status` | required | Update status (approve/decline/complete/cancel) |

**POST /api/requests** request body: `NewRequestInput`
**POST /api/requests** response: `BorrowRequest`

**GET /api/requests** response: `BorrowRequest[]`

**PATCH /api/requests/:id/status** request body: `{ status: RequestStatus }`
**PATCH /api/requests/:id/status** response: `BorrowRequest`

Authorization rules enforced in controller:
- Only the borrower can cancel their own request
- Only the lister can approve, decline, or mark completed

### Blocked dates endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/items/:id/blocked-dates` | required | Lister marks a date unavailable |
| `DELETE` | `/api/items/:id/blocked-dates/:date` | required | Lister removes a blocked date |
| `GET` | `/api/items/:id/blocked-dates` | none | Get all blocked dates for an item |

Blocked date format: `YYYY-MM-DD` string.

### Review endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reviews` | required | Borrower submits a review (only after request is completed) |
| `GET` | `/api/reviews/item/:itemId` | none | All reviews for an item |

**POST /api/reviews** request body: `NewReviewInput`
Validation: request must exist, must be `completed`, `reviewer_id` must be the borrower. Only one review per request.

---

## Step 1 — Phase 2: Database Setup (Sequential — complete fully before Step 2)

### 1A. Create migration files

Create the directory `backend/migrations/` and write these files in order:

**`backend/migrations/001_create_enums.sql`**
```sql
CREATE TYPE account_type   AS ENUM ('solo', 'business');
CREATE TYPE item_category  AS ENUM ('tools', 'outdoor', 'events', 'electronics', 'appliances');
CREATE TYPE item_condition AS ENUM ('like-new', 'good', 'fair');
CREATE TYPE item_status    AS ENUM ('available', 'unavailable', 'reserved');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'declined', 'cancelled', 'completed');
```

**`backend/migrations/002_create_users.sql`**
```sql
CREATE TABLE public.users (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL,
  email                   text        NOT NULL UNIQUE,
  password_hash           text        NOT NULL,
  account_type            account_type NOT NULL DEFAULT 'solo',
  phone                   text,
  address                 text,
  id_submitted            boolean     NOT NULL DEFAULT false,
  business_docs_submitted boolean     NOT NULL DEFAULT false,
  verified                boolean     NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now()
);
```

**`backend/migrations/003_create_items.sql`**
```sql
CREATE TABLE public.items (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          text          NOT NULL,
  category       item_category NOT NULL,
  condition      item_condition NOT NULL,
  status         item_status   NOT NULL DEFAULT 'available',
  description    text          NOT NULL,
  brand          text,
  price_per_day  numeric(10,2) NOT NULL CHECK (price_per_day > 0),
  price_per_hour numeric(10,2)           CHECK (price_per_hour > 0),
  image_url      text,
  area           text          NOT NULL,
  requirements   text,
  quantity       integer       NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at     timestamptz   NOT NULL DEFAULT now()
);
```

**`backend/migrations/004_create_requests.sql`**
```sql
CREATE TABLE public.requests (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid           NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  borrower_id uuid           NOT NULL REFERENCES public.users(id),
  lister_id   uuid           NOT NULL REFERENCES public.users(id),
  status      request_status NOT NULL DEFAULT 'pending',
  start_date  date           NOT NULL,
  end_date    date           NOT NULL,
  use_hours   boolean        NOT NULL DEFAULT false,
  message     text,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT no_self_borrow  CHECK (borrower_id <> lister_id),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
```

**`backend/migrations/005_create_blocked_dates.sql`**
```sql
CREATE TABLE public.blocked_dates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  blocked_on date NOT NULL,
  UNIQUE (item_id, blocked_on)
);
```

**`backend/migrations/006_create_reviews.sql`**
```sql
CREATE TABLE public.reviews (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid     NOT NULL REFERENCES public.requests(id),
  reviewer_id uuid     NOT NULL REFERENCES public.users(id),
  item_id     uuid     NOT NULL REFERENCES public.items(id),
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_id)
);

CREATE VIEW public.item_ratings AS
SELECT
  item_id,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(*)                        AS review_count
FROM public.reviews
GROUP BY item_id;
```

**`backend/migrations/007_create_indexes.sql`**
```sql
CREATE INDEX idx_items_category  ON public.items (category);
CREATE INDEX idx_items_status    ON public.items (status);
CREATE INDEX idx_items_owner     ON public.items (owner_id);
CREATE INDEX idx_items_created   ON public.items (created_at DESC);
CREATE INDEX idx_requests_item   ON public.requests (item_id);
CREATE INDEX idx_requests_borrower ON public.requests (borrower_id);
CREATE INDEX idx_requests_lister ON public.requests (lister_id);
CREATE INDEX idx_requests_status ON public.requests (status);
CREATE INDEX idx_reviews_item    ON public.reviews (item_id);
CREATE INDEX idx_blocked_item    ON public.blocked_dates (item_id);
```

### 1B. Apply migrations via MCP postgres tool

Run each migration file's SQL content through `mcp__postgres__query` in order (001 through 007). Verify each succeeds before running the next.

### 1C. Update Item type to include `quantity`

- `backend/src/types/item.ts` — add `quantity: number` field
- `frontend/src/types/item.ts` — add `quantity: number` field (default display: 1)
- `backend/src/data/mock-items.ts` — add `quantity: 1` to all seed items
- `frontend/src/data/mock-items.ts` — add `quantity: 1` to all seed items
- `backend/src/models/item.model.ts` — include `quantity` in INSERT and rowToItem
- `frontend/src/schemas/item-form.ts` — add `quantity: z.coerce.number().int().min(1).default(1)`
- `frontend/src/pages/ListItemPage.tsx` — add quantity field (MUI TextField, type number, min 1, default 1, placed before or after price fields)

### 1D. Update item creation to accept quantity

In `backend/src/controllers/item.controller.ts`, pass `input.quantity` to `ItemModel.create()`.
In `backend/src/models/item.model.ts`, include `quantity` in the INSERT statement.

### 1E. Write and run seed script

Create `backend/src/data/seed.ts`:
- Reads `MOCK_ITEMS` from `mock-items.ts`
- For each item, first look up or insert a placeholder user (name: item.owner, email: `${slug(item.owner)}@hiram.test`, password_hash: bcrypt hash of "password123", account_type: 'solo')
- Then insert the item linked to that user's id
- Run via `npx tsx backend/src/data/seed.ts`
- Add `"seed": "tsx src/data/seed.ts"` to `backend/package.json` scripts

After seeding, verify `GET /api/items` returns items from the DB.

---

## Step 2 — Phase 3: Borrow Request Flow (Two parallel worktrees)

**Wait for Step 1 to be fully complete and committed before spawning these.**

Spawn two worktree agents simultaneously with `isolation: "worktree"`.

---

### Worktree A — `feat/phase3-backend`

**Goal:** All backend routes, controllers, and models for requests, blocked dates. No frontend changes.

#### A1. Add new type files

Create `backend/src/types/request.ts` with `BorrowRequest`, `NewRequestInput`, `RequestStatus` as defined in the API contracts section above.

Create `backend/src/types/review.ts` with `Review`, `NewReviewInput` as defined above.

#### A2. Request model — `backend/src/models/request.model.ts`

Implement `RequestModel` with these methods:

```typescript
RequestModel.create(input: NewRequestInput, borrowerId: string): Promise<BorrowRequest>
RequestModel.findAll(filters: { role: 'lister' | 'borrower'; userId: string }): Promise<BorrowRequest[]>
RequestModel.findById(id: string): Promise<BorrowRequest | undefined>
RequestModel.updateStatus(id: string, status: RequestStatus, actorId: string): Promise<BorrowRequest>
```

The `updateStatus` method must:
1. Verify the actor is authorized (lister can approve/decline/complete; borrower can cancel)
2. On `approved`: count existing approved requests for the same item. If count >= item.quantity, auto-decline all other pending requests for that item (UPDATE requests SET status='declined' WHERE item_id=$x AND status='pending' AND id != $approved_id)
3. On `completed`: do nothing extra (review prompt is handled by frontend)
4. Return the updated BorrowRequest with all joined fields

`findAll` joins `items` (for title, area) and `users` (for borrower name, lister name).

#### A3. Request controller — `backend/src/controllers/request.controller.ts`

```typescript
RequestController.create   // POST /api/requests
RequestController.list     // GET /api/requests
RequestController.updateStatus // PATCH /api/requests/:id/status
```

- All three require `requireAuth` middleware (attach via routes, not here)
- `create`: extract `borrowerId` from `req.user.userId`; look up item to get `lister_id`; call `RequestModel.create()`
- `list`: read `?role=lister|borrower` query param; call `RequestModel.findAll({ role, userId: req.user.userId })`
- `updateStatus`: call `RequestModel.updateStatus(id, status, req.user.userId)`; controller catches auth errors and returns 403

#### A4. Request routes — `backend/src/routes/requests.ts`

```typescript
router.post('/', requireAuth, RequestController.create)
router.get('/', requireAuth, RequestController.list)
router.patch('/:id/status', requireAuth, RequestController.updateStatus)
```

Mount in `backend/src/index.ts`: `app.use('/api/requests', requestRouter)`

#### A5. Blocked dates model — `backend/src/models/blocked-date.model.ts`

```typescript
BlockedDateModel.findByItem(itemId: string): Promise<string[]>         // returns YYYY-MM-DD[]
BlockedDateModel.add(itemId: string, date: string, ownerId: string): Promise<void>
BlockedDateModel.remove(itemId: string, date: string, ownerId: string): Promise<void>
```

`add` and `remove` verify the actor owns the item (JOIN with items table); throw 403 if not.

#### A6. Blocked dates controller + routes

Create `backend/src/controllers/blocked-date.controller.ts` and `backend/src/routes/blocked-dates.ts`:

```typescript
router.get('/api/items/:id/blocked-dates', BlockedDateController.list)           // no auth
router.post('/api/items/:id/blocked-dates', requireAuth, BlockedDateController.add)
router.delete('/api/items/:id/blocked-dates/:date', requireAuth, BlockedDateController.remove)
```

Mount in `backend/src/index.ts`.

---

### Worktree B — `feat/phase3-frontend`

**Goal:** All frontend UI for requests. No backend changes. Calls the API contracts defined above — the backend may not be merged yet, so handle loading/error states gracefully.

#### B1. Add frontend type file

Create `frontend/src/types/request.ts` with `BorrowRequest`, `NewRequestInput`, `RequestStatus` exactly matching the API contracts section.

#### B2. API layer — `frontend/src/api/requests.ts`

```typescript
export async function createRequest(input: NewRequestInput): Promise<BorrowRequest>
export async function listRequests(role: 'lister' | 'borrower'): Promise<BorrowRequest[]>
export async function updateRequestStatus(id: string, status: RequestStatus): Promise<BorrowRequest>
export async function getBlockedDates(itemId: string): Promise<string[]>
```

All use `fetch()` with `authHeaders()` (same pattern as `frontend/src/api/items.ts`).
`createRequest` and `updateRequestStatus` throw on 401 with message "Authentication required".

#### B3. TanStack Query hooks — `frontend/src/hooks/useRequests.ts`

```typescript
export function useRequests(role: 'lister' | 'borrower')  // query key: ['requests', role]
export function useCreateRequest()                          // mutation; invalidates ['requests']
export function useUpdateRequestStatus()                    // mutation; invalidates ['requests']
export function useBlockedDates(itemId: string)             // query key: ['blocked-dates', itemId]
```

#### B4. Request form on Item Detail page

In `frontend/src/pages/ItemDetailPage.tsx`, add a "Request to Borrow" section below the item details.

The section shows only when:
- Item status is `available`
- User is logged in (use `AuthContext`)
- The logged-in user is NOT the item owner

If user is not logged in: show a MUI `Alert` with "Sign in to request this item" and a login button.
If user is the owner: show nothing (owners cannot borrow their own items).

The form contains:
- Start date: MUI `TextField` type="date" with `InputLabelProps={{ shrink: true }}`
- End date: MUI `TextField` type="date"
- Hourly/Daily toggle: MUI `ToggleButtonGroup` with two options ("Daily", "Hourly") — only show "Hourly" if `item.pricePerHour` exists
- Message: MUI `TextField` multiline, optional, rows=3, placeholder "Any message for the lister? (optional)"
- Submit button: "Request to Borrow" — disabled while submitting; shows CircularProgress on load
- On success: show MUI `Alert` severity="success" "Request sent! The lister will review it."
- On error "Authentication required": redirect to `/` (auth modal will handle login in a future phase)

Validation (inline, no Zod needed here): start date required, end date required, end date >= start date.

#### B5. Dashboard page — `/dashboard`

Create `frontend/src/pages/DashboardPage.tsx`.

Add route in `frontend/src/App.tsx`: `<Route path="/dashboard" element={<DashboardPage />} />`
Add "Dashboard" link to the Header (only when logged in).

The page has two sections:

**Section 1: Pending Requests (approve/decline)**
- Fetches `useRequests('lister')`
- Shows requests where `status === 'pending'`
- Each row: item title, borrower name, date range, use_hours indicator, message preview
- Two action buttons: "Approve" (primary) and "Decline" (outlined, color error)
- On approve/decline: call `useUpdateRequestStatus()`, invalidate list

**Section 2: Active Rentals (mark completed)**
- Shows requests where `status === 'approved'`
- Each row: item title, borrower name, date range
- One action button: "Mark as Returned" — calls `updateRequestStatus(id, 'completed')`

Both sections show an empty state message when no items.
Show 8 `Skeleton` rows while loading.
If user is not logged in, redirect to `/`.

#### B6. Borrower history tab on Profile page

In `frontend/src/pages/ProfilePage.tsx` (or wherever the profile page is — check the existing file), add a "My Requests" tab alongside the existing "Listed Items" tab.

The tab shows `useRequests('borrower')` results in a list:
- Item title (link to `/item/:itemId`)
- Date range
- Status badge (MUI `Chip` with color: pending=default, approved=success, declined=error, completed=primary, cancelled=default)
- If `status === 'completed'` and no review yet (check via a `reviewedRequestIds` set in local state, cleared on page reload — full review tracking is Phase 4): show a "Leave a Review" button (disabled for now, will be wired in Phase 4)

---

## Step 3 — Phase 4: Reviews (Two parallel worktrees)

**Wait for Step 2 (both Phase 3 worktrees) to be merged before spawning these.**

---

### Worktree C — `feat/phase4-backend`

**Goal:** Reviews API. No frontend changes.

#### C1. Review model — `backend/src/models/review.model.ts`

```typescript
ReviewModel.create(input: NewReviewInput, reviewerId: string): Promise<Review>
ReviewModel.findByItem(itemId: string): Promise<Review[]>
ReviewModel.existsForRequest(requestId: string, reviewerId: string): Promise<boolean>
```

`create` validates:
- Request exists and status is `completed`
- `reviewerId` is the borrower of that request
- No existing review for this (requestId, reviewerId) pair — throw 409 if duplicate

#### C2. Review controller + routes

Create `backend/src/controllers/review.controller.ts` and `backend/src/routes/reviews.ts`:

```typescript
router.post('/', requireAuth, ReviewController.create)
router.get('/item/:itemId', ReviewController.findByItem)   // no auth
```

Mount in `backend/src/index.ts`: `app.use('/api/reviews', reviewRouter)`

#### C3. Update item queries to use `item_ratings` view

In `backend/src/models/item.model.ts`, the `findAll` and `findById` queries already join `public.item_ratings ir` — verify this join is present. The `rowToItem` function already reads `avg_rating`. No change needed if already correct; otherwise add the join.

---

### Worktree D — `feat/phase4-frontend`

**Goal:** Review form UI and real ratings display.

#### D1. Add frontend type file

Create `frontend/src/types/review.ts` with `Review`, `NewReviewInput` matching API contracts.

#### D2. API layer — `frontend/src/api/reviews.ts`

```typescript
export async function createReview(input: NewReviewInput): Promise<Review>
export async function getReviewsByItem(itemId: string): Promise<Review[]>
```

#### D3. TanStack Query hooks — `frontend/src/hooks/useReviews.ts`

```typescript
export function useReviews(itemId: string)   // query key: ['reviews', itemId]
export function useCreateReview()            // mutation; invalidates ['reviews', itemId] and ['items']
```

#### D4. Wire "Leave a Review" button on borrower history tab

In the Profile page borrower history tab (added in Phase 3 B6):
- Replace the disabled "Leave a Review" button with a working one
- On click: open a MUI `Dialog` with:
  - Heading: "Rate your experience"
  - MUI `Rating` component (1–5 stars, required)
  - MUI `TextField` multiline optional, "Share your experience (optional)"
  - Submit button — calls `useCreateReview()`
  - On success: close dialog, show success `Alert`, hide the button for that request

#### D5. Display real ratings on item card and detail page

In `frontend/src/components/ItemCard.tsx`:
- The `rating` field on `Item` is now a real number from the DB (or undefined if no reviews)
- If `rating` exists: show MUI `Rating` component (read-only, size="small", value={rating}, precision={0.1}) + `(reviewCount)` count — add `reviewCount` field to `Item` type for this
- If no rating: show "No reviews yet" in `variant="caption"` text

In `frontend/src/pages/ItemDetailPage.tsx`:
- Add a Reviews section below the item info
- Use `useReviews(item.id)` to fetch reviews
- Render each review: reviewer name, MUI `Rating` read-only, comment, date
- Show "No reviews yet" empty state if empty

#### D6. Add `reviewCount` to Item type

- `backend/src/types/item.ts` — add `reviewCount?: number`
- `frontend/src/types/item.ts` — add `reviewCount?: number`
- `backend/src/models/item.model.ts` — `rowToItem` reads `row['review_count']` as number

---

## Commit conventions

Each worktree agent must commit with descriptive messages following this pattern:
- `feat(phase2): run DB migrations and add quantity field`
- `feat(phase3-be): request and blocked-dates backend`
- `feat(phase3-fe): request form, dashboard, borrower history`
- `feat(phase4-be): reviews API and item_ratings view`
- `feat(phase4-fe): review form and real ratings display`

---

## What is explicitly out of scope for this plan

- WebSocket / real-time chat
- PostGIS / real distance calculation
- PayMongo payment integration
- Damage claims
- Admin tooling
- Credential verification
- Image upload service
- Mutual reviews (lister rating borrower)

Do not implement any of the above even if it seems natural to add them.
