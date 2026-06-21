# Backend Style Rules

## Stack

Express + TypeScript (CommonJS, ES2022 target). Run with `tsx` in dev via nodemon; compiled to `dist/` for production.

## Route conventions

All item routes are mounted at `/api/items` via a single `Router` in `backend/src/routes/items.ts`. Do not scatter routes across multiple files — add new resource routes as new route files and mount them in `src/index.ts`.

Current routes:
- `GET /api/items` — accepts `?category=` and `?sort=` query params
- `GET /api/items/:id` — 404 with `{ error: "Item not found" }` when missing
- `POST /api/items` — accepts `NewItemInput` body, generates `id`, `distanceKm`, `createdAt` server-side

## Controller / model pattern

- `routes/` — only wire HTTP verbs to controller methods, no business logic.
- `controllers/` — handle `req`/`res`; call model methods; never touch the store directly.
- `models/` — own all data access. In Phase 1 this is the in-memory store; in Phase 2 it becomes SQL queries. Controller signatures do not change between phases.

## In-memory store

`ItemModel` in `backend/src/models/item.model.ts` holds `let store: Item[] = [...MOCK_ITEMS]`. `create()` unshifts so newest appear first. Store resets on server restart; expected for the mock phase.

## Request/response typing

- Type request bodies with `as YourType` after `req.body` — no runtime validation yet (Phase 2 will add Zod on the backend).
- Always `return` after sending a response to avoid "headers already sent" errors.

## Adding new fields to `Item`

See `data-model.md` for the full procedure.

## CORS

CORS is enabled for all origins in dev (`cors()` with no options). Do not restrict origins until a production domain is known.