import type { Payment } from "../types/payment";
import { authFetch } from "./_base";

export async function createCheckout(requestId: string): Promise<Payment> {
  const res = await authFetch("/api/payments/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to start payment");
  }
  return res.json() as Promise<Payment>;
}

export async function createCashPayment(requestId: string): Promise<Payment> {
  const res = await authFetch("/api/payments/cash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to start cash payment");
  }
  return res.json() as Promise<Payment>;
}

export async function confirmCashPayment(paymentId: string): Promise<Payment> {
  const res = await authFetch(`/api/payments/${paymentId}/confirm-cash`, { method: "PATCH" });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to confirm cash payment");
  }
  return res.json() as Promise<Payment>;
}

export async function getPaymentStatus(requestId: string): Promise<Payment | undefined> {
  const res = await authFetch(`/api/payments/request/${requestId}`);
  if (res.status === 404) return undefined;
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) throw new Error("Failed to fetch payment status");
  return res.json() as Promise<Payment>;
}
