# /analyze

Trace the full code flow for a page, form, or feature — from the React frontend down to the database.

## Usage

```
/analyze <page or feature name>
```

Examples:
- `/analyze Dashboard`
- `/analyze Warehouse Entry add form`
- `/analyze Customer List`

## Steps

You MUST follow every step in order. Do not skip.

### 1 — Locate the Frontend Page

Search `DMCGL/src/pages/` for a folder or file matching the argument.
Read the page file (usually `index.jsx`, `add.jsx`, or `edit.jsx`).

### 2 — Find the Submit / Save Handler

Look for the function that fires on form submit or save button click (e.g., `handleSave`, `handleSubmit`, `onSubmit`, `handleAdd`).
Note:
- The **data payload** being sent (field names and values)
- The **API function** being called (imported from `@/api/Cls*.js`)

### 3 — Trace the API Function

Open the imported API file in `DMCGL/src/api/`.
Find the relevant function and record:
- The **full endpoint URL** (e.g., `/API/WebAPI/tblWarehouseEntry/InsertWarehouseEntry`)
- The **HTTP method** (GET / POST / PUT / DELETE)
- The exact **file path and line number** where it is defined

### 4 — Find the Backend Controller

Search `DMCGLWebAPI/Controllers/` for the route that matches the endpoint URL found in Step 3.
Record:
- **Controller file** name and path
- **Action method** name and line number
- The **C# model / DTO** it receives (from `FldrModel/`)

### 5 — Extract the SQL Query

Inside the controller action, locate the raw ADO.NET SQL string (look for `SqlCommand`, `cmd.CommandText`, or inline SQL strings).
Show the full **SQL query** exactly as written in code, including the file path and line number.

### 6 — Identify the Database Schema

From the SQL query, extract every **table name** referenced.
For each table, list the **columns** involved in the query (SELECT, INSERT, UPDATE fields).

Use the credentials from `.env.local` (project root) to identify the target database:
- `SQLSERVER_HOST` — server
- `SQLSERVER_DATABASE` — database name
- `SQLSERVER_USER` / `SQLSERVER_PASSWORD` — credentials

Do **not** read `ClsGetConnection.cs` for connection details.

---

## Output Format

Present findings in this exact structure:

```
## Code Flow: <Feature Name>

### FRONTEND
File:        <relative path>:<line>
Handler:     <function name>
Payload:     <field: value, field: value, ...>
API Call:    <imported function name>()

### API ENDPOINT
File:        <relative path>:<line>
Method:      <HTTP method>
URL:         <full endpoint string>

### BACKEND CONTROLLER
File:        <relative path>:<line>
Controller:  <ClassName>
Action:      <MethodName>()
Model/DTO:   <ClsModelName>

### SQL QUERY
File:        <relative path>:<line>
---sql
<raw SQL query>
---

### DATABASE SCHEMA
Database: <SQLSERVER_DATABASE from .env.local>
Server:   <SQLSERVER_HOST from .env.local>
Table:    <TableName>
Columns involved:
  - <column> (<type if known>)
  - ...
```

## Rules

- Use **file path + line number** links for every entry so the user can jump directly to the code.
- If multiple submit handlers exist (add vs. edit), show **both flows** side by side.
- If the endpoint cannot be found in the backend, say so explicitly — do not guess.
- Do not modify any files. This is **read-only analysis**.
- If the argument is ambiguous, ask the user to clarify before searching.