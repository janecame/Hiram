# /auth-setup

Bootstrap or harden JWT-based auth (Express/Node backend + any SPA frontend) using the patterns built and validated in Hiram's 2026-07 auth security migration. Use this when starting auth from scratch in a new project, or auditing/upgrading existing auth against this checklist.

## Step 0 — Detect topology (ask if unclear)

The single biggest branch point is **same-origin vs cross-origin** deployment:

- **Same-origin** (frontend and backend served from one domain, e.g. one CloudFront distribution, or a monorepo reverse-proxied together): cookies can use `SameSite=Lax`, no CSRF-token dance needed for basic protection.
- **Cross-origin** (frontend on Vercel/Netlify, backend on Render/Railway/EB — different domains): cookies need `SameSite=None; Secure`, which strips `SameSite`'s free CSRF protection, so a double-submit CSRF cookie becomes mandatory.

Ask the user (or check env/deploy config) which applies before writing cookie code — get this wrong and auth silently breaks in production (browsers drop `SameSite=None` cookies missing `Secure`, or drop cross-site cookies entirely if the frontend build never learned the backend's real domain).

## Backend checklist

1. **No-fallback JWT secret** — never `process.env.JWT_SECRET ?? "some-default"`. Throw at startup if missing:
   ```ts
   function requireJwtSecret(): string {
     const secret = process.env["JWT_SECRET"];
     if (!secret) throw new Error("JWT_SECRET environment variable is required");
     return secret;
   }
   ```
   A hardcoded fallback is a public-source secret — anyone can forge tokens for any user/role.

2. **Rate limit login/register only**, not every authed route — `express-rate-limit`, ~10 req/15min/IP. Apply before the controller so bcrypt never runs on throttled attempts. Note in-memory store won't sync across horizontally-scaled instances; flag as a known limitation rather than solving it up front.

3. **Password hashing + minimum length** — bcrypt (cost 10+), reject passwords under 8 chars at both register and change-password.

4. **Token revocation via `token_valid_after`** — add a `token_valid_after TIMESTAMPTZ` column on the users table. `requireAuth` compares the JWT's `iat` against it and rejects stale tokens. Bump the column on: admin-disable, and self-service change-password. This is the cheapest way to get real revocation out of a stateless JWT — costs one extra DB read per authenticated request, which is an acceptable tradeoff.

5. **Session cookie, not localStorage/Bearer** — httpOnly cookie holding the JWT. `localStorage` and JS-readable auth cookies are readable by any XSS payload; httpOnly closes that path entirely.
   ```ts
   res.cookie("app_token", token, {
     httpOnly: true,
     secure: isProd,
     sameSite: isProd ? "none" : "lax",   // "none" only if cross-origin
     maxAge: TOKEN_TTL_MS,
   });
   ```
   Gate `secure`/`sameSite` on `NODE_ENV === "production"`, not hardcoded — local dev over plain http needs `secure: false`.

6. **CSRF double-submit cookie — only when cross-origin (`SameSite=None`)**. Issue a second, JS-readable cookie (`app_csrf`, random 32-byte hex) alongside the session cookie. Frontend echoes it as an `X-CSRF-Token` header on every mutating request. Middleware rejects non-GET/HEAD/OPTIONS requests where the header doesn't match the cookie:
   ```ts
   const CSRF_EXEMPT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
   if (!CSRF_EXEMPT_METHODS.has(req.method)) {
     const csrfCookie = req.cookies["app_csrf"];
     const csrfHeader = req.header("x-csrf-token");
     if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
       return res.status(403).json({ error: "Invalid or missing CSRF token" });
     }
   }
   ```
   Skip this entirely for same-origin + `SameSite=Lax` — it's not needed there and is extra surface for no benefit.

7. **CORS: explicit origin allow-list + `credentials: true`** — never a wildcard `*` once cookies are credentialed; browsers reject wildcard origin on credentialed requests outright. Read allowed origins from an env var (e.g. `ALLOWED_ORIGINS`, comma-separated), fall back to the local dev origin only.

8. **`POST /auth/logout`** — clears both cookies (`clearCookie` with matching flags).

9. **Socket.io (if used) — cookie-based handshake auth.** The frontend can no longer read the httpOnly cookie to pass via `socket.handshake.auth`; instead read it directly off the raw `Cookie` header during the handshake, since the browser attaches it automatically:
   ```ts
   function readCookie(header: string | undefined, name: string): string | undefined {
     return header?.split(";").map(p => p.trim()).find(p => p.startsWith(`${name}=`))?.slice(name.length + 1);
   }
   io.use((socket, next) => {
     const token = readCookie(socket.handshake.headers.cookie, "app_token");
     if (!token) return next(new Error("Authentication required"));
     try {
       socket.data.userId = (jwt.verify(token, JWT_SECRET) as { id: string }).id;
       next();
     } catch { next(new Error("Invalid or expired token")); }
   });
   ```
   Write this small manual parser rather than pulling in a `cookie` package dependency if the project's conventions discourage new dependencies for trivial parsing.

## Frontend checklist

1. **`authFetch()` wrapper** — every authenticated API call goes through one function that sends `credentials: "include"` and attaches the CSRF header on mutating methods:
   ```ts
   const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
   function readCookie(name: string): string | undefined {
     return document.cookie.split("; ").find(r => r.startsWith(`${name}=`))?.slice(name.length + 1);
   }
   export function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
     const method = (init.method ?? "GET").toUpperCase();
     const headers = new Headers(init.headers);
     if (MUTATING_METHODS.has(method)) {
       const csrf = readCookie("app_csrf");
       if (csrf) headers.set("X-CSRF-Token", csrf);
     }
     return fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
   }
   ```
   Skip the CSRF-header half if same-origin/`SameSite=Lax` (step 0).

2. **Async auth context with `isLoading`.** Once the token lives in an httpOnly cookie, the frontend can't read it — auth state can only be known by asking the backend (`GET /auth/me`) on mount. This makes resolving the session inherently async, unlike a synchronous `localStorage` read. Expose `isLoading` from the auth hook/context alongside `isAuthenticated`.

3. **⚠️ Gotcha — update every redirect guard.** Any page/route that does a synchronous `if (!isAuthenticated) return <Redirect />` on render will flash-redirect an already-logged-in user on every refresh, because auth now resolves after a network round trip instead of instantly. Audit every such guard and gate it behind `isLoading`:
   ```tsx
   const { isAuthenticated, isLoading } = useAuth();
   if (isLoading) return <Spinner />;
   if (!isAuthenticated) return <Navigate to="/login" />;
   ```
   This was the single regression caught in the Hiram migration — it silently breaks every protected page's refresh behavior if missed.

4. **Socket client** — connect with `withCredentials: true` instead of manually passing a token:
   ```ts
   io(BACKEND_URL, { withCredentials: true });
   ```

## Verification before calling it done

- Run the project's type-check/lint — catches missing-package/type issues (e.g. cookie-parsing without `@types/cookie-parser`) fast.
- **Explicitly tell the user** if no browser/E2E testing was done — lint/type-check alone does not confirm login/logout/CSRF/refresh flows actually work end-to-end. Don't imply "done" covers manual verification it doesn't.
- Confirm the production platform env is actually set the way the code assumes — e.g. `NODE_ENV=production` must be set on the host for `Secure`/`SameSite=None` to activate; if the host defaults `NODE_ENV` differently, cookies will silently use dev flags in prod and cross-origin auth will break with no error message, just a dropped cookie.
- Confirm the CORS allow-list env var is actually populated with the real frontend domain in production — this is easy to write code for and then forget to configure.
- If adding `token_valid_after` or similar to an existing users table, confirm the migration has actually been applied to the live DB, not just written to a migration file.

## Out of scope for this skill

- Password reset / email verification flows (separate concern, not covered by this session's work).
- OAuth/social login.
- Refresh-token rotation (this pattern uses a single medium-lived token + revocation column instead — simpler, was sufficient here).
