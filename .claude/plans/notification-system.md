# Notification System Plan

## Context

The Hiram app already has a working borrow request flow (`requests` table, `PATCH /:id/status` route, JWT auth). What's missing is a **notifications layer** so that:
- The lister sees when a borrower submits a request
- The borrower sees when the lister approves or declines
- The lister sees when the borrower marks an item as returned
- The borrower sees when the lister confirms the return (completes)

The bell icon in the Header is already wired to a static popover — this plan replaces that static data with real API calls.

---

## What Already Exists (do not rebuild)

| Already built | Location |
|---|---|
| JWT auth + `requireAuth()` middleware | `backend/src/middleware/auth.ts` |
| `requests` table + `PATCH /:id/status` route | `backend/src/routes/requests.ts`, `request.controller.ts`, `request.model.ts` |
| `request_status` enum: `pending \| approved \| declined \| cancelled \| completed` | `backend/migrations/001_create_enums.sql` |
| Bell popover UI (static) | `frontend/src/components/Header.tsx` |

---

## Step 1 — Migration: add `return_requested` status + notifications table

**File to create:** `backend/migrations/008_notifications.sql`

```sql
-- Extend enum with return flow status
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'return_requested';

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,         -- 'request_received' | 'request_approved' | 'request_declined'
                                      -- | 'return_requested' | 'return_confirmed' | 'request_cancelled'
  message      TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT false,
  request_id   UUID REFERENCES requests(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_id, created_at DESC);
```

Claude writes this file. User runs it manually:
```bash
psql -d hiram_db -f backend/migrations/008_notifications.sql
```

---

## Step 2 — Backend type

**File to create:** `backend/src/types/notification.ts`

```typescript
export interface Notification {
  id: string;
  recipientId: string;
  type: 'request_received' | 'request_approved' | 'request_declined'
      | 'return_requested' | 'return_confirmed' | 'request_cancelled';
  message: string;
  read: boolean;
  requestId?: string;
  createdAt: string;
}
```

---

## Step 3 — Backend model

**File to create:** `backend/src/models/notification.model.ts`

Methods:
- `create(recipientId, type, message, requestId?)` — INSERT
- `findByRecipient(userId)` — SELECT ordered by `created_at DESC`, limit 20
- `markRead(id, userId)` — UPDATE read = true (guards that recipient_id matches)
- `markAllRead(userId)` — UPDATE all unread for this user
- `unreadCount(userId)` — SELECT COUNT where read = false

Uses the existing `db` pool from `backend/src/db.ts`.

---

## Step 4 — Trigger notifications inside the request controller

**File to modify:** `backend/src/controllers/request.controller.ts`

### 4a — On `POST /api/requests` (borrower submits)
After inserting the request, call:
```typescript
await NotificationModel.create(
  listerId,
  'request_received',
  `${borrowerName} wants to borrow your "${itemTitle}".`,
  newRequest.id
);
```

### 4b — On `PATCH /:id/status` — notify the other party based on new status

| New status | Recipient | Message |
|---|---|---|
| `approved` | borrower | `Your request for "${itemTitle}" was approved.` |
| `declined` | borrower | `Your request for "${itemTitle}" was declined.` |
| `cancelled` | lister | `${borrowerName} cancelled their request for "${itemTitle}".` |
| `return_requested` | lister | `${borrowerName} has marked "${itemTitle}" as returned. Please confirm.` |
| `completed` | borrower | `Your return of "${itemTitle}" was confirmed. Thanks for borrowing!` |

### 4c — Allow `return_requested` for borrowers
Currently borrowers can only set `cancelled`. Update the authorization check to also allow `return_requested` (only when current status is `approved`).

---

## Step 5 — Backend controller + routes

**File to create:** `backend/src/controllers/notification.controller.ts`

- `GET /api/notifications` — `requireAuth`, returns `findByRecipient(req.user.id)`
- `PATCH /api/notifications/:id/read` — `requireAuth`, calls `markRead(id, req.user.id)`
- `PATCH /api/notifications/read-all` — `requireAuth`, calls `markAllRead(req.user.id)`
- `GET /api/notifications/unread-count` — `requireAuth`, returns `{ count }`

**File to create:** `backend/src/routes/notifications.ts`  
**File to modify:** `backend/src/index.ts` — mount router at `/api/notifications`

---

## Step 6 — Frontend type + API layer

**File to create:** `frontend/src/types/notification.ts`  
Mirror of the backend type.

**File to create:** `frontend/src/api/notifications.ts`

```typescript
export async function getNotifications(): Promise<Notification[]>
export async function getUnreadCount(): Promise<number>
export async function markRead(id: string): Promise<void>
export async function markAllRead(): Promise<void>
```

All calls include `Authorization: Bearer <token>` (read token from auth context).

---

## Step 7 — Frontend hook

**File to create:** `frontend/src/hooks/useNotifications.ts`

TanStack Query wrapper:
- `useNotifications()` — query key `["notifications"]`, calls `getNotifications()`
- `useUnreadCount()` — query key `["notifications", "unread"]`, calls `getUnreadCount()`
- `useMarkRead()` — mutation, invalidates both keys on success
- Poll every 30s via `refetchInterval: 30_000`
- **No WebSocket** — real-time push is deferred to the final phase; polling is sufficient for now

---

## Step 8 — Wire Header.tsx to real data

**File to modify:** `frontend/src/components/Header.tsx`

- Replace `badgeContent={3}` on bell with `useUnreadCount()` result
- Replace `STATIC_NOTIFICATIONS` array with `useNotifications()` data
- Each notification item: clicking it calls `markRead(n.id)` and navigates to the related request if `requestId` is present
- "See all notifications" link → `/notifications` page (or `/dashboard` for now)
- Show "No notifications yet" empty state when list is empty

---

## Verification

1. Run migration: `psql -d hiram_db -f backend/migrations/008_notifications.sql`
2. Start dev servers: `npm run dev`
3. Log in as User A (lister), log in as User B (borrower) in another tab
4. User B submits a borrow request → bell badge on User A's header increments
5. User A approves → bell badge on User B's header increments
6. User B marks item returned (`return_requested`) → User A sees notification
7. User A marks completed → User B sees return confirmed notification
8. Clicking a notification marks it read; badge count decreases