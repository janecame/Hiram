# /audit-md-files

List every project Markdown file and explain its purpose in **exactly 5 words**, so the user can see at a glance what each doc is for. **This skill never edits or deletes anything** — it only reports in chat.

Optional argument: a folder to limit the scan (e.g. `/audit-md-files docs`). With no argument, scan the whole repo.

## Steps

### 1. Inventory
- Find all `*.md` files in the repo (or the given folder).
- Skip `node_modules/`, `dist/`, `.git/`, and `.claude/worktrees/`.

### 2. Read each file
- Read the title and first section of each file — enough to know its real purpose, not just its filename.
- Note anything that contradicts the current state in `CLAUDE.md` and `.claude/rules/` (e.g. a plan marked "pending" whose migration already exists, or a doc describing infrastructure that was replaced).

### 3. Report in chat
Group files by folder, one table per folder, in this exact format:

```
**`docs/`**

| File | Purpose |
|---|---|
| [task.md](.claude/task.md) | Backlog of future unbuilt work |
```

Rules for the table:
- **File** is a clickable markdown link with a workspace-relative path.
- **Purpose** is exactly 5 words, plain language, no trailing period.
- Describe what the file is *for*, not what it is called.

### 4. Out-of-date notes
After the tables, add a short "Possibly out of date" list (one line per file, saying why). Omit the section if nothing is stale.

Never print credentials, connection strings, or customer personal data found in any file.
