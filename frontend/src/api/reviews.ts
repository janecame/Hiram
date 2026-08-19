import type { NewReviewInput, Review } from "../types/review";
import { API_BASE, authFetch } from "./_base";

export async function createReview(input: NewReviewInput): Promise<Review> {
  const res = await authFetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    let message = "Failed to create review";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // ignore parse errors; fall back to default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<Review>;
}

export async function getReviewsByItem(itemId: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/api/reviews/item/${itemId}`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json() as Promise<Review[]>;
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/api/reviews/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json() as Promise<Review[]>;
}
