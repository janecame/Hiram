# Phase 3 — Messaging, Requests & Calendar

**Goal:** Make borrowing a complete transactional flow — lister receives requests, can approve or decline, and both parties can chat.

---

## Features

### Request / approve flow
- Borrower submits a borrow request (duration, message, proposed dates)
- Lister receives the request and can approve or decline
- Request statuses: `pending` / `approved` / `declined` / `cancelled`
- Notifications (in-app) on status change

### Real-time messaging — Supabase Realtime
- Per-request chat thread between lister and borrower
- Built on Supabase Realtime (Postgres changes broadcast)
- Chat UI (currently static in Phase 1) becomes functional

### Rental calendar
- Lister can mark dates as unavailable (blocked out)
- Borrower sees a calendar showing available date ranges
- Approved requests automatically block those dates

### Item status automation
- Item status (`available` / `reserved` / `unavailable`) driven by calendar + approved requests
- No longer manually set — derived from request state

---

## Data model additions

| Table / Field | Notes |
|---|---|
| `requests` table | `id`, `itemId`, `borrowerId`, `listerId`, `status`, `startDate`, `endDate`, `message`, `createdAt` |
| `messages` table | `id`, `requestId`, `senderId`, `body`, `createdAt` |
| `blocked_dates` table | `id`, `itemId`, `date` |

---

## Stack additions

| Addition | Purpose |
|---|---|
| Supabase Realtime | Live chat and request status updates |
| date-fns or dayjs | Calendar date math |
| MUI Date Picker (or similar) | Calendar UI component |