# /audit-claude

Audit `.claude/` (rules, skills, agents, plans, docs) against the actual state of the Hiram codebase, and flag anything stale, unwired, contradictory, or unorganized. **This skill never deletes or edits anything on its own** — it only produces a report. The user decides what to remove, fix, or keep.

Priority order for this audit: **1) backend structure/style, 2) frontend structure/style, 3) database structure** — these are the heart of the project and get the deepest scrutiny. Everything else (skills wiring, stale docs) is secondary but still reported.

## Steps

### 1. Inventory
- List everything under `.claude/`: `rules/*.md`, `skills/*/SKILL.md`, `agents/*.json`, `hooks/`, `settings.json`, `settings.local.json`, any `plans/`, `documentation/`, loose `.md` files at the root.
- Note each file's last-modified date — a rules file untouched for a long time while the codebase around it changed heavily is a stale-content candidate.

### 2. Backend structure & style audit (highest priority)
- Compare the folder tree documented in `rules/architecture.md` (the `backend/src/` block) against the real `backend/src/` tree. Flag any route/controller/model file listed that doesn't exist, and any real file not listed.
- Verify the routes/controllers/models pattern in `rules/backend-style.md` is actually followed: spot-check 2-3 route files for logic that should be in a controller, and 2-3 controllers for raw SQL that should be in a model.
- Confirm the route mount table in `backend-style.md` matches what's actually mounted in `backend/src/index.ts`.

### 3. Frontend structure & style audit
- Compare the folder tree in `rules/architecture.md` (the `frontend/src/` block) against the real `frontend/src/` tree. Flag missing/extra files.
- Verify the data-flow law (pages/components → hooks → api → backend) isn't violated — spot-check a few pages/components for direct `fetch()` or `api/` calls bypassing hooks.
- Spot-check a few components for hardcoded hex colors or raw CSS/inline `style={}` that should go through the MUI theme, per `rules/frontend-style.md`.

### 4. Database structure audit
- Query live columns via `mcp__postgres__query` against `information_schema` (per `rules/database.md`'s own instruction) and diff against the field tables in `rules/data-model.md`. If the MCP tool isn't available, diff against `backend/migrations/*.sql` instead and say so in the report.
- Confirm the "live tables" list in `database.md` matches what's actually queryable, including the two known-undocumented tables (`claims`, `admin_audit_log`) — check whether they've since gained migration files.
- Confirm `backend/src/types/item.ts` and `frontend/src/types/item.ts` still match field-for-field (per the manual-sync procedure in `data-model.md`).

### 5. Skills & agents wiring check
- For each directory under `.claude/skills/`, confirm it appears in the current available-skills listing. Flag any on-disk skill that isn't wired/registered — it's dead weight that can still get read and followed as if active.
- For each `.claude/agents/*.json`, confirm it corresponds to something in the current available agent types. Flag any orphaned agent definition file.

### 6. Stale/contradictory content check
- Re-read `CLAUDE.md`'s "current state" line and cross-check every rules file for language that contradicts it (e.g., a file still describing mock data or Phase 1 when Phase 2+ is live — CLAUDE.md already flags this pattern, confirm whether it's still true and whether it's spread further).
- Flag any root-level `.md` or `.claude/plans/*.md` file that references removed features, resolved bugs, or completed migrations as if still pending.

### 7. Report
Write the findings to `.claude/audit-report.md` (overwrite previous run) using this structure, then summarize the top 3-5 findings in chat:

```
# Claude Config Audit — <date>

## Backend (structure & style)
| File/Area | Finding | Severity |
|---|---|---|
| ... | STALE / MISMATCH / UNWIRED / OK | ... |

## Frontend (structure & style)
...

## Database
...

## Skills & Agents wiring
...

## Stale / contradictory docs
...

## Recommended actions
- <plain list, no auto-execution — just recommendations for the user to approve>
```

## Rules
- Never delete, move, or edit any file as part of this skill — flag only.
- Never run destructive git commands.
- If a check requires the Postgres MCP tool and it isn't available, say so explicitly in the report rather than silently skipping it.
- Keep findings factual and cite the exact file/line where a mismatch was found.
