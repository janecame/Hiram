# Admin Tooling — Implementation Plan

## Status: Pending

---

## Step 1 — Database migration
- Add `is_admin boolean NOT NULL DEFAULT false` to `users` table
- Seed `rianecuello@gmail.com` as admin in the same migration
- **User action required:** run `npm run migrate`

## Step 2 — Backend types
- Add `isAdmin: boolean` to `User` type in `backend/src/types/user.ts`

## Step 3 — Backend auth middleware
- Add `requireAdmin` middleware that checks `req.user.isAdmin`
- Update JWT payload to include `isAdmin` so it's available on every request without a DB lookup
- File: `backend/src/middleware/auth.ts`

## Step 4 — Backend admin routes
New file: `backend/src/routes/admin.ts`

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/api/admin/stats` | Total users, items, requests |
| `GET` | `/api/admin/users` | All users (paginated) |
| `DELETE` | `/api/admin/users/:id` | Delete a user |
| `GET` | `/api/admin/items` | All items (any owner) |
| `DELETE` | `/api/admin/items/:id` | Delete any item |

## Step 5 — Frontend API layer
- New file: `frontend/src/api/admin.ts`
- Functions for all 5 endpoints above

## Step 6 — Frontend Admin page (`/admin`)
- Protected route — redirects non-admins to `/`
- Three sections:
  - **Stats bar** — total users / items / requests
  - **Users tab** — table with name, email, account type, joined date, delete button
  - **Items tab** — table with title, owner, status, price, delete button
- New file: `frontend/src/pages/AdminPage.tsx`

## Step 7 — Frontend nav link
- Add "Admin" link in `Header` visible only to admins
- File: `frontend/src/components/Header.tsx`

## Step 8 — Auth context update
- Expose `isAdmin` from JWT token in `AuthContext`
- File: `frontend/src/auth/AuthContext.tsx`
