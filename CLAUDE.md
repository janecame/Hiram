# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Hiram** (Tagalog for "borrow") — a peer-to-peer item rental marketplace for the Philippines. Web-first MVP. People list items they own for short-term rent; others nearby find and borrow them.

Current state: working web frontend + a thin Express backend, both using in-memory mock data. No database, no auth.

---

## Dev commands

All commands run from the repo root.

```bash
npm run dev          # start backend + frontend concurrently
npm run dev:fe       # frontend only  (Vite, http://localhost:5173)
npm run dev:be       # backend only   (nodemon/tsx, http://localhost:3000)
npm run build        # build all workspaces (tsc + vite build)
```

There are no tests yet.

---

## Architecture — the rule that matters most

```
pages / components  →  hooks/  →  api/  →  mock data
```

- Pages and components **never** import from `data/` or touch mock items directly. They call hooks only.
- Hooks (`src/hooks/`) are TanStack Query wrappers; they call `src/api/items.ts`.
- `src/api/items.ts` is the **only file** that changes when a real backend lands.

Violating this layering defeats the whole point of the MVP structure.

---

## Project structure

```
hiram-monorepo/
  frontend/src/
    types/        item.ts                  — Item, Category, Condition types
    data/         mock-items.ts            — seed array (~12 items, never imported by UI directly)
    api/          items.ts                 — fake async fns: listItems, getItem, createItem
    hooks/        useItems.ts, useItem.ts  — TanStack Query wrappers
    schemas/      item-form.ts             — Zod schema for the list-item form
    components/   Header, ItemCard, FilterBar, EmptyState, ItemCardSkeleton,
                  StampBadge, CategoryBlock
    pages/        BrowsePage, ItemDetailPage, ListItemPage
    theme/        theme.ts                 — single MUI createTheme() with Hiram tokens
    lib/          format.ts                — PHP currency and other formatters
  backend/src/
    types/        item.ts                  — shared Item / NewItemInput types
    data/         mock-items.ts            — same seed data, served via Express
    routes/       items.ts                 — GET /api/items, GET /api/items/:id, POST /api/items
```

---

## Data model (`Item`)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `category` | `tools \| outdoor \| events \| electronics \| appliances` | |
| `description` | string | |
| `brand` | string (optional) | new in Phase 1 |
| `pricePerDay` | number | PHP |
| `pricePerHour` | number (optional) | PHP; new in Phase 1 |
| `imageUrl` | string (optional) | uploaded image; falls back to category icon if absent |
| `distanceKm` | number | faked random; future: PostGIS |
| `area` | string | e.g. "Bacolod City" |
| `owner` | string | name only; future: userId |
| `condition` | `like-new \| good \| fair` | |
| `status` | `available \| unavailable \| reserved` | new in Phase 1 |
| `rating` | number (optional) | 0–5 average; new in Phase 1 |
| `requirements` | string (optional) | personal requirements the lister sets for borrowers |
| `createdAt` | ISO string | |

### `User` model (Phase 1 — mock only)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `accountType` | `solo \| business` | |
| `email` | string | |
| `phone` | string | |
| `address` | string | |
| `idSubmitted` | boolean | credential on file (unverified in Phase 1) |
| `businessDocsSubmitted` | boolean | for business accounts (unverified in Phase 1) |
| `createdAt` | ISO string | |

---

## Mock API contract (`src/api/items.ts`)

All return `Promise` with a small artificial delay so TanStack Query behaves realistically:

- `listItems(filters)` → `Item[]`
- `getItem(id)` → `Item | null`
- `createItem(input)` → `Item` (pushes to in-memory array, returns created item)

---

## Design tokens

| Token | Value |
|---|---|
| Background (paper) | `#FAF7F2` |
| Primary (pine green) | `#1C4A3A` |
| CTA accent (rust) | `#C94A2A` |
| Highlight (amber) | `#E8A020` |
| Display font | Archivo |
| Body font | Inter |
| Mono / labels | JetBrains Mono |

Theme is wired in `src/theme/theme.ts` and applied in `App.tsx` via MUI `ThemeProvider`. No stock photos — category-tinted `Box` blocks with `lucide-react` icons. Stamp-style dashed badges (`StampBadge`) for distance and price.

---

## Hooks & guards (`.claude/`)

Active hooks in `.claude/settings.json`:

| Hook | Trigger | Behavior |
|---|---|---|
| `guard-appsettings.ps1` | PreToolUse Write/Edit | Blocks edits to `appsettings.json` — edit manually if needed |
| `guard-sql.ps1` | PreToolUse Bash | Blocks `sqlcmd` calls containing DROP/TRUNCATE/INSERT/UPDATE/DELETE |
| bash-log | PreToolUse Bash (async) | Appends every bash command to `.claude/bash-log.txt` |
| edit-log | PostToolUse Write/Edit (async) | Appends every edited `.ts/.tsx/.cs/.csproj` path to `.claude/edit-log.txt` |
| Stop message | Session end | Reminds to run `git status` |

Custom command: `/analyze <page or feature>` — traces full code flow from frontend page → API call → backend route. Defined in `.claude/commands/analyze.md`.

---

## Phase 1 scope — what is being built now

### Listing form (create item)
- Brand field
- Price per hour rate (in addition to per-day)
- Image upload — if no image provided, falls back to the default category icon
- Manual address/location input (typed by user); map picker and auto-detect are Phase 2

### Borrow item page (item detail)
- Duration selector — hours or days
- Personal requirements to borrow (displayed by lister)
- Lister profile link
- Availability status — available / unavailable / reserved
- Feedback / reviews section
- Chat (UI only for Phase 1; real messaging is Phase 2)
- Meet-up location confirmation — Phase 2

### Item listing card / list view
- Status badge — available / unavailable / reserved
- Rating display

### User profiles
- Profile page
- Items listed by the user
- Account type — solo or business
- Credentials — email, phone number, government ID; business papers for business accounts
- Address
- Credential verification — Phase 2

### Authorization
- Guests (no account) can browse and view item listings
- Borrowing / requesting an item requires an account — guest is prompted to register or log in

---

## Out of scope (Phase 1)

Real database, real auth (Supabase), payments, map picker, auto-detect geolocation, real-time messaging, meet-up location confirmation, credential verification, image storage service. The "Request to Borrow" flow is functional UI but backed by mock data only.

See [roadmaps/](roadmaps/) for the full phase breakdown.