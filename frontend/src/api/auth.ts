import type { User } from "../types/user";
import { authFetch } from "./_base";

export interface AuthResponse {
  user: User;
}

export async function apiRegister(data: {
  name: string;
  email: string;
  password: string;
  accountType?: "solo" | "business";
  termsAcceptedAt?: string;
}): Promise<AuthResponse> {
  const res = await authFetch("/api/auth/register", {
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
  const res = await authFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await res.json()) as AuthResponse & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Login failed");
  return body;
}

export async function apiLogout(): Promise<void> {
  await authFetch("/api/auth/logout", { method: "POST" });
}

export async function apiForgotPassword(email: string): Promise<{ message: string }> {
  const res = await authFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = (await res.json()) as { message?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Something went wrong");
  return { message: body.message ?? "" };
}

export async function apiResetPassword(data: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  const res = await authFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await res.json()) as { message?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Reset failed");
  return { message: body.message ?? "" };
}
