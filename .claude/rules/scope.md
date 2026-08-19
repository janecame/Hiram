# Project Scope

## Current state: Phase 2+ live

All core features are implemented. Database is Neon serverless Postgres. Deployment targets AWS
(S3 + CloudFront for the frontend, Elastic Beanstalk for the backend) — **both deploy workflows are
currently disabled** pending master-ruleset testing, and a Vercel frontend is in flight on the
`deploy/vercel-frontend` branch. See `architecture.md` → Production topology.

### What is live

| Feature | Notes |
|---|---|
| Item listing (create / edit / archive / delete) | Location pin, PSGC address with stable codes |
| Browse & item detail | PostGIS distance, reviews, blocked dates |
| Borrow request flow | pending → approved → return_requested → completed; overlap-aware auto-decline; counter-offer flow (`counter_offered`) |
| Real-time chat | Socket.io, conversations + messages tables |
| Notifications | Triggered on request/review/verification events; Socket.io push + REST fallback |
| Cookie auth | Register / login; httpOnly session cookie + CSRF; `requireAuth` / `requireAdmin` middleware; session revocation via `token_valid_after` |
| User profiles | Verification badge, ID upload flow, avatars, default pickup location |
| Admin panel | `/admin` — stats, user/item management, ID verification approve/reject, disable user/item, audit log |
| Reviews | Borrower reviews item after completed rental; `item_ratings` view |
| **PayMongo payments** | `/api/payments`, checkout sessions, webhook with raw-body signature verification, `paymongo` and `cash` methods |
| **Reports / moderation** | User-to-user reports tied to a request; admin resolution with `resolution_note` |
| Terms acceptance gate | `TermsGate` component, `users.terms_accepted_at` |

### What is NOT implemented (pending)

Tracked in `.claude/task.md`:

| Feature | Notes |
|---|---|
| Security deposits / escrow | No deposit field or table on `payments` or `requests`; needs release/withhold logic tied to report resolution |
| OSRM production swap | `ItemDetailPage` calls the free `router.project-osrm.org` demo server — not safe for production load |
| Trust score | Per-item ratings exist via `item_ratings`; no cross-rental aggregate on user profiles |
| Mobile app | No `mobile/` workspace; would be React Native + Expo against the existing backend |
| Automated dispute resolution | Reports are manual admin review only |

### Temporarily disabled

| Thing | State |
|---|---|
| S3 image uploads | `UPLOADS_DISABLED = true` in `upload.controller.ts` returns 503; S3 wiring intact |
| AWS deploy workflows | Push triggers commented out; `workflow_dispatch` only |
| `/my-items` route | Route commented out in `App.tsx`; `MyItemsPage.tsx` is unreachable |

### Out of scope (will not build)

- Supabase (using raw `pg` + cookie sessions instead)
- Shared `packages/` workspace between frontend and backend
- Hosted OSRM in production (demo server only if OSRM is kept)

> The old `.claude/plans/` directory and `roadmaps/` folder have been deleted — they described a
> Supabase plan that was never followed. `.claude/task.md` is the current backlog.
