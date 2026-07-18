# PayMongo Webhook Idempotency Fix (pending)

## Problem

`POST /api/payments/webhook` (`backend/src/controllers/payment.controller.ts`) has no
re-entrancy guard. PayMongo delivers webhooks at-least-once — it will resend the same
event if our server times out, errors, or is slow to respond.

The payment itself is not affected (PayMongo owns the actual charge), but our own
app-level notification is not deduplicated. On a redelivery of the same
`checkout_session.payment.paid` event, the handler creates a second `notifications` row
and fires a second Socket.io push to both borrower and lister — a duplicate
"payment received" notification for a single real payment.

## Fix

Use the `status` column itself as the idempotency guard by scoping the UPDATE to rows
not already paid.

**`backend/src/models/payment.model.ts`** — `markPaidBySessionId`:

```sql
UPDATE public.payments
SET status = 'paid', paymongo_payment_id = $1, paid_at = now()
WHERE paymongo_checkout_session_id = $2 AND status != 'paid'
RETURNING *
```

If PayMongo redelivers the event, this matches 0 rows, so the function returns
`undefined` — same shape already returned when the session isn't found.

**`backend/src/controllers/payment.controller.ts`** — no change needed. The webhook
handler already does `if (payment) { ...create notifications... }`, so on a retry
`payment` will be `undefined` and the notification block is skipped naturally. Still
respond `200 { received: true }` either way so PayMongo stops retrying.

## Status

Not yet applied. Apply when PayMongo work resumes, alongside the rest of the
untested/incomplete payment integration (see `.claude/plans/pending-plans.md`).
