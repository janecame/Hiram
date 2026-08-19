# Architecture Rules

## Data-flow law

```
pages / components  →  hooks/  →  api/  →  Express backend  →  PostgreSQL
```

- **Pages and components** call hooks, not `api/` modules.
- **Hooks** (`src/hooks/`) are TanStack Query wrappers. They own query keys, loading states, and mutations.
- **`src/api/`** modules go through the `apiFetch` wrapper in `api/_base.ts`. Paths carry a `/api` prefix; the Vite dev proxy forwards to `127.0.0.1:3101`.

### Documented exceptions

These bypass hooks deliberately — they are one-shot imperative calls with no cache to own. Do not "fix" them:

- `AuthContext.tsx` → `api/auth.ts` (`apiLogout`) and `api/users.ts` (`getCurrentUser`) — session bootstrap.
- `LoginPage` / `SignupPage` → `api/auth.ts` — credential submit.
- `ListItemPage` / `EditItemPage` → `api/upload.ts` — file upload during form submit.
- `ChatPanel` / `ChatPopup` → `api/messages.ts` (`createConversation`) — fired on open.
- `AdminPage` → `api/admin.ts` — admin screens call the API layer directly.
- Type-only imports (e.g. `SortKey` in `BrowsePage`, `FilterBar`) are always fine.

The law governs **our own backend only**. Direct `fetch()` to third-party APIs is expected and correct:
`ItemDetailPage` → OSRM routing, `PHLocationPicker` → PSGC address API.

## Auth (cookie-based)

There is no bearer token and nothing in `localStorage`. Do not reintroduce either.

- The backend sets an **httpOnly session cookie**; it is never readable from JS.
- Every request from `api/_base.ts` sends `credentials: "include"`.
- CSRF: the readable `hiram_csrf` cookie is echoed back as a request header by `apiFetch`.
- `cookie-parser` is mounted in `backend/src/index.ts`; `requireAuth` reads the session cookie.
- Revocation: `users.token_valid_after` (migration 024) invalidates sessions issued before that timestamp.
- `AuthContext` owns login/logout state and the login modal.

`API_BASE` comes from `VITE_API_BASE_URL`, defaulting to `""` (same-origin, via the proxy in dev).

## Backend layer

```
routes/  →  controllers/  →  models/  →  PostgreSQL (via pg pool in db.ts)
```

- **Routes** (`backend/src/routes/`) only wire HTTP verbs to controller methods — no logic. Currently clean across all 12 route files; keep it that way.
- **Controllers** (`backend/src/controllers/`) handle `req`/`res`; call model methods; never query the DB directly.
- **Models** (`backend/src/models/`) own all SQL. When schema changes, only model files change.
- `requireAuth` / `requireAdmin` middleware in `backend/src/middleware/auth.ts` guards protected routes.

> **Known deviation:** `admin.controller.ts` calls `pool.query` directly for stats and audit-log
> writes — there is no `admin.model.ts`. This is the one place the layering rule is broken.
> Do not copy the pattern into other controllers; extracting it into a model is an open cleanup task.

## Real-time

Socket.io server lives in `backend/src/socket.ts`. Authenticates on connect and tracks a `userId → Socket` map. Use `emitToUser(userId, event, data)` to push events server-side. Frontend connects via `useSocket` hook.

## Query keys (frontend)

- Items: `["items"]`, `["items", filters]`, `["items", "by-owner", owner]`, `["items", "by-owner-archived", owner]`, `["items", "suggestions", query]`
- Item detail: `["item", id]` — disabled when `id` is undefined
- Session: `["auth", "me"]`
- Users: `["user"]`, `["user", name]`, `["users", "search", q]`
- Requests: `["requests"]`, `["requests", role]`
- Blocked dates: `["blocked-dates", itemId]`
- Payments: `["payment"]`, `["payment", requestId]`
- Reviews: `["reviews", itemId]`, `["reviews", "user", userId]`
- Reports: `["my", "reports"]`, `["admin", "reports"]`, `["admin", "reports", status]`
- Notifications: `["notifications"]`, `["notifications", "unread"]`
- Conversations: `["conversations"]`, `["conversations", "unread"]`; messages: `["messages", conversationId]`

## Project structure

```
frontend/src/
  types/      item.ts, user.ts, request.ts, review.ts, notification.ts,
              message.ts, payment.ts, report.ts
  api/        _base.ts (apiFetch + CSRF), auth.ts, items.ts, users.ts, requests.ts,
              reviews.ts, notifications.ts, messages.ts, payments.ts, reports.ts,
              admin.ts, upload.ts
  hooks/      useItem.ts, useItems.ts, useUser.ts, useRequests.ts, useReviews.ts,
              useNotifications.ts, useMessages.ts, usePayments.ts, useReports.ts,
              useSocket.ts, useUserLocation.ts
  schemas/    item-form.ts           — Zod schema for list/edit item forms
  context/    SnackbarContext.tsx    — app-wide snackbar
  components/ Header, Footer, ItemCard, ItemCardSkeleton, FilterBar, EmptyState,
              StampBadge, StatusBadge, CategoryBlock, ConfirmDialog, DurationSelector,
              RequestForm, ReviewsSection, ChatPanel, ChatPopup, TermsGate,
              PHLocationPicker, LocationPicker
  pages/      BrowsePage, ItemDetailPage, ListItemPage, EditItemPage, ProfilePage,
              DashboardPage, MyItemsPage, MessagesPage, NotificationsPage,
              AdminPage, LoginPage, SignupPage, TermsPage
  theme/      theme.ts               — single MUI createTheme() with Hiram tokens
  lib/        format.ts              — formatPeso(), CATEGORY_VISUALS, other formatters
              uploadValidation.ts    — client-side file checks
  auth/       AuthContext.tsx        — session state, login modal
  data/       mock-items.ts, mock-users.ts   — legacy fixtures, not used by the running app
  test/       format.test.ts, setup.ts       — Vitest

backend/src/
  db.ts                              — pg pool (reads DATABASE_URL from env)
  socket.ts                          — Socket.io server, emitToUser()
  index.ts                           — app wiring and route mounts
  middleware/  auth.ts               — requireAuth, requireAdmin
  types/       item.ts, user.ts, request.ts, review.ts, notification.ts,
               message.ts, payment.ts, report.ts, express.d.ts
  routes/      items.ts, blocked-dates.ts, auth.ts, users.ts, requests.ts, reviews.ts,
               notifications.ts, messages.ts, payments.ts, reports.ts, upload.ts, admin.ts
  controllers/ item.controller.ts, blocked-date.controller.ts, auth.controller.ts,
               user.controller.ts, request.controller.ts, review.controller.ts,
               notification.controller.ts, message.controller.ts, payment.controller.ts,
               report.controller.ts, upload.controller.ts, admin.controller.ts
  models/      item.model.ts, blocked-date.model.ts, user.model.ts, request.model.ts,
               review.model.ts, notification.model.ts, message.model.ts,
               payment.model.ts, report.model.ts
  data/        mock-items.ts, seed.ts, run-migrations.ts
  __tests__/   item-types.test.ts    — Jest
```

Note: `routes/messages.ts` is mounted at `/api/conversations`. There is no `routes/conversations.ts`.

## Monorepo workspaces

Two packages — `frontend` and `backend` — share no source code. They share the same type shapes by convention, not by import. Do not create a shared `packages/` workspace.

## Ports

Frontend: `5173` (Vite dev server with proxy) · Backend: `3101` (Express)

## Production topology

- **Database:** Neon serverless Postgres (`neondb`), pooled endpoint, SSL required.
- **Frontend:** S3 + CloudFront, built with `VITE_API_BASE_URL` (`.github/workflows/deploy-frontend.yml`).
- **Backend:** Elastic Beanstalk, deployed as a zipped `dist/` bundle (`.github/workflows/deploy-backend.yml`).
- **Both deploy workflows are currently disabled** — push triggers are commented out and they only run via `workflow_dispatch`, pending master-ruleset testing. Re-enable the triggers before relying on auto-deploy.
- **In flight:** a Vercel-hosted frontend on the `deploy/vercel-frontend` branch (`frontend/vercel.json`, an SPA rewrite). Not yet the production path — do not document it as such until the AWS frontend workflow is retired.
