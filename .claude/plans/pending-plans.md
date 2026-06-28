# Hiram — Pending Features

Features not yet implemented. Implement in a new session with a focused plan.

---

## Pending

### OSRM — Road Directions on Item Detail Page

**What:** On the Item Detail page, when the borrower has location access and the item has `lat`/`lng`, show the actual driving route + ETA from the borrower to the item using OSRM.

**What PostGIS already does:** Computes straight-line distance ("X km away") at query time via `ST_Distance`. Shown on item cards and the detail page.

**What OSRM adds on top:**
- Actual road driving distance + ETA (e.g. "3.2 km · 11 min driving")
- Route polyline drawn on a Leaflet map on the Item Detail page
- Computed on the frontend via a `fetch` to `router.project-osrm.org`

**Scope:** Item Detail page only. Browse cards keep the PostGIS straight-line distance.

**Production caveat:** `router.project-osrm.org` is a demo server — not for production load. Must swap to a hosted OSRM instance or OpenRouteService (API key) before going to production.

**Files to touch:**
- `frontend/src/pages/ItemDetailPage.tsx` — add OSRM fetch + Leaflet map with route Polyline
- `frontend/src/lib/format.ts` — add `haversineKm()` as fallback when OSRM fails

---

### PayMongo — Payment Integration

**What:** Allow borrowers to pay for a rental through PayMongo (Philippine payment gateway). Covers GCash, Maya, card payments.

**Scope:** Requires a new `payments` table, PayMongo webhook handling, and a checkout flow in the borrow request UI. Not started.

---

### Damage Claims

**What:** After a rental is marked completed, allow the lister to file a damage claim against the borrower. Requires a new `claims` table, an admin review flow, and notifications to both parties.

**Scope:** Not started. Depends on the payment system for any monetary resolution.

---

## Completed (formerly out of scope)

| Feature | Notes |
|---|---|
| ✅ WebSocket / real-time chat | Socket.io live — `backend/src/socket.ts`, `/api/conversations` |
| ✅ PostGIS / real distance calculation | `ST_Distance` in `item.model.ts` `findAll`; `ST_MakePoint` on create/update |
| ✅ Admin tooling | `/api/admin` routes, `AdminPage.tsx`, `requireAdmin` middleware |
| ✅ Credential verification | ID upload → pending → verified/rejected flow, admin review panel |
| ✅ Image upload service | S3 pre-signed URL via `POST /api/upload`, stored on item/user |
| ✅ Mutual reviews (lister rating borrower) | Reviews table supports both directions; currently borrower-only by convention |
