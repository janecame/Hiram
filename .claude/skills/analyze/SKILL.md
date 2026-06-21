# /analyze

Trace the full code flow for a page, form, or feature — from the React frontend down to the Express backend.

## Usage

```
/analyze <page or feature name>
```

Examples:
- `/analyze BrowsePage`
- `/analyze list item form`
- `/analyze item detail`

## Steps

You MUST follow every step in order. Do not skip.

### 1 — Locate the Frontend Page

Search `frontend/src/pages/` for a file matching the argument.
Read the page file.

### 2 — Find the Data Call or Submit Handler

For data-fetching pages: find the hook call (e.g., `useItems`, `useItem`).
For forms: find the submit handler (e.g., `onSubmit`, `handleSubmit`).
Note:
- The **hook** being called and its arguments
- For forms: the **data payload** being sent

### 3 — Trace the Hook

Open the hook file in `frontend/src/hooks/`.
Record:
- The **TanStack Query key** used
- The **API function** being called (imported from `frontend/src/api/items.ts`)
- The exact **file path and line number**

### 4 — Trace the API Function

Open `frontend/src/api/items.ts`.
Find the relevant function and record:
- What it does in mock phase (delay + in-memory store)
- The **full endpoint URL** it will call in Phase 2 (e.g., `GET /api/items`)
- The exact **file path and line number**

### 5 — Find the Backend Route + Controller

Search `backend/src/routes/` for the matching route.
Then follow it to `backend/src/controllers/item.controller.ts`.
Record:
- **Route file** and HTTP method + path
- **Controller method** name and line number
- The **model method** it calls

### 6 — Trace the Model

Open `backend/src/models/item.model.ts`.
Find the model method called in Step 5.
Show the exact logic (filter, sort, create) and file path + line number.

---

## Output Format

```
## Code Flow: <Feature Name>

### FRONTEND PAGE
File:     <relative path>:<line>
Hook:     <hookName>(<args>)

### HOOK
File:     <relative path>:<line>
Key:      ["items", ...] | ["item", id]
API call: <functionName>(<args>)

### API FUNCTION
File:     <relative path>:<line>
Mock:     <what it does now>
Phase 2:  <HTTP method> <endpoint>

### BACKEND ROUTE
File:     <relative path>:<line>
Route:    <METHOD> <path>

### CONTROLLER
File:     <relative path>:<line>
Method:   <methodName>()
Calls:    ItemModel.<methodName>()

### MODEL
File:     <relative path>:<line>
Logic:    <what it does>
```

## Rules

- Use **file path + line number** for every entry so the user can jump directly to the code.
- If multiple flows exist (e.g., add vs. edit), show both side by side.
- If a layer cannot be found, say so explicitly — do not guess.
- Do not modify any files. This is **read-only analysis**.
- If the argument is ambiguous, ask the user to clarify before searching.
