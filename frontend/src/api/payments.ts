import type { Payment } from "../types/payment";
import { API_BASE } from "./_base";

function getToken(): string | null {
  return localStorage.getItem("hiram_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createCheckout(requestId: string): Promise<Payment> {
  const res = await fetch(`${API_BASE}/api/payments/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ requestId }),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to start payment");
  }
  return res.json() as Promise<Payment>;
}

export async function getPaymentStatus(requestId: string): Promise<Payment | undefined> {
  const res = await fetch(`${API_BASE}/api/payments/request/${requestId}`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 404) return undefined;
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) throw new Error("Failed to fetch payment status");
  return res.json() as Promise<Payment>;
}
