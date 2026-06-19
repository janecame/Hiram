# Hiram — MVP Plan

A peer-to-peer rental marketplace for the Philippines. Web first.

---

## 1. The Idea in One Line

People list items they own (tools, gear, appliances) for short-term rent. Other people nearby find and borrow them.

## 2. Name

**Hiram** — Tagalog for "borrow." Short, instantly meaningful to the local audience, and an easy `.com` / handle target. Backup: **Lapit** (means "near"), or **NearLend** if you want an English-friendly alternative for a portfolio audience.

## 3. Today's Goal

A working **web frontend** with **mock data only**. No backend, no database, no auth.
The mock data layer must be structured so swapping in a real API later is a one-file change.

## 4. Scope for Today (3 pages)

1. **Browse** — grid of items with category filter, distance sort, and a search box.
2. **Item Detail** — photos, description, price/day, owner, distance, "Request to Borrow" button (button shows a success message, doesn't actually do anything yet).
3. **List an Item** — form to post a new item. On submit, adds to the in-memory mock store so it appears in Browse.

Explicitly **out of scope today**: auth, real messaging, payments, real map, image upload, profile pages.

## 5. Tech Stack (today)

| Layer        | Choice                                         | Why                                                       |
| ------------ | ---------------------------------------------- | --------------------------------------------------------- |
| Build tool   | Vite + React + TypeScript                      | Fast, your usual setup                                    |
| Routing      | react-router-dom                               | Three pages need it                                       |
| Data fetching| TanStack Query                                 | Even with mock data — keeps the swap to real API trivial  |
| Forms        | React Hook Form + Zod (via @hookform/resolvers)| Your stack                                                |
| Icons        | lucide-react                                   | Lightweight, matches a clean aesthetic                    |
| Styling      | MUI (Material UI) v6 with a custom theme       | Component library speeds up layout; theme centralises the Hiram palette and typography tokens |

## 6. Folder Structure

```
src/
  types/        item.ts                  — Item, Category, Condition types
  data/         mock-items.ts            — seed array of ~12 items
  api/          items.ts                 — fake async functions (getItems, getItem, createItem)
  hooks/        useItems.ts, useItem.ts  — TanStack Query wrappers around api/
  schemas/      item-form.ts             — Zod schema for the "list an item" form
  components/   Header, ItemCard, FilterBar, EmptyState, Skeleton
  pages/        BrowsePage, ItemDetailPage, ListItemPage
  theme/        theme.ts                 — MUI createTheme with Hiram palette, typography, and component overrides
  App.tsx, main.tsx, index.css
```

The key discipline: **pages and components never touch mock data directly**. They only call hooks. The hooks call `api/`. The api functions are the only place mock data lives. When the real backend lands, you change one file.

## 7. Data Model (mock, but matches future DB shape)

An `Item` has:

- `id` (string)
- `title`
- `category` — one of: tools, outdoor, events, electronics, appliances
- `description`
- `pricePerDay` (number, PHP)
- `distanceKm` (number, faked for now — later computed from PostGIS)
- `area` (string, e.g. "Bacolod City")
- `owner` (string name, will become a userId later)
- `condition` — like-new / good / fair
- `createdAt` (ISO string)

When the real backend arrives, this same shape becomes a `items` table in Supabase + a separate `users` table.

## 8. The Mock API Contract

Three functions that all return promises with a small artificial delay (to make TanStack Query behave realistically):

- `listItems(filters)` → `Item[]`
- `getItem(id)` → `Item | null`
- `createItem(input)` → `Item` (pushes to in-memory array, returns the created item)

This is the **only file** the real backend will replace.

## 9. Design Direction

A quick design note so it doesn't end up looking like a generic Tailwind template:

- **Palette**: warm paper background (`#FAF7F2`), deep pine green primary (`#1C4A3A`), rust-orange accent for CTAs (`#C94A2A`), amber for highlights (`#E8A020`). Avoids the default "white + blue" SaaS look and feels closer to a local marketplace / classified-ad vibe.
- **Type**: Archivo (display, bold) + Inter (body) + JetBrains Mono (small labels, prices, tags) — all wired into the MUI theme's `typography` block.
- **MUI theme file** (`src/theme/theme.ts`): exports a single `createTheme()` call that sets `palette.primary`, `palette.secondary`, `palette.background`, custom `typography` variants, and light component overrides (e.g. rounded `Button`, outlined `Chip` for category pills). Wrapped in `ThemeProvider` at `App.tsx`.
- **Signature element**: round dashed "stamp"-style badges for distance and price, like a rental receipt or pawn ticket — built as a styled MUI `Chip` or `Box` variant inside the theme overrides.
- **No stock photos for items** — use category-tinted `Box` blocks with a `lucide-react` icon. Faster to build, looks more intentional than broken image placeholders.

## 10. What Each Page Needs

**Browse**
- Header with logo + nav
- Filter bar: category pills (All + 5 categories), sort dropdown (Nearest / Cheapest / Newest), result count
- Grid of item cards (image block, title, category, distance, price/day)
- Loading skeleton, empty state

**Item Detail**
- Back link to Browse
- Large image block on the left, info on the right
- Title, category, description, condition, area, owner name, distance, price/day
- "Request to Borrow" button — on click, shows an inline success banner
- Sticky-ish visual block on desktop, stacks on mobile

**List an Item**
- Form fields: title, category (select), description (textarea), price per day (number), area (text), condition (select)
- Zod validation on all fields with inline error messages
- On valid submit: call `createItem`, navigate to Browse, the new item appears at the top

## 11. What I'm Skipping On Purpose

- **Image upload** — fake it with category-tinted icon blocks. Real upload needs S3/Supabase Storage, not today.
- **Real geolocation** — distances are random mock numbers. Real version uses browser geolocation + PostGIS.
- **Auth** — every item shows a hardcoded "owner" name. Real version uses Supabase Auth.
- **Messaging** — the "Request to Borrow" button is cosmetic. Real version is a separate phase.
- **Map view** — the vision mentions map-first UI, but a list grid is faster to ship and validates the catalog UX first. Map can come in phase 2 once you have real coordinates.

## 12. Roadmap After Today

- **Phase 2** — Real backend (Node/Express + Supabase + PostGIS), auth, real distance calculation, image upload, map view.
- **Phase 3** — Messaging between borrower and owner, request/approve flow, calendar of availability.
- **Phase 4** — Payments (or "pay in person" for v1 of PH market), ratings, deposits.
- **Phase 5** — React Native / Expo mobile app sharing the same backend.

---

## Decision Checklist Before I Touch Code

- [ ] You're okay with the name **Hiram** (or pick: Lapit / NearLend / something else)
- [ ] You're okay with the 3-page scope (Browse / Detail / List)
- [ ] You're okay with MUI v6 + a custom Hiram theme instead of plain CSS
- [ ] You're okay with category-tinted icon blocks instead of real images for now
- [ ] You're okay with mock distances and no real map for today

Confirm and I'll build it.
