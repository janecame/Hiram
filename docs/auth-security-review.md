# Auth Security Review

Ongoing notes on authentication security and performance for Hiram. Add new findings below as they come up.

## Resolved

### JWT_SECRET insecure fallback

- **Where:** `backend/src/controllers/auth.controller.ts`, `backend/src/middleware/auth.ts`
- **Issue:** both files had `process.env["JWT_SECRET"] ?? "hiram-secret"`. If `JWT_SECRET` was ever missing from an environment, the server would silently sign and verify tokens using the hardcoded string `"hiram-secret"`, which is visible in the public source code.
- **Risk:** anyone who read the source could forge a valid JWT offline (any user id, `isAdmin: true`) and bypass login entirely on any environment where the env var was unset. No password or account needed.
- **Fix:** removed the fallback. Both files now throw `"JWT_SECRET environment variable is required"` at startup if the env var is missing, so a misconfigured environment fails loudly instead of silently running insecure.
- **Status:** fixed.

### No rate limiting on login/register

- **Where:** `backend/src/routes/auth.ts`
- **Issue:** `/api/auth/login` and `/api/auth/register` had no request throttling. Two risks: (1) brute-force / credential stuffing — unlimited password guesses per IP; (2) CPU exhaustion — bcrypt is deliberately slow, so flooding these routes with requests pegs server CPU on hashing work and can degrade the app for legitimate users, not just the targeted account.
- **Fix:** installed `express-rate-limit` and applied it to `/register` and `/login` only (not `/me`, which is a cheap JWT check hit constantly by normal frontend usage). Limit: 10 requests per IP per 15-minute window, returns `429` before the request reaches the controller (so bcrypt never runs on throttled attempts).
- **Note:** uses in-memory tracking — resets on server restart and won't sync across multiple backend instances if the app ever scales horizontally. Worth revisiting with a shared store (e.g. Redis) if/when there's more than one backend instance.
- **Status:** fixed.

### Long-lived JWT with no revocation

- **Where:** `backend/src/middleware/auth.ts`, `backend/src/models/user.model.ts`, `backend/src/controllers/user.controller.ts`, `backend/src/routes/users.ts`, `backend/migrations/024_add_token_valid_after.sql`
- **Issue:** JWTs are valid for 7 days and `requireAuth` only checked the signature — there was no way to invalidate a token early. Concretely: an admin disabling a user didn't stop that user's already-issued token from working for up to 7 more days, and there was no password-change feature to force old tokens to expire either.
- **Fix:** added a `token_valid_after TIMESTAMPTZ` column on `users`. `requireAuth` now compares the token's issued-at time (`iat`) against it and rejects tokens issued earlier. Two things now bump it: (1) admin-disabling a user (`UserModel.setDisabled`), and (2) a new self-service change-password endpoint, `POST /api/users/me/password` (requires current password, enforces an 8-character minimum on the new one, hashes with bcrypt, invalidates old tokens).
- **Cost:** `requireAuth` now does one extra DB read per authenticated request (previously zero — pure signature check). Accepted tradeoff for making revocation possible at all.
- **Pending:** migration `024_add_token_valid_after.sql` written but not yet applied to the database — must be run (`npm run migrate` or manually) before this code can run without erroring.
- **Status:** code complete; migration pending (being applied manually).

### No minimum password length

- **Where:** `backend/src/controllers/auth.controller.ts` (register), `backend/src/controllers/user.controller.ts` (change-password)
- **Issue:** registration only checked that a password was present, not that it met any minimum strength.
- **Fix:** both register and change-password now reject passwords under 8 characters.
- **Status:** fixed.

### Wide-open CORS (REST + Socket.io)

- **Where:** `backend/src/index.ts`
- **Issue:** `app.use(cors())` and the Socket.io server (`new Server(httpServer, { cors: { origin: "*" } })`) both accepted requests/connections from any origin, not just the actual Hiram frontend. Mainly a resource/attack-surface concern (anyone can open sockets or hit the API from any site) rather than direct token theft, since `localStorage` and Bearer tokens aren't readable cross-origin by a third-party page.
- **Fix:** added an `ALLOWED_ORIGINS` env var (comma-separated list) for both REST `cors()` and the Socket.io server.
- **Update (cookie migration):** once auth moved to cookies (see "localStorage token storage" below), `credentials: true` became required on CORS — and browsers flatly reject a wildcard `Access-Control-Allow-Origin` on any credentialed request. So the `"*"` fallback was removed; when `ALLOWED_ORIGINS` is unset, it now falls back to `http://localhost:5173` (the local Vite dev origin) instead.
- **Follow-up needed:** set `ALLOWED_ORIGINS` in Render's environment config to the real Vercel domain once known — the deployment target moved from AWS (CloudFront + Elastic Beanstalk) to Vercel (frontend) + Render (backend), and the Vercel domain isn't recorded anywhere in the repo.
- **Status:** fixed (code); pending env var configuration in production.

### `localStorage` token storage (XSS exposure)

- **Where:** backend — `backend/src/index.ts`, `controllers/auth.controller.ts`, `middleware/auth.ts`, `socket.ts`; frontend — `api/_base.ts`, `api/auth.ts`, `auth/AuthContext.tsx`, every other file in `api/`, `hooks/useSocket.ts`.
- **Issue:** the JWT lived in `localStorage` and was attached manually as an `Authorization: Bearer` header on every request. Any injected script (XSS from a third-party dependency, a stored-content bug, etc.) could read `localStorage` directly and steal the token — no browser protection stops JS from touching it.
- **Deployment context:** app now runs cross-origin — Vercel (frontend) and Render (backend) are different domains, not one CloudFront origin as the old docs assumed. This ruled out the simplest cookie setup (`SameSite=Lax`) and required `SameSite=None`, which in turn requires the `Secure` flag and forfeits `SameSite`'s built-in CSRF protection.
- **Fix:** moved the session token into an httpOnly cookie (`hiram_token` — `Secure`, `SameSite=None` in production) that JS can never read, closing the XSS-theft path. Since `SameSite=None` removes CSRF protection, added a second, JS-readable cookie (`hiram_csrf`) set alongside it; the frontend echoes its value as an `X-CSRF-Token` header on every mutating request (POST/PUT/PATCH/DELETE), and `requireAuth` rejects the request if the header doesn't match the cookie (double-submit cookie pattern). `GET` requests are exempt since they can't mutate state.
  - Backend: `cookie-parser` added; CORS now requires an explicit origin list with `credentials: true` (a wildcard `*` origin is rejected by browsers on credentialed requests) — defaults to `http://localhost:5173` for local dev when `ALLOWED_ORIGINS` is unset.
  - `POST /api/auth/logout` added — clears both cookies.
  - `backend/src/socket.ts` — also had the original `?? "hiram-secret"` fallback bug (missed in the first JWT_SECRET fix); removed. Socket.io handshake auth switched from a manually-passed token to reading the httpOnly cookie straight off the handshake's `Cookie` header.
  - Frontend: added an `authFetch()` wrapper (`api/_base.ts`) used by every API call — sends `credentials: "include"` and attaches the CSRF header automatically. `AuthContext` no longer reads `localStorage`; on mount it calls `GET /api/auth/me` to ask the backend who's logged in, which makes auth state resolve asynchronously (`isLoading` flag added to `useAuth()`). Pages that redirect unauthenticated users away (`DashboardPage`, `EditItemPage`, `MyItemsPage`, `NotificationsPage`, `MessagesPage`, `ListItemPage`) were updated to wait for `isLoading` before redirecting, since the old synchronous `localStorage` check is gone and they'd otherwise flash-redirect a logged-in user on every page refresh.
- **Not touched:** `TermsGate.tsx`'s `localStorage` key (`hiram_terms_accepted`) — an unrelated "seen the terms popup" flag, not the auth token.
- **Follow-up needed:** set `ALLOWED_ORIGINS` in Render's environment config to the real Vercel domain — not found anywhere in the repo, must be set manually once known.
- **Status:** fixed.

## Open items

- `pg.Pool` has no `max` set (`backend/src/db.ts`) — defaults to 10 connections; worth tuning under real auth traffic load.
- No caching on `/api/auth/me` — re-queries Postgres on every call even though the JWT already carries the user's basic claims.
- No frontend UI for the new change-password endpoint yet — backend only.
- In-memory rate limiting (see "No rate limiting on login/register" above) won't work correctly if the backend ever scales to multiple instances on Render.
