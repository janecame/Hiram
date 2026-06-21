# Architecture Rules

## The data-flow law

```
pages / components  →  hooks/  →  api/  →  mock data
```

- **Pages and components** never import from `data/` or call `api/` directly. They only call hooks.
- **Hooks** (`src/hooks/`) are TanStack Query wrappers. They own query keys, loading states, and mutations. They call `src/api/items.ts`.
- **`src/api/items.ts`** is the sole integration point with the data layer. When the real backend lands, only this file changes — signatures stay the same, `fetch()` replaces the mock delay + store logic.
- **`data/mock-items.ts`** is seed data only. Never import it from UI code.

Breaking this layering defeats the one-file-swap guarantee that is the whole point of the MVP structure.

## Query keys

- List queries: `["items", filters]` — invalidated on `createItem` success.
- Detail queries: `["item", id]` — disabled when `id` is undefined.

Do not invent new top-level keys without updating `useCreateItem`'s `invalidateQueries` call.

## Backend layer

```
routes/  →  controllers/  →  models/  →  in-memory store (→ DB in Phase 2)
```

- Routes (`backend/src/routes/`) only wire HTTP verbs to controller methods.
- Controllers (`backend/src/controllers/`) handle request/response; call model methods.
- Models (`backend/src/models/`) own all data access and mutation logic. When Phase 2 lands, only model files change — controller signatures stay the same.

## Project structure

```
frontend/src/
  types/      item.ts                — Item, Category, Condition types + constants
  data/       mock-items.ts          — seed array (never imported by UI directly)
  api/        items.ts               — fake async fns; sole swap point for real backend
  hooks/      useItems.ts, useItem.ts — TanStack Query wrappers
  schemas/    item-form.ts           — Zod schema for the list-item form
  components/ Header, ItemCard, FilterBar, EmptyState, ItemCardSkeleton,
              StampBadge, CategoryBlock
  pages/      BrowsePage, ItemDetailPage, ListItemPage
  theme/      theme.ts               — single MUI createTheme() with Hiram tokens
  lib/        format.ts              — formatPeso(), CATEGORY_VISUALS, other formatters
backend/src/
  types/        item.ts              — Item / NewItemInput types (kept in sync with frontend manually)
  data/         mock-items.ts        — same seed data served via Express
  routes/       items.ts             — mounts GET/POST /api/items
  controllers/  item.controller.ts   — request/response handling
  models/       item.model.ts        — in-memory store + filter/sort logic
```

## Monorepo workspaces

Two packages — `frontend` and `backend` — share no source code. They share the same `Item` shape by convention, not by import. Do not create a shared `packages/` workspace unless explicitly planned.

## Frontend port: 5173 · Backend port: 3001

The Vite dev proxy is not configured — the frontend mock API (`src/api/items.ts`) does not hit the backend during development. To wire them together is a Phase 2 task.