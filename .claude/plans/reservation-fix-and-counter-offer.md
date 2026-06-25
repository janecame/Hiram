# Reservation Fix + Counter-Offer Plan

## Phase 1 — Fix double-booking bug

**Why:** Lister can accidentally approve two overlapping requests for the same item (quantity 1). Current auto-decline logic counts ALL approved requests regardless of date overlap, and new requests submitted after approval are never blocked at create time.

**Do this phase first — backend only, no migration needed.**

### Changes

**`backend/src/models/request.model.ts` — `create()`**
- Before inserting, query count of approved requests whose dates overlap the new request's dates
- Overlap condition: `approved.start_date < new.end_date AND new.start_date < approved.end_date`
- If `count >= item.quantity`, throw 400 "This item is already booked for those dates"

**`backend/src/models/request.model.ts` — `updateStatus()` (approve path)**
- Before approving, run the same overlap + quantity check
- If fully booked, auto-decline the request being approved and notify borrower
- For auto-declining other pending requests: only decline those whose dates OVERLAP the newly approved request (not all pending regardless of dates)

---

## Phase 2 — Counter-offer feature (optional for lister)

**Why:** Instead of just declining a conflicting or unwanted request, the lister can propose new dates. Borrower gets notified and can accept or decline. Lister-initiated only — they can still just decline normally.

**Do after Phase 1. Requires a DB migration and new frontend UI.**

### New request status flow
```
pending → counter_offered → pending (borrower accepts) → approved
                          → declined (borrower rejects)
```

### Backend changes

**Migration** — add to `backend/migrations/`:
- `proposed_start_date TIMESTAMPTZ` column on `public.requests`
- `proposed_end_date TIMESTAMPTZ` column on `public.requests`
- Add `counter_offered` to the `request_status` enum

**New endpoint:** `PATCH /api/requests/:id/counter`
- Lister submits `{ proposedStartDate, proposedEndDate }`
- Sets status → `counter_offered`, saves proposed dates
- Sends `counter_offered` notification to borrower

**Extend `updateStatus`** to handle:
- `accept_counter` (borrower) → resets `start_date`/`end_date` to proposed dates, status → `pending`, notifies lister
- `decline_counter` (borrower) → status → `declined`, notifies lister

**New notification types:** `counter_offered`, `counter_accepted`, `counter_declined`

### Frontend changes

**MyItemsPage (lister's requests tab)**
- Add "Propose new dates" button on pending requests
- Opens a date picker dialog with two date fields (proposed start + end)
- Submits to `PATCH /api/requests/:id/counter`

**DashboardPage or borrower's request view**
- Show `counter_offered` requests with the proposed dates highlighted
- Two action buttons: Accept / Decline

**Notifications**
- `counter_offered` notification links borrower directly to the relevant request with the proposed dates visible