# Claude Config Audit — 2026-08-19

Audit of `.claude/` against the live Hiram codebase, followed by a remediation pass.

- **Audit run:** 2026-08-19
- **Remediation scope applied:** docs + config cleanup (recommendations 1–9, 14–19). No application source was modified.
- **Deployment story adopted:** AWS committed but currently disabled; Neon DB; Vercel frontend in flight.

> **Postgres MCP was unavailable.** `mcp__postgres__query` did not resolve, so schema findings were
> diffed against `backend/migrations/*.sql` and the TypeScript types rather than `information_schema`.
> Re-run the Database section with the MCP server connected to confirm against the live DB.

---

## Corrections to the first pass

Two findings from the initial audit were wrong and are retracted:

| Original finding | Correction |
|---|---|
| "`request_status` may be missing `return_requested`" | **False alarm.** [008_notifications.sql:2](backend/migrations/008_notifications.sql#L2) adds it via `ALTER TYPE ... ADD VALUE IF NOT EXISTS`, and [016](backend/migrations/016_add_counter_offer.sql) adds `counter_offered`. `database.md` was right; my grep for `CREATE TYPE` simply missed the `ALTER TYPE`. |
| "Backend `jest` script may be broken — verify jest is installed" | **It works.** Jest 30 + ts-jest are hoisted to the root `node_modules/.bin` by npm workspaces, and `backend/jest.config.js` exists. Verified by running both suites: backend 5 passed, frontend 7 passed. The absent `backend/node_modules` is normal hoisting, not a missing install. |

One finding was materially sharpened:

| Original framing | Sharper truth |
|---|---|
| "Three files describe three different deployment targets — pick one" | Both AWS workflows ([deploy-frontend.yml](.github/workflows/deploy-frontend.yml) S3+CloudFront, [deploy-backend.yml](.github/workflows/deploy-backend.yml) Elastic Beanstalk) are real and committed, but **temporarily disabled** — push triggers commented out, `workflow_dispatch` only, pending master-ruleset testing. Neon genuinely replaced RDS. Vercel is an in-flight migration on this branch. Not a contradiction so much as an undocumented transition. |

---

## Resolved in this pass

| # | Item | What changed |
|---|---|---|
| 1 | Auth documented wrong | `architecture.md` + `backend-style.md` rewritten: httpOnly session cookie, `credentials: "include"`, `hiram_csrf` header echo, `token_valid_after` revocation. All `localStorage` / `hiram_token` / bearer-header language removed |
| 2 | Deployment contradiction | New "Production topology" section in `architecture.md`; `CLAUDE.md` and `scope.md` aligned — AWS committed-but-disabled, Neon, Vercel in flight |
| 3 | `testing.md` wholly wrong | Rewritten: Vitest (frontend) + Jest/ts-jest (backend), commands, existing tests, hoisting note, what to test next. Verified both suites pass |
| 4 | Shipped features listed as pending | `scope.md` moves PayMongo payments and reports/moderation to "live"; adds admin disable, terms gate, avatars |
| 5 | Stale folder trees | Both trees in `architecture.md` regenerated from the real tree, incl. `routes/messages.ts` → `/api/conversations` note |
| 6 | Route mount table | `backend-style.md` table corrected (12 mounts) + the `/api/payments`-before-`express.json()` raw-body constraint documented as a hard rule |
| 7 | `database.md` schema drift | 24 migrations / next is 025; added `reports`, `payments`, `admin_audit_log`; all missing columns; 4 previously-undocumented enums; stale `claims` warning replaced with a factual note |
| 8 | `data-model.md` field tables | ~15 missing Item/User fields added; non-existent `verified` field removed; `archived` vs `disabled` distinction called out; `NewItemInput` drift documented |
| 9 | Uploads + env | Upload-disabled state recorded in `CLAUDE.md` and `backend-style.md`; env table gains `PAYMONGO_*`, `ALLOWED_ORIGINS`, `FRONTEND_URL`, `NODE_ENV` |
| 14 | Orphaned agents | All 5 `.claude/agents/*.json` removed (git-tracked, recoverable). Only uncommitted change among them was a `3001`→`3101` port typo, already reflected in the rules. `hooks.md` records why the dir is empty |
| 15 | Ineffective SQL guard | `guard-sql.ps1` rewritten to guard `psql` (not `sqlcmd`), now also covering `DROP SCHEMA`/`DROP TYPE`/`ALTER TABLE`, pointing at `npm run migrate` |
| 16 | Over-broad permissions | `Bash(sqlcmd *)` and `Bash(dotnet *)` dropped from `settings.json` |
| 17 | Empty test-runner hook | `test-runner.sh` implemented to run both suites with a proper exit code; still intentionally unwired, and `hooks.md`/`testing.md` say so |
| 18 | Broken plans pointers | `scope.md` now points at `.claude/task.md`; deleted `.claude/plans/` and `roadmaps/` noted |
| 19 | Missing skills | `hooks.md` lists all 6 skills, not 2 |
| — | Frontend routes | `frontend-style.md` routes corrected: `/transaction` is the dashboard, `/dashboard` redirects, `/terms` `/login` `/signup` added, and `/my-items` flagged as commented out in `App.tsx` |

---

## Still open — application source, deliberately untouched

These were excluded from the approved scope. Each is now *documented* in the rules as a known
deviation, so the docs are honest even while the code is unchanged.

| # | Item | Where it is now recorded |
|---|---|---|
| 10 | `admin.controller.ts` calls `pool.query` directly; no `admin.model.ts` | "Known deviation" blocks in `architecture.md` and `backend-style.md` |
| 11 | 8 pages/components import `api/` directly, bypassing hooks | "Documented exceptions" list in `architecture.md` — auth, upload, chat-open, admin |
| 12 | `NewItemInput` FE/BE drift (`reviewCount`) | "Known FE/BE drift" in `data-model.md` |
| 13 | 4 duplicated theme hex values | "Known offenders" in `frontend-style.md` |
| — | `MyItemsPage.tsx` is unreachable (route commented out) | `frontend-style.md` + `scope.md` "Temporarily disabled" |

## Still open — needs your decision

- **Commit `.claude/task.md`** (recommendation 20). Not done: `CLAUDE.md` says "Do not auto-commit activity logs or docs files." It remains untracked and would be lost on a clean checkout.
- **Nothing has been committed.** The 5 agent deletions are *staged* as a side effect of `git rm`; every other change is unstaged in the working tree.
- **Re-verify the Database section** against the live DB once the Postgres MCP server is reachable.
- **Re-enable the AWS deploy workflows** (or retire them in favour of Vercel) once ruleset testing is done — the docs describe them as disabled, which is only true for now.
