# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Hiram** (Tagalog for "borrow") — a peer-to-peer item rental marketplace for the Philippines. Web-first MVP. People list items they own for short-term rent; others nearby find and borrow them.

Current state: working web frontend + Express backend with a controller/model layer, both on in-memory mock data. No database, no auth.

---

## Dev commands

All commands run from the repo root.

```bash
npm run dev          # start backend + frontend concurrently
npm run dev:fe       # frontend only  (Vite, http://localhost:5173)
npm run dev:be       # backend only   (nodemon/tsx, http://localhost:3001)
npm run build        # build all workspaces (tsc + vite build)
```


## Prompt Clarification Rule

- **Before acting on any user prompt**, paraphrase the request back to the user and ask: "Is this what you mean?" (or similar). Wait for confirmation before proceeding with implementation.
- This applies to all feature requests, bug fixes, and instructions — do not start coding until the user confirms the paraphrased intent is correct.

## Modification Report Rule

- **After every completed task**, ask the user: "Would you like to see the list of edited files and lines?"
- If the user says **yes**, show the report in this exact format:

```
## ✅ Task Completed: [Task Name]

### Files Edited

| File | Line | Description |
|------|------|-------------|
| [Filename.jsx](path/to/file.jsx) | [28](path/to/file.jsx#L28) | Brief description of what changed on this line |
| [Filename.jsx](path/to/file.jsx) | [52](path/to/file.jsx#L52) | Brief description of what changed on this line |
```

- Every **File** and **Line** must be a clickable markdown link.
- The **Description** column must be a short phrase explaining what that specific line does (e.g. "Added GettblListMOP to imports", "Added MopCode to form state").
- If multiple files were edited, group lines under each file.

---

## Rules (`.claude/rules/`)

Detailed guidance lives in the rules files — all are auto-loaded:

| File | Covers |
|---|---|
| `architecture.md` | Data-flow law, backend layers, project structure, ports |
| `backend-style.md` | Express stack, route/controller/model conventions |
| `frontend-style.md` | MUI, typography, components, forms, routing, design tokens |
| `data-model.md` | Item + User field tables, mock API contract, field sync procedure |
| `database.md` | Current mock state, Phase 2 local PostgreSQL plan, migration workflow |
| `scope.md` | Phase 1 features, out of scope, Phase 2 migration steps |
| `testing.md` | No tests yet; planned stack when added |
| `hooks.md` | Active Claude hooks, guards, custom commands |
