# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Hiram** (Tagalog for "borrow") — a peer-to-peer item rental marketplace for the Philippines. Web-first MVP. People list items they own for short-term rent; others nearby find and borrow them.

Current state: Phase 2+ is live. Real PostgreSQL database (Neon, serverless Postgres — `neondb`), cookie-based auth (httpOnly session + CSRF, not bearer tokens), Socket.io real-time messaging, PayMongo payments, reports/moderation, and a Vite dev proxy so the frontend hits the Express backend directly.

S3 image uploads are **temporarily disabled** (`UPLOADS_DISABLED = true` in `upload.controller.ts` returns 503); the wiring is intact and re-enabling is a one-line flip.

Deployment targets AWS — S3 + CloudFront (frontend) and Elastic Beanstalk (backend) — but **both deploy workflows are currently disabled**, running only via `workflow_dispatch` pending master-ruleset testing. A Vercel frontend is in flight on the `deploy/vercel-frontend` branch and is not yet the production path.

---

## Dev commands

All commands run from the repo root unless noted.

```bash
npm run dev          # start backend + frontend concurrently
npm run dev:fe       # frontend only  (Vite + proxy → localhost:5173)
npm run dev:be       # backend only   (nodemon/tsx → localhost:3101)
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
| `JWT_SECRET` | Session token signing secret |
| `PORT` | Defaults to 3101 if absent |
| `NODE_ENV` | Drives cookie `secure` flag and error verbosity |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist |
| `FRONTEND_URL` | Base URL used for redirects (e.g. PayMongo return) |
| `PAYMONGO_SECRET_KEY` | PayMongo API key |
| `PAYMONGO_WEBHOOK_SECRET` | Verifies webhook signatures against the raw body |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | S3 image upload (currently disabled) |

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
| `database.md` | Live tables, enums, migration workflow, SQL guard |
| `scope.md` | What is live, pending, disabled, and out of scope |
| `testing.md` | Vitest (frontend) + Jest (backend), how to run them |
| `hooks.md` | Active Claude hooks, guards, custom skills |
| `git-workflow.md` | GitHub rulesets, branch flow, PR requirements for `pre-master-branch` / `master` |

> All rules files were re-verified against source on 2026-08-19 (`/audit-claude`, see `.claude/audit-report.md`). If you find a contradiction, trust the actual source files and fix the rule.

Backlog of unbuilt work lives in `.claude/task.md`. The old `.claude/plans/` and `roadmaps/` folders were deleted — do not reference them.
