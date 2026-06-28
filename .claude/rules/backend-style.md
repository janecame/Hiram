# Backend Style Rules

## Stack

Express + TypeScript (CommonJS, ES2022 target). Run with `tsx` in dev via nodemon; compiled to `dist/` for production. Database: PostgreSQL via `pg` pool in `backend/src/db.ts`.

## Route conventions

Each resource has its own route file mounted in `backend/src/index.ts`. Do not put logic in route files — they only wire HTTP verbs to controller methods.

Current route files and mount points:
- `routes/auth.ts` → `/api/auth`
- `routes/items.ts` → `/api/items`
- `routes/users.ts` → `/api/users`
- `routes/requests.ts` → `/api/requests`
- `routes/reviews.ts` → `/api/reviews`
- `routes/notifications.ts` → `/api/notifications`
- `routes/conversations.ts` → `/api/conversations`
- `routes/upload.ts` → `/api/upload`
- `routes/admin.ts` → `/api/admin`

## Controller / model pattern

- `routes/` — only wire HTTP verbs to controller methods, no business logic.
- `controllers/` — handle `req`/`res`; call model methods; never query the DB directly.
- `models/` — own all SQL. All DB access goes through the `pg` pool from `db.ts`.

## Auth middleware

`requireAuth` and `requireAdmin` live in `backend/src/middleware/auth.ts`.
- `requireAuth` — verifies JWT from `Authorization: Bearer <token>` header, attaches `req.user = { userId, isAdmin }`.
- `requireAdmin` — runs after `requireAuth`, rejects non-admin users with 403.

Always declare these in the route file, not the controller.

## Request/response typing

- Type request bodies with `as YourType` after `req.body`.
- Always `return` after sending a response to avoid "headers already sent" errors.
- Ownership errors from model methods return `"not_found" | "forbidden"` — controllers map these to 404/403.

## Adding new fields to `Item`

See `data-model.md` for the full procedure.

## CORS

`cors()` with no options (all origins) in dev. Production traffic goes through CloudFront, which restricts origins at the CDN level.
