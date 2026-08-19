import type { User } from "../types/user";
import { API_BASE, authFetch } from "./_base";

export async function getUserByName(name: string): Promise<User | null> {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json() as Promise<User>;
}

export async function searchUsers(q: string): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json() as Promise<User[]>;
}

export async function getUser(_id: string): Promise<User | null> {
  const res = await authFetch(`/api/auth/me`);
  if (!res.ok) return null;
  return res.json() as Promise<User>;
}

/** Fetches the currently authenticated user (includes termsAcceptedAt). */
export async function getCurrentUser(): Promise<User | null> {
  const res = await authFetch(`/api/auth/me`);
  if (!res.ok) return null;
  return res.json() as Promise<User>;
}

/** Records that the logged-in user accepted the current Terms and Conditions. */
export async function acceptTerms(): Promise<User> {
  const res = await authFetch(`/api/users/me/accept-terms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to record terms acceptance");
  }
  return res.json() as Promise<User>;
}

export async function submitIdImage(imageUrl: string): Promise<User> {
  const res = await authFetch(`/api/users/me/id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to submit ID");
  }
  return res.json() as Promise<User>;
}

export async function updateCurrentUser(
  data: Partial<Pick<User,
    | "name" | "email" | "phone" | "address" | "accountType"
    | "defaultProvince" | "defaultCity" | "defaultBarangay"
    | "defaultProvinceCode" | "defaultCityCode" | "defaultBarangayCode"
    | "defaultAddressDetail" | "defaultMeetup" | "defaultLat" | "defaultLng"
  >>
): Promise<User> {
  const res = await authFetch(`/api/users/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to update profile");
  }
  return res.json() as Promise<User>;
}

export async function updateAvatar(avatarUrl: string): Promise<User> {
  const res = await authFetch(`/api/users/me/avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update avatar");
  }
  return res.json() as Promise<User>;
}
