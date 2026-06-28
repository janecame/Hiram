# Architecture Rules

## Data-flow law

```
pages / components  →  hooks/  →  api/  →  Express backend  →  PostgreSQL
```

- **Pages and components** never call `api/` directly. They only call hooks.
- **Hooks** (`src/hooks/`) are TanStack Query wrappers. They own query keys, loading states, and mutations.
- **`src/api/`** modules use `fetch()` with a `/api` prefix — the Vite dev proxy forwards to `localhost:3001`. In production, CloudFront routes `/api/*` to Elastic Beanstalk.
- Auth token (`hiram_token`) is read from `localStorage` by each `api/` module. `AuthContext` manages login/logout state and the login modal.

## Backend layer

```
routes/  →  controllers/  →  models/  →  PostgreSQL (via pg pool in db.ts)
```

- **Routes** (`backend/src/routes/`) only wire HTTP verbs to controller methods — no logic.
- **Controllers** (`backend/src/controllers/`) handle `req`/`res`; call model methods; never query the DB directly.
- **Models** (`backend/src/models/`) own all SQL. When schema changes, only model files change.
- `requireAuth` / `requireAdmin` middleware in `backend/src/middleware/auth.ts` guards protected routes.

## Real-time

Socket.io server lives in `backend/src/socket.ts`. Authenticates via JWT on connect and tracks a `userId → Socket` map. Use `emitToUser(userId, event, data)` to push events server-side. Frontend connects via `useSocket` hook.

## Query keys (frontend)

- Item list: `["items", filters]` — invalidated on `createItem` / `deleteItem` / `setArchived` success
- Item detail: `["item", id]` — disabled when `id` is undefined
- Requests: `["requests", role]`
- Notifications: `["notifications"]` and `["notifications", "unread"]`
- Reviews: `["reviews", itemId]`
- Conversations: `["conversations"]`, messages: `["messages", conversationId]`

## Project structure

```
frontend/src/
  types/      item.ts, user.ts, request.ts, review.ts, notification.ts, message.ts
  api/        items.ts, requests.ts, reviews.ts, notifications.ts, messages.ts, admin.ts, upload.ts
  hooks/      useItems.ts, useRequests.ts, useReviews.ts, useNotifications.ts,
              useMessages.ts, useSocket.ts, useUserLocation.ts
  schemas/    item-form.ts           — Zod schema for list/edit item forms
  components/ Header, ItemCard, FilterBar, EmptyState, ItemCardSkeleton,
              StampBadge, CategoryBlock, PHLocationPicker, LocationPicker, LocationMap
  pages/      BrowsePage, ItemDetailPage, ListItemPage, EditItemPage,
              ProfilePage, DashboardPage, MyItemsPage, MessagesPage,
              NotificationsPage, AdminPage
  theme/      theme.ts               — single MUI createTheme() with Hiram tokens
  lib/        format.ts              — formatPeso(), CATEGORY_VISUALS, other formatters
  auth/       AuthContext.tsx         — login/logout state, token storage

backend/src/
  db.ts                              — pg pool (reads DATABASE_URL from env)
  socket.ts                          — Socket.io server, emitToUser()
  middleware/  auth.ts               — requireAuth, requireAdmin
  types/       item.ts, user.ts, request.ts, review.ts, notification.ts, message.ts
  routes/      items.ts, auth.ts, users.ts, requests.ts, reviews.ts,
               notifications.ts, conversations.ts, upload.ts, admin.ts
  controllers/ item.controller.ts, auth.controller.ts, user.controller.ts,
               request.controller.ts, review.controller.ts, notification.controller.ts,
               message.controller.ts, admin.controller.ts
  models/      item.model.ts, user.model.ts, request.model.ts, review.model.ts,
               notification.model.ts, message.model.ts
  data/        mock-items.ts, seed.ts
```

## Monorepo workspaces

Two packages — `frontend` and `backend` — share no source code. They share the same type shapes by convention, not by import. Do not create a shared `packages/` workspace.

## Ports

Frontend: `5173` (Vite dev server with proxy) · Backend: `3001` (Express)
