# /document

Document the task, fix, or modification just completed in this session.

## Steps

1. Review the conversation to identify what was just done — the file(s) changed, the problem, and the solution.
2. Generate a short, descriptive kebab-case filename based on the topic (e.g., `fix-balancesheet-datalist-crash.md`, `feature-dashboard-chart-update.md`). Place the file inside the `.claude/documentation/` folder (create the folder if it does not exist).
3. Write the documentation file using this structure:

```
# [Short Title]

**File(s) affected:** ...
**Date:** <today's date>

## What Was Done
<1–2 sentence summary of the task or change>

## Problem (if a bug fix)
<Describe the error or issue>

## Root Cause (if a bug fix)
<Why it happened>

## Fix / Change Applied
<Before and after code snippets if applicable>
```

4. Tell the user the filename that was created and where it was saved.

## Rules
- Do NOT overwrite existing files — always generate a unique filename.
- Keep each section concise. No filler text.
- Only document what actually happened in this session.
