# Backend Style Rules

## Stack

Express + TypeScript (CommonJS, ES2022 target). Run with `tsx` in dev via nodemon; compiled to `dist/` for production. Database: PostgreSQL via `pg` pool in `backend/src/db.ts`. Sessions use httpOnly cookies (`cookie-parser`), with `express-rate-limit` on sensitive routes.

## Route conventions

Each resource has its own route file mounted in `backend/src/index.ts`. Do not put logic in route files — they only wire HTTP verbs to controller methods.

| Route file | Mount point |
|---|---|
| `routes/auth.ts` | `/api/auth` |
| `routes/users.ts` | `/api/users` |
| `routes/items.ts` | `/api/items` |
| `routes/blocked-dates.ts` | `/api/items` (second mount on the same prefix) |
| `routes/requests.ts` | `/api/requests` |
| `routes/reviews.ts` | `/api/reviews` |
| `routes/notifications.ts` | `/api/notifications` |
| `routes/messages.ts` | `/api/conversations` |
| `routes/payments.ts` | `/api/payments` |
| `routes/reports.ts` | `/api/reports` |
| `routes/upload.ts` | `/api/upload` |
| `routes/admin.ts` | `/api/admin` |

There is no `routes/conversations.ts` — messaging lives in `routes/messages.ts`.

### Mount order matters

`/api/payments` is mounted **before** `express.json()` so the PayMongo webhook route can read the
raw request body for signature verification. Everything else is mounted after. Do not reorder these
mounts or add a global body parser above the payments mount — it silently breaks webhook signature
checks, which fail only in production.

## Controller / model pattern

- `routes/` — only wire HTTP verbs to controller methods, no business logic.
- `controllers/` — handle `req`/`res`; call model methods; never query the DB directly.
- `models/` — own all SQL. All DB access goes through the `pg` pool from `db.ts`.

> **Known deviation:** `admin.controller.ts` uses `pool.query` directly (stats counts, audit-log
> writes) because no `admin.model.ts` exists. It is the only controller that does. Do not copy the
> pattern; extracting it is an open cleanup task.

## Auth middleware

`requireAuth` and `requireAdmin` live in `backend/src/middleware/auth.ts`.

- Sessions are carried by an **httpOnly cookie**, not an `Authorization: Bearer` header.
- `requireAuth` — reads and verifies the session cookie, attaches `req.user = { userId, isAdmin }`.
- `requireAdmin` — runs after `requireAuth`, rejects non-admin users with 403.
- CSRF — the client echoes the readable `hiram_csrf` cookie as a request header.
- Revocation — `users.token_valid_after` rejects sessions issued before that timestamp.

Always declare these in the route file, not the controller.

## Request/response typing

- Type request bodies with `as YourType` after `req.body`.
- Always `return` after sending a response to avoid "headers already sent" errors.
- Ownership errors from model methods return `"not_found" | "forbidden"` — controllers map these to 404/403.

## Adding new fields to `Item`

See `data-model.md` for the full procedure.

## Image uploads — currently disabled

`upload.controller.ts` sets `UPLOADS_DISABLED = true` and returns **503** for every upload while S3
access is on hold. The S3 client and `POST /api/upload` route are still wired and the AWS env keys
are still read, so re-enabling is a one-line flip. Until then, treat image upload as unavailable —
new listings fall back to the category icon. Do not write docs or features that assume uploads work.

## CORS

`cors(corsOptions)` — a configured options object, not bare `cors()`. Allowed origins come from the
`ALLOWED_ORIGINS` env var (with `FRONTEND_URL` used for redirects). Credentials must stay enabled for
the session cookie to work cross-origin.
