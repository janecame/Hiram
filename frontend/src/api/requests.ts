import type {
  BorrowRequest,
  NewRequestInput,
  RequestStatus,
} from "../types/request";
import { API_BASE } from "./_base";

function getToken(): string | null {
  return localStorage.getItem("hiram_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createRequest(
  input: NewRequestInput
): Promise<BorrowRequest> {
  const res = await fetch(`${API_BASE}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to create request");
  }
  return res.json() as Promise<BorrowRequest>;
}

export async function listRequests(
  role: "lister" | "borrower"
): Promise<BorrowRequest[]> {
  const params = new URLSearchParams({ role });
  const res = await fetch(`${API_BASE}/api/requests?${params}`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json() as Promise<BorrowRequest[]>;
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<BorrowRequest> {
  const res = await fetch(`${API_BASE}/api/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) throw new Error("Failed to update request status");
  return res.json() as Promise<BorrowRequest>;
}

export async function getBlockedDates(itemId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/items/${itemId}/blocked-dates`);
  if (!res.ok) throw new Error("Failed to fetch blocked dates");
  return res.json() as Promise<string[]>;
}

export async function counterOfferRequest(
  id: string,
  proposedStartDate: string,
  proposedEndDate: string
): Promise<BorrowRequest> {
  const res = await fetch(`${API_BASE}/api/requests/${id}/counter`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ proposedStartDate, proposedEndDate }),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to send counter-offer");
  }
  return res.json() as Promise<BorrowRequest>;
}

export async function respondToCounterOffer(
  id: string,
  action: "accept" | "decline"
): Promise<BorrowRequest> {
  const res = await fetch(`${API_BASE}/api/requests/${id}/counter-response`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action }),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to respond to counter-offer");
  }
  return res.json() as Promise<BorrowRequest>;
}
