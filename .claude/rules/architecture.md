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

## Monorepo workspaces

Two packages — `frontend` and `backend` — share no source code. They share the same `Item` shape by convention, not by import. Do not create a shared `packages/` workspace unless explicitly planned.

## Frontend port: 5173 · Backend port: 3000

The Vite dev proxy is not configured — the frontend mock API (`src/api/items.ts`) does not hit the backend during development. To wire them together is a Phase 2 task.