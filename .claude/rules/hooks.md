# Hooks & Guards

Active hooks configured in `.claude/settings.json` (and allowed in `.claude/settings.local.json`):

| Hook | Trigger | Behavior |
|---|---|---|
| `guard-appsettings.ps1` | PreToolUse Write/Edit | Blocks edits to `appsettings.json` — edit manually if needed |
| `guard-sql.ps1` | PreToolUse Bash | Blocks `psql` calls containing DROP/TRUNCATE/DELETE/UPDATE/INSERT |
| bash-log | PreToolUse Bash (async) | Appends every bash command to `.claude/bash-log.txt` |
| edit-log | PostToolUse Write/Edit (async) | Appends every edited `.ts/.tsx/.js/.jsx/.cs/.csproj` path to `.claude/edit-log.txt` |
| Stop message | Session end | Reminds to run `git status` |

`.claude/hooks/test-runner.sh` exists but is **empty and unwired** — it runs nothing. See `testing.md`.

## Custom skills

| Skill | Purpose |
|---|---|
| `/analyze <page or feature>` | Traces full code flow from frontend page → hook → API → backend route |
| `/document` | Documents the task or fix just completed in this session |
| `/audit-claude` | Audits `.claude/` against the real codebase and writes `.claude/audit-report.md` (report only, never edits) |
| `/auth-setup` | Auth setup guidance |
| `/github-workflows` | GitHub Actions workflow work |
| `/review-pr` | PR review |

Each is defined in `.claude/skills/<name>/SKILL.md`.

## Agents

`.claude/agents/` is currently **empty by design**. The five legacy JSON definitions
(`api-designer`, `db-architect`, `security-auditor`, `test-generator`, `ui-engineer`) were removed in
the 2026-08-19 audit: none were registered with the runtime, and all pinned a retired model. The live
agent roster comes from the runtime (`Agent_BE`, `Agent_FE`, `Agent_DB`, `Agent_TL`, `Agent_UI`,
`Agent_Deployment`, plus built-ins). Do not re-add JSON agent files unless they are actually wired.
