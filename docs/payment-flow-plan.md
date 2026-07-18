# Payment Flow Plan (pending — not started)

Covers the two missing pieces identified while auditing the PayMongo integration:
1. No frontend UI wired to the existing PayMongo backend (checkout / status).
2. No in-person / cash payment path, including lister-side confirmation.

Also see [paymongo-webhook-idempotency-fix.md](paymongo-webhook-idempotency-fix.md) —
apply that fix in the same pass since it touches the same model file.

---

## Decisions confirmed with user

- Two payment methods: **PayMongo** (GCash/Maya/card, already built) and **cash /
  in-person** (new — borrower and lister settle outside the app).
- For cash, the **lister actively confirms** receipt — not a passive status mirror.
  Borrower does not have a separate "I paid" action; lister's confirmation is what
  marks the payment settled.

---

## Schema changes

`backend/migrations/023_add_payment_method.sql` (next number after 022):

```sql
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('paymongo', 'cash');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS method payment_method NOT NULL DEFAULT 'paymongo';
```

`payment_status` enum already has `pending`, `paid`, `failed`, `refunded`, `expired` —
reuse `pending` for "cash chosen, awaiting lister confirmation" and `paid` for
"lister confirmed receipt." No new enum value needed there.

---

## Backend changes

### `backend/src/types/payment.ts` (+ mirror in `frontend/src/types/payment.ts`)

```ts
export type PaymentMethod = 'paymongo' | 'cash';
```

Add `method: PaymentMethod` to the `Payment` interface.

### `backend/src/models/payment.model.ts`

- `rowToPayment` — map `method` column.
- `createCheckout` — rename conceptually to PayMongo-only path (unchanged behavior),
  still requires `status === 'approved'` on the request and blocks if already paid.
- New `createCashPayment(requestId, borrowerId)` — same ownership/status validation
  as `createCheckout`, but no PayMongo API call: inserts a row with
  `method = 'cash'`, `status = 'pending'`, no checkout session/url.
- New `confirmCashPayment(requestId, listerId)` — validates the caller is the
  `lister_id` on the payment, validates `method = 'cash'` and current
  `status = 'pending'`, then `UPDATE ... SET status = 'paid', paid_at = now()`.
  Returns `"not_found" | "forbidden" | "invalid_state"` per the ownership-error
  convention in `backend-style.md`, controller maps to 404/403/400.
- Apply the idempotency fix from `paymongo-webhook-idempotency-fix.md` to
  `markPaidBySessionId` at the same time (`AND status != 'paid'` in the WHERE clause).

### `backend/src/controllers/payment.controller.ts`

- `createCheckout` unchanged (PayMongo path).
- New `createCash` — calls `PaymentModel.createCashPayment`, same error-status
  mapping pattern as `createCheckout`.
- New `confirmCash` — calls `PaymentModel.confirmCashPayment`; on success, create a
  notification for the borrower ("Lister confirmed your cash payment") + `emitToUser`,
  mirroring what the webhook does for PayMongo.

### `backend/src/routes/payments.ts`

```ts
router.post("/cash", express.json(), requireAuth, PaymentController.createCash);
router.patch("/:id/confirm-cash", express.json(), requireAuth, PaymentController.confirmCash);
```

Keep existing `/checkout`, `/request/:requestId`, `/webhook` routes as-is.

---

## Frontend changes

### `frontend/src/api/payments.ts`

Add:
- `createCashPayment(requestId): Promise<Payment>` → `POST /api/payments/cash`
- `confirmCashPayment(paymentId): Promise<Payment>` → `PATCH /api/payments/:id/confirm-cash`

### New hook: `frontend/src/hooks/usePayments.ts`

Per `architecture.md` convention (hooks own query keys + mutations):
- Query key: `["payment", requestId]` — wraps `getPaymentStatus`.
- `useCreateCheckout()` mutation → on success, redirect to `payment.checkoutUrl`.
- `useCreateCashPayment()` mutation → invalidates `["payment", requestId]`.
- `useConfirmCashPayment()` mutation → invalidates `["payment", requestId]`.

### UI — borrower side

On the request card/detail (wherever approved requests surface — likely
`DashboardPage` or a requests list component):
- When `request.status === 'approved'` and no payment yet (or payment `failed`):
  show **"Pay Now"** control with a method choice: **Pay Online (PayMongo)** vs
  **Pay in Person (Cash)**.
  - PayMongo choice → `useCreateCheckout` → redirect to `checkoutUrl`.
  - Cash choice → `useCreateCashPayment` → show "Awaiting lister confirmation" state.
- When payment `status === 'pending'` and `method === 'paymongo'` → show "Payment
  pending" (borrower already redirected once; this covers return visits).
- When payment `status === 'pending'` and `method === 'cash'` → show "Waiting for
  lister to confirm cash received."
- When payment `status === 'paid'` → show "Paid" badge, `paidAt` date.
- Handle the `?payment=success` / `?payment=cancelled` query params already built
  into `payment.model.ts`'s `success_url`/`cancel_url` — read on `DashboardPage`
  mount, show a toast, then strip the param and refetch `["payment", requestId]`.

### UI — lister side

On the lister's view of the same request:
- When payment `method === 'cash'` and `status === 'pending'` → show **"Confirm
  Cash Received"** button → `useConfirmCashPayment`.
- When payment `method === 'paymongo'` → read-only status mirror (no lister action
  — webhook is the source of truth).
- When `status === 'paid'` → "Paid" badge on lister's side too.

---

## Files to create / modify

| File | Action |
|---|---|
| `backend/migrations/023_add_payment_method.sql` | Create |
| `backend/src/types/payment.ts` | Edit — add `method` |
| `frontend/src/types/payment.ts` | Edit — mirror |
| `backend/src/models/payment.model.ts` | Edit — `createCashPayment`, `confirmCashPayment`, idempotency fix |
| `backend/src/controllers/payment.controller.ts` | Edit — `createCash`, `confirmCash` |
| `backend/src/routes/payments.ts` | Edit — 2 new routes |
| `frontend/src/api/payments.ts` | Edit — 2 new functions |
| `frontend/src/hooks/usePayments.ts` | Create |
| Borrower-facing request UI (TBD exact file — dashboard/requests component) | Edit — Pay Now control + status states |
| Lister-facing request UI (same component or lister equivalent) | Edit — Confirm Cash Received control |
| `.claude/plans/status.md`, `.claude/plans/pending-plans.md` | Edit — reflect real state once shipped |

## Verification (3rd missing piece — nothing here has ever been exercised)

None of the PayMongo integration has run once against the real API. Three checks,
split by who drives them:

### 1. Manual sandbox test — human-driven
User runs this, not Claude — requires interacting with PayMongo's hosted checkout
page directly:
- Use PayMongo test-mode keys (`PAYMONGO_SECRET_KEY` / `PAYMONGO_PUBLIC_KEY`).
- Call `POST /api/payments/checkout` against a real `approved` request.
- Follow the returned `checkoutUrl` into PayMongo's sandbox checkout, pay with a
  PayMongo test card / test GCash flow.
- Confirm the webhook fires and the payment flips to `paid` in the `payments` table.
- This is the only way to confirm the PayMongo API response shape (field names in
  `createCheckout`'s `json.data...` parsing) still matches what PayMongo returns —
  none of that has been validated against a live response yet.

### 2. Webhook signature double-check — human-driven
- Use PayMongo dashboard's "send test webhook" feature to fire a real signed event
  at the endpoint (via `ngrok` or similar for local).
- Confirm `verifyWebhookSignature` in `payment.controller.ts` accepts it — validates
  the `t=...,te=...`/`li=...` header parsing and HMAC comparison against what
  PayMongo actually sends today, not just what the code assumes.

### 3. Backend automated tests — Claude can write these
Jest unit tests for `payment.model.ts` (mocking `fetch` to PayMongo, no real API
calls):
- `createCheckout` — amount calculation (day-rate vs. `use_hours` hour-rate),
  ownership guard (`borrower_id` mismatch → 403), status guard (request not
  `approved` → 400), already-paid guard (→ 400).
- `createCashPayment` / `confirmCashPayment` (once built) — same ownership/state
  guards, plus lister-only enforcement on confirm.
- `markPaidBySessionId` idempotency fix — asserts a second call with the same
  session id returns `undefined` (0 rows affected) instead of re-running.

Note: `testing.md` currently says no test framework exists in this repo yet — this
would be the first. Confirm before introducing Jest test files under
`backend/src/models/__tests__/` (or wherever the convention lands), since it's a
policy change, not just new code.

---

## Out of scope (for this pass)

- Refunds (`refunded` status exists in the enum but no refund flow/endpoint).
- Payment method selection persisted before request approval (method is chosen at
  pay-time, not at request-time).
- Disputing a cash confirmation (lister's confirmation is treated as final, per
  user decision).
