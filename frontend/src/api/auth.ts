import type { User } from "../types/user";
import { API_BASE } from "./_base";

export interface AuthResponse {
  token: string;
  user: User;
}

export async function apiRegister(data: {
  name: string;
  email: string;
  password: string;
  accountType?: "solo" | "business";
  termsAcceptedAt?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await res.json()) as AuthResponse & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Registration failed");
  return body;
}

export async function apiLogin(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await res.json()) as AuthResponse & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Login failed");
  return body;
}
