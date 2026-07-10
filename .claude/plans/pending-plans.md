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

### CI Pipeline — GitHub Actions for Branch Safety

**What:** Two GitHub Actions workflow files to automate build validation and deployment.

- `.github/workflows/ci-pre-master.yml` — runs `npm run build` on every push to `pre-master-branch`. Must pass before a PR to `master` can be merged (enforced via GitHub branch protection on `master`).
- `.github/workflows/deploy-master.yml` — runs build + deploys to Elastic Beanstalk on merge to `master`.

**Why:** Currently there is no automated gate between `pre-master-branch` and `master`. Build errors or TypeScript failures can reach production undetected.

**Note:** For now this is done manually — run `npm run build` before opening a PR to master.

---

### PayMongo — Payment Integration

**What:** Allow borrowers to pay for a rental through PayMongo (Philippine payment gateway). Covers GCash, Maya, card payments.

**Scope:** Requires a new `payments` table, PayMongo webhook handling, and a checkout flow in the borrow request UI. Not started.

---

### Reports (replaces Damage Claims)

**Status: Implemented 2026-06-29.**

Either lister or borrower can file a report on an approved or completed rental. Admin reviews and resolves/dismisses in the Reports tab of the admin panel. No monetary resolution — that depends on PayMongo when added.

---

