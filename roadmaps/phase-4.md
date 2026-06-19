# Phase 4 — Payments, Deposits & Ratings

**Goal:** Monetize the platform — handle payments, security deposits, and build trust through a ratings system.

---

## Features

### Payments
- Borrower pays through the platform when a request is approved
- Payment captured at request approval; released to lister after return confirmation
- Philippines-local payment methods (GCash, Maya, cards via PayMongo or similar)

### Security deposits
- Lister can set a required deposit amount on the listing
- Deposit held in escrow during the rental period
- Released back to borrower after return is confirmed with no damage report
- Deposit partially or fully withheld if lister files a damage claim

### Damage claims
- Lister can open a claim after a rental ends
- Evidence upload (photos)
- Resolution flow (manual admin review for Phase 4; automated dispute resolution is future)

### Ratings & reviews
- After a completed rental both parties rate each other (1–5 stars + optional comment)
- Ratings visible on user profiles and item listings
- `rating` field on `Item` becomes a real computed average from the `reviews` table
- Users accumulate a trust score based on completed rentals + ratings

---

## Data model additions

| Table / Field | Notes |
|---|---|
| `payments` table | `id`, `requestId`, `amount`, `deposit`, `status`, `provider`, `providerRef`, `createdAt` |
| `reviews` table | `id`, `requestId`, `reviewerId`, `revieweeId`, `itemId`, `rating`, `comment`, `createdAt` |
| `claims` table | `id`, `requestId`, `listerId`, `description`, `evidenceUrls`, `status`, `createdAt` |

---

## Stack additions

| Addition | Purpose |
|---|---|
| PayMongo SDK | PH-local payment processing (GCash, Maya, cards) |
| Supabase Edge Functions | Webhook handlers for payment events |