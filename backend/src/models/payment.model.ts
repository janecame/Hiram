import { pool } from "../db";
import type { Payment, PaymentStatus } from "../types/payment";

const PAYMONGO_API_BASE = "https://api.paymongo.com/v1";

function authHeader(): string {
  const secretKey = process.env["PAYMONGO_SECRET_KEY"] ?? "";
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row["id"] as string,
    requestId: row["request_id"] as string,
    borrowerId: row["borrower_id"] as string,
    listerId: row["lister_id"] as string,
    amount: parseFloat(row["amount"] as string),
    status: row["status"] as PaymentStatus,
    paymongoCheckoutSessionId: (row["paymongo_checkout_session_id"] as string | null) ?? undefined,
    paymongoPaymentId: (row["paymongo_payment_id"] as string | null) ?? undefined,
    checkoutUrl: (row["checkout_url"] as string | null) ?? undefined,
    paidAt:
      row["paid_at"] instanceof Date ? (row["paid_at"] as Date).toISOString() : undefined,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

export const PaymentModel = {
  async findByRequestId(requestId: string): Promise<Payment | undefined> {
    const result = await pool.query(
      `SELECT * FROM public.payments WHERE request_id = $1`,
      [requestId]
    );
    return result.rows[0] ? rowToPayment(result.rows[0] as Record<string, unknown>) : undefined;
  },

  async findByCheckoutSessionId(sessionId: string): Promise<Payment | undefined> {
    const result = await pool.query(
      `SELECT * FROM public.payments WHERE paymongo_checkout_session_id = $1`,
      [sessionId]
    );
    return result.rows[0] ? rowToPayment(result.rows[0] as Record<string, unknown>) : undefined;
  },

  async createCheckout(requestId: string, borrowerId: string): Promise<Payment> {
    const requestResult = await pool.query(
      `SELECT r.id, r.borrower_id, r.lister_id, r.status, r.start_date, r.end_date, r.use_hours,
              i.title, i.price_per_day, i.price_per_hour
       FROM public.requests r
       JOIN public.items i ON i.id = r.item_id
       WHERE r.id = $1`,
      [requestId]
    );
    const requestRow = requestResult.rows[0] as Record<string, unknown> | undefined;
    if (!requestRow) {
      throw Object.assign(new Error("Request not found"), { status: 404 });
    }
    if (requestRow["borrower_id"] !== borrowerId) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    if (requestRow["status"] !== "approved") {
      throw Object.assign(new Error("Request must be approved before payment"), { status: 400 });
    }

    const existing = await this.findByRequestId(requestId);
    if (existing && existing.status === "paid") {
      throw Object.assign(new Error("This request is already paid"), { status: 400 });
    }

    const pricePerDay = parseFloat(requestRow["price_per_day"] as string);
    const pricePerHour = requestRow["price_per_hour"]
      ? parseFloat(requestRow["price_per_hour"] as string)
      : undefined;
    const useHours = requestRow["use_hours"] as boolean;
    const startDate = requestRow["start_date"] as string;
    const endDate = requestRow["end_date"] as string;
    const itemTitle = requestRow["title"] as string;

    const amount =
      useHours && pricePerHour ? pricePerHour : pricePerDay * daysBetween(startDate, endDate);
    const amountCentavos = Math.round(amount * 100);

    const appUrl = process.env["FRONTEND_URL"] ?? "http://localhost:5173";
    const response = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            success_url: `${appUrl}/dashboard?payment=success`,
            cancel_url: `${appUrl}/dashboard?payment=cancelled`,
            payment_method_types: ["gcash", "paymaya", "card"],
            line_items: [
              {
                name: itemTitle,
                amount: amountCentavos,
                currency: "PHP",
                quantity: 1,
              },
            ],
            description: `Hiram rental payment for "${itemTitle}"`,
          },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`PayMongo checkout session creation failed: ${detail}`);
    }

    const json = (await response.json()) as {
      data: { id: string; attributes: { checkout_url: string } };
    };
    const sessionId = json.data.id;
    const checkoutUrl = json.data.attributes.checkout_url;

    if (existing) {
      const updated = await pool.query(
        `UPDATE public.payments
         SET amount = $1, status = 'pending', paymongo_checkout_session_id = $2,
             checkout_url = $3, paymongo_payment_id = NULL, paid_at = NULL
         WHERE id = $4
         RETURNING *`,
        [amount, sessionId, checkoutUrl, existing.id]
      );
      return rowToPayment(updated.rows[0] as Record<string, unknown>);
    }

    const inserted = await pool.query(
      `INSERT INTO public.payments
         (request_id, borrower_id, lister_id, amount, paymongo_checkout_session_id, checkout_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        requestId,
        borrowerId,
        requestRow["lister_id"],
        amount,
        sessionId,
        checkoutUrl,
      ]
    );
    return rowToPayment(inserted.rows[0] as Record<string, unknown>);
  },

  async markPaidBySessionId(sessionId: string, paymongoPaymentId: string): Promise<Payment | undefined> {
    const result = await pool.query(
      `UPDATE public.payments
       SET status = 'paid', paymongo_payment_id = $1, paid_at = now()
       WHERE paymongo_checkout_session_id = $2
       RETURNING *`,
      [paymongoPaymentId, sessionId]
    );
    return result.rows[0] ? rowToPayment(result.rows[0] as Record<string, unknown>) : undefined;
  },

  async markFailedBySessionId(sessionId: string): Promise<Payment | undefined> {
    const result = await pool.query(
      `UPDATE public.payments
       SET status = 'failed'
       WHERE paymongo_checkout_session_id = $1
       RETURNING *`,
      [sessionId]
    );
    return result.rows[0] ? rowToPayment(result.rows[0] as Record<string, unknown>) : undefined;
  },
};
