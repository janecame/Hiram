# Goal: Complete the Payment Feature (Idempotency Fix + Cash Payment Flow)

Combines the webhook idempotency fix and the payment flow plan into a single
implementation target. Testing/verification is intentionally excluded — tracked
separately in `payment-flow-plan.md`'s Verification section, not part of this goal.

Agent interview findings (2026-07-14) are folded in below. One correction from that
interview: the borrower-side PayMongo "Pay Now" flow already exists and works — it is
**not** part of this goal. The only missing frontend piece is the lister-side cash
confirmation.

---

## Scope of this goal

1. Webhook idempotency fix (re-entrancy guard on `markPaidBySessionId`)
2. Ownership check missing on `GET /api/payments/request/:requestId` (new finding
   from Agent_BE — any authenticated user can currently read any request's payment
   info by guessing the request id)
3. Cash payment path (new `payment_method` enum/column, `createCashPayment`,
   `confirmCashPayment`)
4. Lister-side "Confirm Cash Received" UI (the only net-new frontend surface —
   borrower-side "Pay Now" already ships in `MyItemsPage.tsx`)

---

## Agent_DB — schema work

**File:** `backend/migrations/023_add_payment_method.sql` (new)

```sql
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('paymongo', 'cash');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS method payment_method NOT NULL DEFAULT 'paymongo';
```

- Confirmed sound: NULL `paymongo_checkout_session_id` on cash rows won't collide
  with the existing UNIQUE constraint — Postgres treats NULLs as distinct.
- Add a composite index if the app will ever query "all pending cash payments":
  `CREATE INDEX IF NOT EXISTS payments_method_status_idx ON public.payments(method, status);`
- Consider a CHECK constraint (or app-layer guard in the model, whichever is
  simpler) so a `method = 'cash'` row can't end up with a stray
  `paymongo_checkout_session_id` / `paymongo_payment_id` / `checkout_url` populated
  by a future code path. Decide which layer enforces this before writing the
  migration.
- Apply via `npm run migrate` or `psql` per this repo's DB rules — do not run
  destructively, follow the existing idempotent-migration style used in every
  prior file (`IF NOT EXISTS`, exception-swallowed `CREATE TYPE`).

---

## Agent_BE — backend work

**Files:** `backend/src/types/payment.ts`, `backend/src/models/payment.model.ts`,
`backend/src/controllers/payment.controller.ts`, `backend/src/routes/payments.ts`

### 1. Idempotency fix (webhook re-entrancy)

`markPaidBySessionId` — scope the UPDATE to rows not already paid so a PayMongo
webhook redelivery is a no-op instead of re-firing notifications:

```sql
UPDATE public.payments
SET status = 'paid', paymongo_payment_id = $1, paid_at = now()
WHERE paymongo_checkout_session_id = $2 AND status != 'paid'
RETURNING *
```

No controller change needed — `if (payment) { ...notifications... }` already
skips the block when the function returns `undefined` on a 0-row update. Still
respond `200 { received: true }` either way so PayMongo stops retrying.

### 2. Ownership check on `getStatus` (new finding)

`GET /api/payments/request/:requestId` currently has no ownership check — any
authenticated user can read any request's payment record. Fix in
`PaymentController.getStatus`: after `findByRequestId`, verify
`req.user.id === payment.borrowerId || req.user.id === payment.listerId`,
else 403 — matching the ownership-error convention (`"not_found" | "forbidden"`)
used elsewhere in this codebase.

### 3. Cash payment path

Add `method: PaymentMethod` (`'paymongo' | 'cash'`) to the `Payment` type.

- `PaymentModel.createCashPayment(requestId, borrowerId)` — same ownership/status
  validation as `createCheckout` (request must be `approved`, not already paid),
  but skips the PayMongo API call entirely: inserts a row with `method = 'cash'`,
  `status = 'pending'`, no session id/checkout url.
- `PaymentModel.confirmCashPayment(requestId, listerId)` — validates caller is the
  request's `lister_id`, validates `method = 'cash'` and current `status =
  'pending'`, then updates to `status = 'paid', paid_at = now()`. Returns
  `"not_found" | "forbidden" | "invalid_state"`, controller maps to 404/403/400.
- `PaymentController.createCash` / `confirmCash` — same error-mapping shape as
  `createCheckout`. `confirmCash` also creates a notification for the borrower
  ("Lister confirmed your cash payment") + `emitToUser`, mirroring what the
  webhook does for the PayMongo path.
- New routes:
  ```ts
  router.post("/cash", express.json(), requireAuth, PaymentController.createCash);
  router.patch("/:id/confirm-cash", express.json(), requireAuth, PaymentController.confirmCash);
  ```
- Note the TOCTOU gap Agent_BE flagged in the existing `createCheckout` (no row
  lock between the "not already paid" check and the insert/update) — apply the
  same care in `createCashPayment`/`confirmCashPayment` rather than introducing a
  second instance of the same race. A `SELECT ... FOR UPDATE` on the existing
  payment row (if any) before branching is the simplest guard; not required to
  fully solve the pre-existing PayMongo-path race as part of this goal, but don't
  add a new race in the cash path.

---

## Agent_FE — frontend work

**Files:** `frontend/src/types/payment.ts`, `frontend/src/api/payments.ts`,
`frontend/src/hooks/usePayments.ts`, `frontend/src/pages/DashboardPage.tsx`

### Correction from agent interview

Borrower-side PayMongo "Pay Now" is **already implemented and working** —
`usePaymentStatus` / `useCreateCheckout` in `usePayments.ts`, consumed by
`MyItemsPage.tsx`'s `RequestHistoryRow` (~line 475-567), gated on
`req.status === "approved"`, redirects to `payment.checkoutUrl` on success. **Do
not rebuild this** — it is out of scope for this goal.

### What's actually net-new

1. Mirror the `method: PaymentMethod` field into `frontend/src/types/payment.ts`.
2. `frontend/src/api/payments.ts` — add:
   - `createCashPayment(requestId): Promise<Payment>` → `POST /api/payments/cash`
   - `confirmCashPayment(paymentId): Promise<Payment>` → `PATCH /api/payments/:id/confirm-cash`
3. `frontend/src/hooks/usePayments.ts` — add:
   - `useCreateCashPayment()` mutation → invalidates `["payment", requestId]`
   - `useConfirmCashPayment()` mutation → invalidates `["payment", requestId]`
4. Borrower side (`MyItemsPage.tsx`) — extend the existing "Pay now" control to
   offer a method choice (**Pay Online** vs **Pay in Person**) instead of going
   straight to `createCheckout`. Cash choice calls `useCreateCashPayment` and
   shows "Awaiting lister confirmation" instead of redirecting.
5. Lister side (`DashboardPage.tsx`, "Active Rentals" tab, ~line 216-266) — this
   is the one surface with **no existing equivalent**. Add a "Confirm Cash
   Received" button next to the existing "Mark as Returned" action, gated on
   `usePaymentStatus(req.id)` showing `method === 'cash' && status === 'pending'`.
   Calls `useConfirmCashPayment`.
6. Note flagged by Agent_FE: `["payment", requestId]` is per-request only — if the
   lister tab needs to show payment state across many requests at once, check
   whether N individual `usePaymentStatus` calls are acceptable before building,
   or whether a bulk query key is worth adding. Decide this during implementation,
   not before — don't over-build a bulk endpoint speculatively.

---

## Files to create / modify (summary)

| File | Owner | Action |
|---|---|---|
| `backend/migrations/023_add_payment_method.sql` | Agent_DB | Create |
| `backend/src/types/payment.ts` | Agent_BE | Edit — add `method` |
| `frontend/src/types/payment.ts` | Agent_FE | Edit — mirror |
| `backend/src/models/payment.model.ts` | Agent_BE | Edit — idempotency fix, `createCashPayment`, `confirmCashPayment` |
| `backend/src/controllers/payment.controller.ts` | Agent_BE | Edit — ownership check on `getStatus`, `createCash`, `confirmCash` |
| `backend/src/routes/payments.ts` | Agent_BE | Edit — 2 new routes |
| `frontend/src/api/payments.ts` | Agent_FE | Edit — 2 new functions |
| `frontend/src/hooks/usePayments.ts` | Agent_FE | Edit — 2 new mutations |
| `frontend/src/pages/MyItemsPage.tsx` | Agent_FE | Edit — method choice on existing Pay Now control |
| `frontend/src/pages/DashboardPage.tsx` | Agent_FE | Edit — new Confirm Cash Received button |

## Explicitly out of scope for this goal

- Rebuilding the borrower-side PayMongo flow (already works).
- Refunds.
- Disputing a cash confirmation (lister's confirmation is final, per earlier
  decision).
- Manual sandbox test, webhook signature live test, and Jest unit tests — all
  tracked in `payment-flow-plan.md`'s Verification section, not this goal.
- Fully solving the pre-existing PayMongo `createCheckout` TOCTOU race — only
  avoiding introducing a duplicate of it in the new cash path.
