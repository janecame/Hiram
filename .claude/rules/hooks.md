# Hooks & Guards

Active hooks configured in `.claude/settings.json`:

| Hook | Trigger | Behavior |
|---|---|---|
| `guard-appsettings.ps1` | PreToolUse Write/Edit | Blocks edits to `appsettings.json` — edit manually if needed |
| `guard-sql.ps1` | PreToolUse Bash | Blocks `sqlcmd` calls with DROP/TRUNCATE/INSERT/UPDATE/DELETE |
| bash-log | PreToolUse Bash (async) | Appends every bash command to `.claude/bash-log.txt` |
| edit-log | PostToolUse Write/Edit (async) | Appends every edited `.ts/.tsx/.cs/.csproj` path to `.claude/edit-log.txt` |
| Stop message | Session end | Reminds to run `git status` |

## Custom skills

- `/analyze <page or feature>` — traces full code flow from frontend page → hook → API → backend route. Defined in `.claude/skills/analyze/SKILL.md`.
- `/document` — documents the task or fix just completed in this session. Defined in `.claude/skills/document/SKILL.md`.
