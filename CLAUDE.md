# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Hiram** (Tagalog for "borrow") — a peer-to-peer item rental marketplace for the Philippines. Web-first MVP. People list items they own for short-term rent; others nearby find and borrow them.

Current state: Phase 2 is live. Real PostgreSQL database (Neon, serverless Postgres — `neondb`), JWT auth, Socket.io real-time messaging, S3 image uploads, and a Vite dev proxy so the frontend hits the Express backend directly.

---

## Dev commands

All commands run from the repo root unless noted.

```bash
npm run dev          # start backend + frontend concurrently
npm run dev:fe       # frontend only  (Vite + proxy → localhost:5173)
npm run dev:be       # backend only   (nodemon/tsx → localhost:3001)
npm run build        # build all workspaces (tsc + vite build)
```

From `backend/`:
```bash
npm run migrate      # apply SQL migrations in backend/migrations/ (idempotent)
npm run seed         # seed DB from mock-items; creates placeholder users if needed
```

## Environment

`backend/.env` is required. Required keys:

| Key | Purpose |
|---|---|
| `DATABASE_URL` | Active PostgreSQL connection string — Neon (pooled), requires SSL |
| `AWS_RDS_DATABASE_URL` | Prior AWS RDS connection string, kept inactive after the Neon migration |
| `LOCAL_DATABASE_URL` | Fallback for local Postgres (no SSL) when `DATABASE_URL` is unset |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Defaults to 3001 if absent |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | S3 image upload |

Seed accounts: any `@seed.hiram.ph` email with password `password123`.

---

## Prompt Clarification Rule

- **Before acting on any user prompt**, paraphrase the request back to the user and ask: "Is this what you mean?" (or similar). Wait for confirmation before proceeding with implementation.
- This applies to all feature requests, bug fixes, and instructions — do not start coding until the user confirms.

## Modification Report Rule

- **After every completed task**, ask the user: "Would you like to see the list of edited files and lines?"
- If the user says **yes**, show the report in this exact format:

```
## ✅ Task Completed: [Task Name]

### Files Edited

| File | Line | Description |
|------|------|-------------|
| [Filename.tsx](path/to/file.tsx) | [28](path/to/file.tsx#L28) | Brief description of what changed |
```

- Every **File** and **Line** must be a clickable markdown link.
- Group lines under each file if multiple files were edited.

---

## Code Quality

- Choose the right data structure and algorithm for the problem; avoid over-engineering.
- No external libraries unless absolutely necessary — check `package.json` for correct existing versions.
- Apply least privilege: do not expose data or scope beyond what is needed.
- Avoid redundancy unless it genuinely improves usability.
- Watch for oversized files that need a refactor, and for syntax or style that mismatches the rest of the codebase.

## Comments & Style

- Comments are one-liners, one sentence only.
- No emojis or special characters in comments.
- Markdown files use kebab-case naming (e.g. `some-description-changes.md`).

## Version Control

- Commit after significant changes with clear, focused messages. Keep commits atomic.
- Never auto-push any branch — always wait for explicit instruction.
- Do not auto-commit activity logs or docs files.

## AI Restrictions

- Never output customer personal data: names, contacts, account numbers, or transactions.
- Never output credentials: passwords, API keys, tokens, or connection strings.

## Activity Log

- When completing a significant task or when context is getting complex, write a brief entry to `docs/activity-log.md` summarizing what changed and why.
- Do not commit `docs/activity-log.md` automatically.

---

## Rules (`.claude/rules/`)

Detailed guidance lives in the rules files — all are auto-loaded:

| File | Covers |
|---|---|
| `architecture.md` | Data-flow law, backend layers, project structure, ports |
| `backend-style.md` | Express stack, route/controller/model conventions |
| `frontend-style.md` | MUI, typography, components, forms, routing, design tokens |
| `data-model.md` | Item + User field tables, field sync procedure |
| `database.md` | PostgreSQL phase, migration workflow, SQL guard |
| `scope.md` | Phase 1 features, out of scope, Phase 2 migration steps |
| `testing.md` | No tests yet; planned stack when added |
| `hooks.md` | Active Claude hooks, guards, custom commands |
| `git-workflow.md` | GitHub rulesets, branch flow, PR requirements for `pre-master-branch` / `master` |

> Note: several rules files still describe Phase 1 (mock data, no proxy). Trust this CLAUDE.md and the actual source files over those descriptions.
