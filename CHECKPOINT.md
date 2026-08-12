# CHECKPOINT

## Goal
Auth security/performance review for Hiram. The big item — migrating from `localStorage`-stored JWT to httpOnly cookies + CSRF protection for the cross-origin Vercel (frontend) + Render (backend) deployment — is now **fully implemented and lint-clean**. Two tasks remain: write a full session summary for the user, and create a reusable `/auth-setup`-style skill (for agents building auth in future projects) based on what was learned/built here.

## Done
- [x] **Backend cookie/CSRF migration** — all implemented:
  - `backend/src/index.ts` — `cookieParser()` added; CORS now requires explicit origins + `credentials: true` (no more `"*"` fallback — defaults to `http://localhost:5173` for local dev when `ALLOWED_ORIGINS` unset).
  - `backend/src/controllers/auth.controller.ts` — `setSessionCookies()` helper sets `hiram_token` (httpOnly, `Secure` in prod, `SameSite=None` in prod / `lax` in dev) + `hiram_csrf` (JS-readable, same flags). Register/login no longer return `token` in JSON body. Added `logout` action clearing both cookies.
  - `backend/src/routes/auth.ts` — added `POST /api/auth/logout`.
  - `backend/src/middleware/auth.ts` — `requireAuth` now reads JWT from `req.cookies.hiram_token` instead of `Authorization` header; added CSRF double-submit check (`X-CSRF-Token` header must match `hiram_csrf` cookie) for all non-GET/HEAD/OPTIONS requests. `token_valid_after` check unchanged.
  - `backend/src/socket.ts` — fixed the `?? "hiram-secret"` fallback bug (missed in the original JWT_SECRET fix pass); handshake auth now reads the JWT from the raw `Cookie` header (small manual `readCookie` parse, no new dependency) instead of `socket.handshake.auth.token`.
  - `npm install cookie-parser @types/cookie-parser` done in `backend/`.
- [x] **Frontend cookie/CSRF migration** — all implemented:
  - `frontend/src/api/_base.ts` — added `authFetch()` (sends `credentials: "include"`, attaches `X-CSRF-Token` from the `hiram_csrf` cookie on mutating methods) and a `readCookie()` helper.
  - `frontend/src/api/auth.ts` — `apiLogin`/`apiRegister` use `authFetch`, `AuthResponse` now just `{ user }` (no `token`). Added `apiLogout()`.
  - `frontend/src/auth/AuthContext.tsx` — rewritten. No more `localStorage`. On mount, calls `getCurrentUser()` (`GET /api/auth/me`) to resolve session — added `isLoading` to `AuthValue`. `setSession` now takes `(user: User)` instead of the old `AuthResponse`.
  - All other `frontend/src/api/*.ts` files (`admin.ts`, `items.ts`, `messages.ts`, `notifications.ts`, `payments.ts`, `reports.ts`, `requests.ts`, `reviews.ts`, `users.ts`) — local `getToken`/`authHeaders` deleted, all authenticated calls switched to `authFetch`.
  - `frontend/src/api/upload.ts` — presign call uses `authFetch`; the direct S3 `PUT` stays a plain untouched `fetch`.
  - `frontend/src/hooks/useSocket.ts` — `io(BACKEND_URL, { withCredentials: true })` instead of manually passing a token.
  - `frontend/src/pages/SignupPage.tsx`, `LoginPage.tsx` — `setSession(resp)` → `setSession(resp.user)`.
  - **Regression caught and fixed:** `DashboardPage.tsx`, `EditItemPage.tsx`, `MyItemsPage.tsx`, `NotificationsPage.tsx`, `MessagesPage.tsx`, `ListItemPage.tsx` all did a synchronous `if (!isAuthenticated) return <Navigate .../>` — since auth state used to load synchronously from `localStorage`. Now that it's resolved async via `/api/auth/me`, these would flash-redirect a logged-in user on every refresh. Added an `authLoading` (aliased from `useAuth().isLoading`) spinner gate before each of these checks.
  - **Not touched (correctly out of scope):** `frontend/src/components/TermsGate.tsx`'s `localStorage` key `hiram_terms_accepted` — unrelated "seen the terms popup" flag, not the auth token.
- [x] `npm run lint` run at repo root — **0 errors**. One pre-existing warning in `DashboardPage.tsx:577` (`react-hooks/exhaustive-deps` on an unrelated counter-offer effect) confirmed via `git diff` to predate this session — left alone per user's "lint only" scope.
- [x] `docs/auth-security-review.md` updated — added a new "localStorage token storage (XSS exposure)" Resolved entry documenting the full migration, and updated the earlier CORS entry to reflect the `credentials: true` / no-more-wildcard change. "Open items" list cleaned up (localStorage bullet removed; added a note about in-memory rate limiting not scaling across multiple Render instances).
- [x] Earlier in the session (prior checkpoint, already done): JWT_SECRET fallback removal, rate limiting on login/register, token revocation (`token_valid_after` + change-password endpoint), 8-char minimum password, initial CORS env var support — all recorded in `docs/auth-security-review.md`.

## Remaining
1. **Write a full session summary for the user** — covering everything done this session (the six original punch-list fixes plus this cookie/CSRF migration), suitable as a wrap-up message. Not yet written — do this first.
2. **Create a reusable skill** (e.g. `.claude/skills/auth-setup/SKILL.md`) that an agent can invoke to bootstrap secure auth in *future* projects, generalizing the patterns actually built and validated in this session:
   - JWT with no-fallback secret (`requireJwtSecret()`-style throw-on-missing pattern)
   - Rate limiting on login/register via `express-rate-limit`
   - Token revocation via a `token_valid_after` column compared against JWT `iat`
   - Minimum password length + bcrypt hashing
   - httpOnly cookie session storage + double-submit CSRF cookie pattern for cross-origin (`SameSite=None`) deployments, vs. `SameSite=Lax`/no-CSRF-cookie-needed for same-origin deployments — the skill should ask/detect which topology applies
   - CORS with explicit origin allow-list + `credentials: true`
   - Socket.io cookie-based handshake auth
   - Frontend `authFetch`-style wrapper pattern + async auth-context-with-`isLoading` pattern (and the redirect-guard `isLoading` gotcha this session hit)
   - Not yet started — no file written for this yet.
3. **Per `CLAUDE.md`'s Modification Report Rule:** once the summary is delivered, offer the user the files/lines-changed table (they may say yes/no).

## Notes / gotchas for next session
- **Migration `024_add_token_valid_after.sql` DB-apply status is still unconfirmed** — user said "I will just migrate it manually" several turns ago; never explicitly confirmed done. If `requireAuth` starts erroring in production on every request, this is the first thing to check (`getTokenValidAfter` would fail against a missing column).
- **`ALLOWED_ORIGINS` still has no real value anywhere in the repo** — must be set in Render's env config to the actual Vercel domain for CORS + cookies to work in production. Flagged in both the doc and here twice now.
- **Cookie flags are environment-gated:** `Secure`/`SameSite=None` only apply when `NODE_ENV=production` (see `isProd` in `auth.controller.ts`). Confirm Render sets `NODE_ENV=production` — if it doesn't, cookies will be issued with `SameSite=Lax` in prod and cross-origin auth will silently break (cookie gets dropped by the browser). Worth a quick check next session.
- **No manual browser testing has been done this session** — all verification so far is `npm run lint` (0 errors) only, per explicit user instruction ("do some npm run lint only"). TypeScript's realtime diagnostics caught and we fixed one real issue (missing `cookie` package types in `socket.ts`, resolved by writing a tiny manual cookie parser instead of adding a dependency, per CLAUDE.md's "no external libraries unless necessary" rule) — but a full `tsc`/build pass has NOT been run, nor has the login/logout/CSRF flow been exercised end-to-end in a browser. Worth flagging to the user before they deploy.
- Per `CLAUDE.md`'s Prompt Clarification Rule, this whole migration was authorized in advance by the user's earlier "JUST FIX EVERTHING do your own recomnendation" — that authorization scope is now fully consumed (migration complete); do not treat it as standing permission for unrelated future changes.
