# Plan: My Items actions, Notifications page, Profile verification badge + notify

## Context

Four related gaps in the Hiram app surfaced from real use:

1. **My Items** — a lister can view their items but cannot manage them. There is no way to remove a listing or temporarily hide it. We need per-item **Edit / Archive / Delete** actions plus an **Archived** list to recover hidden items.
2. **Notifications** — the "See all notifications" link in the bell popover navigates to `/dashboard` (request management), which is the wrong destination. There is no dedicated notifications view.
3. **Profile** — the Government ID row sits inside "Credentials & Verifications" and is noisy. We want it removed from that list; instead show a **Verified badge** beside the account-type chip when verified, and a **Verify** button beside "Edit Profile" when not.
4. **Verification feedback** — when an admin approves/rejects an ID, the user gets no notification. We need to notify them (the backend already has a notification + Socket.IO pipeline).

This is a real Postgres + Express + React/MUI app (not mock data). The notification/socket plumbing already exists and is reused, not rebuilt.

### Confirmed decisions
- Item actions UI: **three-dot (⋮) overflow menu** in the corner of each card.
- Archive model: **new `archived` boolean column** (orthogonal to `available/reserved/unavailable`). Browse excludes archived; Archived tab lists them; Delete is permanent.
- Verification notify: **both approved and rejected**.

---

## Part 1 — My Items: Edit / Archive / Delete + Archived list

### Backend

1. **Migration** `backend/migrations/015_add_item_archived.sql`:
   `ALTER TABLE public.items ADD COLUMN archived boolean NOT NULL DEFAULT false;`
   (Apply manually via psql — the SQL guard blocks DDL through the tool.)
2. **Types** — add `archived: boolean` to `Item` in both [backend/src/types/item.ts](backend/src/types/item.ts) and [frontend/src/types/item.ts](frontend/src/types/item.ts). Keep it out of `NewItemInput` (server-defaults to false), matching how `status` is omitted.
3. **Model** [backend/src/models/item.model.ts](backend/src/models/item.model.ts):
   - `rowToItem`: map `archived: row["archived"] as boolean`.
   - `findAll`: add an `archived` filter to `ListFilters`. **Default: exclude archived** (`i.archived = false`) so Browse and the normal owner query never show archived items. When `archived === true` is requested explicitly, return only archived (`i.archived = true`).
   - Add `setArchived(id, archived, ownerId)` and `deleteItem(id, ownerId)` — both owner-scoped with the same ownership check pattern as `update` (return `"not_found" | "forbidden"`). `deleteItem` does `DELETE FROM public.items WHERE id = $1` (separate from the existing admin-only `adminDeleteItem`).
4. **Controller** [backend/src/controllers/item.controller.ts](backend/src/controllers/item.controller.ts): add `setArchive` (PATCH body `{ archived: boolean }`) and `remove` (DELETE), mirroring `update`'s not_found/forbidden→404/403 handling. Pass `archived` query param through in `list`.
5. **Routes** [backend/src/routes/items.ts](backend/src/routes/items.ts):
   `router.patch("/:id/archive", requireAuth, ItemController.setArchive);`
   `router.delete("/:id", requireAuth, ItemController.remove);`

### Frontend

6. **API** [frontend/src/api/items.ts](frontend/src/api/items.ts):
   - Extend `getItemsByOwner(owner, opts?: { archived?: boolean })` to set `&archived=true` when requested.
   - Add `setItemArchived(id, archived)` (PATCH `/api/items/:id/archive`) and `deleteItem(id)` (DELETE `/api/items/:id`), reusing `authHeaders()`.
7. **Hooks** [frontend/src/hooks/useItems.ts](frontend/src/hooks/useItems.ts):
   - `useArchivedItemsByOwner(owner)` — query key `["items", "by-owner-archived", owner]`.
   - `useSetItemArchived()` and `useDeleteItem()` mutations, both invalidating `["items"]` on success (covers all owner + browse lists).
8. **ItemCard** [frontend/src/components/ItemCard.tsx](frontend/src/components/ItemCard.tsx): add an optional `menuItems?: { label; icon; onClick; danger? }[]` prop. When present, render an absolutely-positioned ⋮ `IconButton` (top-right, above the status chip, `zIndex` over the `CardActionArea`) that opens an MUI `Menu`. Use `e.preventDefault()/stopPropagation()` so the menu doesn't trigger the card's navigation link. No menu prop → card is unchanged (Browse, Profile keep current behavior).
9. **MyItemsPage** [frontend/src/pages/MyItemsPage.tsx](frontend/src/pages/MyItemsPage.tsx):
   - Tabs become **My Items | Archived | My Requests** (URL param `tab`: `''` | `archived` | `requests`).
   - `ItemsGrid` (active): pass `menuItems` = Edit (`navigate('/item/:id/edit')`), Archive (`useSetItemArchived` → true), Delete (opens confirm dialog).
   - New `ArchivedGrid`: uses `useArchivedItemsByOwner`; `menuItems` = Unarchive (set archived false), Delete. Empty state "No archived items".
   - Add a shared **Delete confirm dialog** (MUI `Dialog`, reuse the `ReviewDialog` styling pattern already in this file) — "Delete this item permanently? This cannot be undone."

---

## Part 2 — Notifications: dedicated "See all" page

1. **New page** `frontend/src/pages/NotificationsPage.tsx`: full-width `Container` list of the current user's notifications via `useNotifications()`. Each row mirrors the popover styling in [Header.tsx](frontend/src/components/Header.tsx) (unread dot/tint, `timeAgo`, message). Clicking a row marks it read (`useMarkRead`) and routes by type: `requestId` present → `/dashboard`; `id_verified`/`id_rejected` → `/profile/:name`. Include a "Mark all read" action (`useMarkAllRead`). Guard with `useAuth` → redirect home if unauthenticated (same pattern as MyItemsPage).
2. **Route** [frontend/src/App.tsx](frontend/src/App.tsx): add `<Route path="/notifications" element={<NotificationsPage />} />`.
3. **Header** [frontend/src/components/Header.tsx](frontend/src/components/Header.tsx): change "See all notifications" `onClick` from `navigate("/dashboard")` to `navigate("/notifications")`. Also update `handleNotifClick` so notifications without a `requestId` (verification ones) route to the user's profile instead of `/dashboard`.
4. **Full history (optional but recommended)**: add a `limit` query param to `GET /api/notifications` ([notification.controller.ts](backend/src/controllers/notification.controller.ts) + [notification.model.ts](backend/src/models/notification.model.ts) `findByRecipient(userId, limit)`), default 20. The page requests a larger limit (e.g. 100) via an extended `getNotifications({ limit })`; the Header keeps the default 20. Keep `["notifications"]` query key for the popover; use `["notifications", "all"]` for the page so they don't collide.

---

## Part 3 — Profile: remove Gov ID row, add Verified badge + Verify button

In [frontend/src/pages/ProfilePage.tsx](frontend/src/pages/ProfilePage.tsx):

1. **Remove** the `<IdVerificationRow>` from the Credentials & Verifications `Stack` (lines ~171–181). The `IdVerificationRow` component body can be deleted or repurposed into the dialog below.
2. **Verified badge** beside the account-type chip (the `Stack` at lines ~101–110): when `user.verificationStatus === "verified"`, render a success `Chip` `icon={<ShieldCheck size={15} />} label="Verified" color="success"`. Reuse existing lucide imports.
3. **Verify button** beside "Edit Profile" (header actions, lines ~120–141): when `isOwnProfile && verificationStatus !== "verified"`, show a `Button` "Verify" (`<ShieldCheck/>` icon). Label adapts: `pending` → "Verification Pending", `rejected` → "Re-verify ID". Clicking opens a **VerifyDialog**.
4. **VerifyDialog** (new local component, reusing the existing `useSubmitId` mutation + file-input logic moved out of `IdVerificationRow`):
   - `unsubmitted`/`rejected` → file picker + upload button; on success `auth.updateUser(updated)`.
   - `pending` → "Your ID is under review by an admin." message.
   - `rejected` → show `user.idRejectionReason` before the re-upload control.
   - Keeps the same `submitIdMutation.mutate(file, { onSuccess })` wiring already in ProfilePage.

No backend changes here — `POST /api/users/me/id` and the submit flow are unchanged.

---

## Part 4 — Notify user on verification approve/reject

1. **Notification types** — add `'id_verified' | 'id_rejected'` to the `NotificationType` union in both [frontend/src/types/notification.ts](frontend/src/types/notification.ts) and [backend/src/types/notification.ts](backend/src/types/notification.ts). The `notifications.type` column is plain `TEXT` (migration 008) and `request_id` is nullable, so **no DB migration is needed**.
2. **Admin controller** [backend/src/controllers/admin.controller.ts](backend/src/controllers/admin.controller.ts) `setUserVerification`: after `UserModel.setVerification(...)` succeeds, create + emit a notification (reusing the exact pattern in [request.controller.ts](backend/src/controllers/request.controller.ts) lines 34–40):
   - `verified` → `NotificationModel.create(user.id, 'id_verified', 'Your government ID was verified — you're all set!')` then `emitToUser(user.id, 'notification', notif)`.
   - `rejected` → `'id_rejected'`, message `` `Your ID was rejected: ${reason ?? 'see your profile for details'}.` ``.
   - `pending` → no notification.
   Add imports for `NotificationModel` and `emitToUser`.
3. Header/NotificationsPage already render any notification message generically; the type-based routing added in Part 2 sends these to the profile.

---

## Files touched (summary)

**Backend:** `migrations/015_add_item_archived.sql` (new), `types/item.ts`, `types/notification.ts`, `models/item.model.ts`, `models/notification.model.ts`, `controllers/item.controller.ts`, `controllers/notification.controller.ts`, `controllers/admin.controller.ts`, `routes/items.ts`.

**Frontend:** `types/item.ts`, `types/notification.ts`, `api/items.ts`, `api/notifications.ts`, `hooks/useItems.ts`, `hooks/useNotifications.ts`, `components/ItemCard.tsx`, `pages/MyItemsPage.tsx`, `pages/NotificationsPage.tsx` (new), `pages/ProfilePage.tsx`, `App.tsx`, `components/Header.tsx`.

---

## Verification (end-to-end)

Run `npm run dev` (backend 3001 + frontend 5173). After applying migration 015 via psql:

1. **My Items**: as a logged-in lister, open `/my-items`. On a card, ⋮ → **Archive** → item leaves the list and is gone from Browse `/`. Switch to **Archived** tab → it appears → ⋮ → **Unarchive** restores it. ⋮ → **Delete** → confirm → item is permanently gone (verify it 404s at `/item/:id`).
2. **Notifications**: click the bell → "See all notifications" now lands on `/notifications` (not `/dashboard`) and lists history. Clicking a request notification → `/dashboard`; a verification notification → your profile.
3. **Profile**: on your own profile, the Credentials list no longer shows Government ID. If unverified, a **Verify** button sits beside Edit Profile → opens dialog → upload ID → status becomes "pending". No Verified chip yet.
4. **Verification notify**: as admin (`/admin`), approve that pending ID. Log back in as the user → a bell notification "Your government ID was verified…" appears (Socket.IO pushes it live), the **Verified** chip shows beside the account type, and the Verify button is gone. Repeat with reject → "Your ID was rejected: <reason>" notification.

Type-check with `npm run build` before finishing.

---

## Apply order (for the new session)

1. Part 4 types + Part 1 types (shared type edits) → 2. Part 1 backend → 3. Part 4 admin notify → 4. Part 2 backend limit → 5. Part 1 frontend (api/hooks/ItemCard/MyItemsPage) → 6. Part 2 frontend (page/route/Header) → 7. Part 3 ProfilePage → 8. `npm run build`. Migration 015 must be applied to the DB manually via psql before testing.