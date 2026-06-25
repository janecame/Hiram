# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Hiram** (Tagalog for "borrow") — a peer-to-peer item rental marketplace for the Philippines. Web-first MVP. People list items they own for short-term rent; others nearby find and borrow them.

Current state: Phase 2 is live. Real PostgreSQL database (`hiram_db`), JWT auth, Socket.io real-time messaging, S3 image uploads, and a Vite dev proxy so the frontend hits the Express backend directly.

---

## Dev commands

All commands run from the repo root unless noted.

```bash
npm run dev          # start backend + frontend concurrently
npm run dev:fe       # frontend only  (Vite + proxy → localhost:5173)
npm run dev:be       # backend only   (nodemon/tsx → localhost:3001)
npm run build        # build all workspaces (tsc + vite build)
```

From `backend/`:
```bash
npm run migrate      # apply SQL migrations in backend/migrations/ (idempotent)
npm run seed         # seed DB from mock-items; creates placeholder users if needed
```

## Environment

`backend/.env` is required. Required keys:

| Key | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Defaults to 3001 if absent |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | S3 image upload |

Seed accounts: any `@seed.hiram.ph` email with password `password123`.

---

## Architecture

### Data flow

```
pages / components  →  hooks/  →  api/  →  Express backend  →  PostgreSQL
```

- Pages/components call hooks only. Never call `api/` directly from a component.
- Hooks (`src/hooks/`) are TanStack Query wrappers owning query keys, loading states, and mutations.
- `src/api/` modules use `fetch()` with a `/api` prefix — the Vite proxy forwards to `localhost:3001`.
- Auth token (`hiram_token`) is read from `localStorage` by each `api/` module. `AuthContext` manages login/logout state and the login modal.

### Backend layers

```
routes/  →  controllers/  →  models/  →  PostgreSQL (via `pg` pool in db.ts)
```

- Routes wire HTTP verbs to controller methods only — no logic.
- Controllers handle `req`/`res`; call model methods; never query the DB directly.
- Models own all SQL. When schema changes, only model files change.
- `requireAuth` / `requireAdmin` middleware in `backend/src/middleware/auth.ts` guards protected routes.

### Real-time

Socket.io server lives in `backend/src/socket.ts`. It authenticates via JWT on connect and tracks a `userId → Socket` map. Use `emitToUser(userId, event, data)` to push events server-side. The frontend connects via `useSocket` hook.

### Image uploads

`POST /api/upload` returns a pre-signed S3 URL. The frontend uploads directly to S3 and stores the resulting URL on the item.

### Database

16 migration files in `backend/migrations/`, applied in filename order by `npm run migrate`. The runner is idempotent — safe to re-run. Live schema: `users`, `items`, `requests`, `blocked_dates`, `reviews`, `notifications`, `messages`, `conversations` (+ enums and indexes). The `items` table has a `quantity` column added post-migration via the runner directly.

### Routes summary

| Prefix | Notes |
|---|---|
| `/api/auth` | `POST /register`, `POST /login` |
| `/api/users` | Profile CRUD, ID verification upload |
| `/api/items` | CRUD, archive, owner filter, paginated |
| `/api/items/:id/blocked-dates` | Lister-set unavailability |
| `/api/requests` | Borrow requests, counter-offer, status transitions |
| `/api/reviews` | Item + user reviews |
| `/api/notifications` | Per-user notification feed |
| `/api/conversations` | DM threads + messages |
| `/api/upload` | S3 pre-signed URL generation |
| `/api/admin` | User verification management |

### Frontend pages

| Route | Page |
|---|---|
| `/` | BrowsePage |
| `/item/:id` | ItemDetailPage |
| `/list` | ListItemPage |
| `/item/:id/edit` | EditItemPage |
| `/profile/:owner` | ProfilePage |
| `/dashboard` | DashboardPage (active requests) |
| `/my-items` | MyItemsPage |
| `/messages` | MessagesPage |
| `/notifications` | NotificationsPage |
| `/admin` | AdminPage (admin only, no footer) |

---

## Prompt Clarification Rule

- **Before acting on any user prompt**, paraphrase the request back to the user and ask: "Is this what you mean?" (or similar). Wait for confirmation before proceeding with implementation.
- This applies to all feature requests, bug fixes, and instructions — do not start coding until the user confirms.

## Modification Report Rule

- **After every completed task**, ask the user: "Would you like to see the list of edited files and lines?"
- If the user says **yes**, show the report in this exact format:

```
## ✅ Task Completed: [Task Name]

### Files Edited

| File | Line | Description |
|------|------|-------------|
| [Filename.tsx](path/to/file.tsx) | [28](path/to/file.tsx#L28) | Brief description of what changed |
```

- Every **File** and **Line** must be a clickable markdown link.
- Group lines under each file if multiple files were edited.

---

## Rules (`.claude/rules/`)

Detailed guidance lives in the rules files — all are auto-loaded:

| File | Covers |
|---|---|
| `architecture.md` | Data-flow law, backend layers, project structure, ports |
| `backend-style.md` | Express stack, route/controller/model conventions |
| `frontend-style.md` | MUI, typography, components, forms, routing, design tokens |
| `data-model.md` | Item + User field tables, field sync procedure |
| `database.md` | PostgreSQL phase, migration workflow, SQL guard |
| `scope.md` | Phase 1 features, out of scope, Phase 2 migration steps |
| `testing.md` | No tests yet; planned stack when added |
| `hooks.md` | Active Claude hooks, guards, custom commands |

> Note: several rules files still describe Phase 1 (mock data, no proxy). Trust this CLAUDE.md and the actual source files over those descriptions.
