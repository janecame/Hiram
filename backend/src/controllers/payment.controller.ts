import crypto from "crypto";
import type { Request, Response } from "express";
import { PaymentModel } from "../models/payment.model";
import { NotificationModel } from "../models/notification.model";
import { emitToUser } from "../socket";

// PayMongo signs webhooks as "t=<timestamp>,te=<test_sig>,li=<live_sig>" (or just "te"/"li" alone).
// We verify against whichever signature field matches the key mode we're running in.
function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string, webhookSecret: string): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts["t"];
  const signature = parts["te"] ?? parts["li"];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export const PaymentController = {
  async createCheckout(req: Request, res: Response): Promise<void> {
    const { requestId } = req.body as { requestId: string };
    try {
      const payment = await PaymentModel.createCheckout(requestId, req.user!.id);
      res.status(201).json(payment);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) { res.status(404).json({ error: "Request not found" }); return; }
      if (status === 403) { res.status(403).json({ error: "Not allowed" }); return; }
      if (status === 400) { res.status(400).json({ error: (err as Error).message }); return; }
      console.error("POST /api/payments/checkout failed:", err);
      res.status(500).json({ error: "Failed to start payment" });
    }
  },

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const payment = await PaymentModel.findByRequestId(req.params["requestId"] as string);
      if (!payment) {
        res.status(404).json({ error: "No payment for this request" });
        return;
      }
      if (req.user!.id !== payment.borrowerId && req.user!.id !== payment.listerId) {
        res.status(403).json({ error: "Not allowed" });
        return;
      }
      res.status(200).json(payment);
    } catch (err) {
      console.error("GET /api/payments/request/:requestId failed:", err);
      res.status(500).json({ error: "Failed to load payment status" });
    }
  },

  async createCash(req: Request, res: Response): Promise<void> {
    const { requestId } = req.body as { requestId: string };
    try {
      const payment = await PaymentModel.createCashPayment(requestId, req.user!.id);
      res.status(201).json(payment);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) { res.status(404).json({ error: "Request not found" }); return; }
      if (status === 403) { res.status(403).json({ error: "Not allowed" }); return; }
      if (status === 400) { res.status(400).json({ error: (err as Error).message }); return; }
      console.error("POST /api/payments/cash failed:", err);
      res.status(500).json({ error: "Failed to start cash payment" });
    }
  },

  async confirmCash(req: Request, res: Response): Promise<void> {
    try {
      const result = await PaymentModel.confirmCashPayment(req.params["id"] as string, req.user!.id);
      if (result === "not_found") { res.status(404).json({ error: "Payment not found" }); return; }
      if (result === "forbidden") { res.status(403).json({ error: "Not allowed" }); return; }
      if (result === "invalid_state") { res.status(400).json({ error: "Payment is not a pending cash payment" }); return; }

      const borrowerNotif = await NotificationModel.create(
        result.borrowerId,
        "payment_received",
        "The lister confirmed your cash payment. Your booking is confirmed.",
        result.requestId
      );
      emitToUser(result.borrowerId, "notification", borrowerNotif);

      res.status(200).json(result);
    } catch (err) {
      console.error("PATCH /api/payments/:id/confirm-cash failed:", err);
      res.status(500).json({ error: "Failed to confirm cash payment" });
    }
  },

  async webhook(req: Request, res: Response): Promise<void> {
    const webhookSecret = process.env["PAYMONGO_WEBHOOK_SECRET"] ?? "";
    const signatureHeader = req.headers["paymongo-signature"] as string | undefined;
    const rawBody = req.body as Buffer;

    const signatureValid = Boolean(signatureHeader) && verifyWebhookSignature(rawBody, signatureHeader!, webhookSecret);
    if (!signatureValid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    let event: {
      data: {
        attributes: {
          type: string;
          data: {
            id: string;
            attributes: {
              checkout_session_id?: string;
              payments?: Array<{ id: string }>;
            };
          };
        };
      };
    };
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const eventType = event.data.attributes.type;
    // For checkout_session.* events the resource IS the checkout session, so its own id is the session id.
    const resource = event.data.attributes.data;
    const sessionId = resource.attributes.checkout_session_id ?? resource.id;
    // The real PayMongo payment id (pay_...) lives in the session's payments array, not on the resource id.
    const paymongoPaymentId = resource.attributes.payments?.[0]?.id ?? resource.id;

    try {
      if (eventType === "checkout_session.payment.paid" && sessionId) {
        const payment = await PaymentModel.markPaidBySessionId(sessionId, paymongoPaymentId);
        if (payment) {
          const borrowerNotif = await NotificationModel.create(
            payment.borrowerId,
            "payment_received",
            "Your payment was received. Your booking is confirmed.",
            payment.requestId
          );
          emitToUser(payment.borrowerId, "notification", borrowerNotif);
          const listerNotif = await NotificationModel.create(
            payment.listerId,
            "payment_received",
            "A borrower has paid for their booking.",
            payment.requestId
          );
          emitToUser(payment.listerId, "notification", listerNotif);
        }
      } else if (eventType === "checkout_session.payment.failed" && sessionId) {
        await PaymentModel.markFailedBySessionId(sessionId);
      }
      res.status(200).json({ received: true });
    } catch (err) {
      console.error("POST /api/payments/webhook failed:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
};
