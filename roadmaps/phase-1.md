# Phase 1 — Working MVP (current)

**Goal:** Functional web app with mock data, no real backend services. Users can browse, list, and request to borrow items.

---

## Features

### Listing form (create item)
- Title, category, condition, description
- Brand (optional)
- Price per day
- Price per hour (optional)
- Image upload — falls back to category icon if none provided
- Manual address/area input (typed by user)

### Browse page
- Filter by category
- Sort options
- Item cards showing status badge (available / unavailable / reserved) and rating

### Borrow item page (item detail)
- Duration selector — hours or days
- Price breakdown based on selected duration
- Borrower requirements set by the lister
- Lister profile link
- Availability status — available / unavailable / reserved
- Feedback / reviews section
- Chat UI (static — no real messaging yet)

### User profiles
- Profile page with name, account type, address
- Account type — solo or business
- Credentials on file — email, phone, government ID; business papers for business accounts
- Items listed by the user

### Authorization
- Guests (no account) can browse and view all listings
- Borrowing / requesting an item requires an account — guest is prompted to register or log in

---

## Data layer

All data is in-memory mock data. No real database, no auth service.

- `frontend/src/data/mock-items.ts` — item seed data
- `frontend/src/data/mock-users.ts` — user seed data
- `frontend/src/api/items.ts` — fake async API (the only file that changes in Phase 2)

---

## Out of scope in Phase 1

| Feature | Phase |
|---|---|
| Map picker / geolocation | 2 |
| Auto-detect user location | 2 |
| Real image storage | 2 |
| Real database | 2 |
| Real auth (Supabase Auth) | 2 |
| Credential verification | 2 |
| Real-time messaging | 3 |
| Request / approve flow | 3 |
| Rental calendar | 3 |
| Payments / deposits | 4 |
| Meet-up location confirmation | 2 |
| Mobile app | 5 |

---

## Stack

- **Frontend** — React + TypeScript + Vite + MUI + TanStack Query + React Hook Form + Zod
- **Backend** — Express + TypeScript (in-memory store, no DB)
- **Monorepo** — npm workspaces