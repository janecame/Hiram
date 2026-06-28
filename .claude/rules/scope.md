# Project Scope

## Current state: Phase 2+ live

All core features are implemented and deployed on AWS (Elastic Beanstalk + CloudFront + RDS).

### What is live

| Feature | Notes |
|---|---|
| Item listing (create / edit / archive / delete) | S3 image upload, location pin, PSGC address |
| Browse & item detail | PostGIS distance, reviews, blocked dates |
| Borrow request flow | pending → approved → return_requested → completed; auto-decline on capacity |
| Real-time chat | Socket.io, conversations + messages tables |
| Notifications | Triggered on request/review/verification events; Socket.io push + REST fallback |
| JWT auth | Register / login; `requireAuth` / `requireAdmin` middleware |
| User profiles | Verification badge, ID upload flow |
| Admin panel | `/admin` — stats, user/item management, ID verification approve/reject |
| Reviews | Borrower reviews item after completed rental; `item_ratings` view |
| Image uploads | S3 pre-signed URL via `POST /api/upload` |

### What is NOT implemented (pending)

| Feature | Where tracked |
|---|---|
| OSRM road directions (Item Detail page) | `.claude/plans/pending-plans.md` |
| PayMongo payment integration | `.claude/plans/pending-plans.md` |
| Damage claims | `.claude/plans/pending-plans.md` |
| Counter-offer flow | `.claude/plans/reservation-fix-and-counter-offer.md` |
| Map pin embed in listing form | `.claude/plans/geolocation-revision.md` |

### Out of scope (will not build)

- Supabase (using raw `pg` + JWT instead)
- Shared `packages/` workspace between frontend and backend
- Hosted OSRM in production (demo server only if OSRM is added)
