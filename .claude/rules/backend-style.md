# Backend Style Rules

## Stack

Express + TypeScript (CommonJS, ES2022 target). Run with `tsx` in dev via nodemon; compiled to `dist/` for production.

## Route conventions

All item routes are mounted at `/api/items` via a single `Router` in `backend/src/routes/items.ts`. Do not scatter routes across multiple files — add new resource routes as new route files and mount them in `src/index.ts`.

Current routes:
- `GET /api/items` — accepts `?category=` and `?sort=` query params
- `GET /api/items/:id` — 404 with `{ error: "Item not found" }` when missing
- `POST /api/items` — accepts `NewItemInput` body, generates `id`, `distanceKm`, `createdAt` server-side

## In-memory store

`let items: Item[] = [...MOCK_ITEMS]` is module-level state. `POST` unshifts to the top so newest appear first — same behaviour as the frontend mock. The store resets on server restart; that is expected for the mock phase.

## Request/response typing

- Type request bodies with `as YourType` after `req.body` — no runtime validation yet (Phase 2 will add Zod on the backend).
- Always return `res.json(...)` and call `return` after sending a response to avoid "headers already sent" errors.

## Adding new fields to `Item`

1. Update `backend/src/types/item.ts`
2. Update `frontend/src/types/item.ts` to match (no shared package — keep them in sync manually)
3. Update `backend/src/data/mock-items.ts` seed data
4. Update `frontend/src/data/mock-items.ts` seed data

## CORS

CORS is enabled for all origins in dev (`cors()` with no options). Do not restrict origins until a production domain is known.