import type { NewReviewInput, Review } from "../types/review";

function getToken(): string | null {
  return localStorage.getItem("hiram_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createReview(input: NewReviewInput): Promise<Review> {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
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
  const res = await fetch(`/api/reviews/item/${itemId}`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json() as Promise<Review[]>;
}
