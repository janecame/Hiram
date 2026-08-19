# Hiram — Undone & Future Tasks

Audited against live source 2026-08-19. Replaces the old `roadmaps/` folder (deleted — described a Supabase-based plan that was never followed).

## Undone

### Security deposits
No deposit/escrow field or table exists on `payments` or `requests` in the live schema. Needs a column (or table) plus release/withhold logic tied to the reports resolution flow.

### OSRM production swap
Item Detail page driving-route/ETA feature (`frontend/src/pages/ItemDetailPage.tsx`) still calls the free `router.project-osrm.org` demo server. Not safe for production load — swap to a hosted OSRM instance or OpenRouteService (API key) before relying on it.

### Trust score
Reviews exist and roll up per-item via the `item_ratings` view, but there's no cross-rental trust-score aggregate on user profiles.

### Mobile app
No `mobile/` workspace exists. Would be React Native + Expo, sharing the existing Express backend contract.

## Future

- Automated dispute resolution for reports (currently manual admin review only)
