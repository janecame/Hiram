import type { User } from "../types/user";

const TOKEN_KEY = "hiram_token";

function authHeader(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getUserByName(name: string): Promise<User | null> {
  const res = await fetch(`/api/users/${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json() as Promise<User>;
}

export async function getUser(_id: string): Promise<User | null> {
  const res = await fetch("/api/auth/me", { headers: authHeader() });
  if (!res.ok) return null;
  return res.json() as Promise<User>;
}

export async function submitIdImage(imageUrl: string): Promise<User> {
  const res = await fetch("/api/users/me/id", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to submit ID");
  }
  return res.json() as Promise<User>;
}

export async function updateCurrentUser(
  data: Partial<Pick<User, "name" | "email" | "phone" | "address" | "accountType">>
): Promise<User> {
  const res = await fetch("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to update profile");
  }
  return res.json() as Promise<User>;
}
