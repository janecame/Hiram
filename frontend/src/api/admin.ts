import type { User } from "../types/user";
import type { Item } from "../types/item";

function getToken(): string | null {
  return localStorage.getItem("hiram_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`http://localhost:3001/api/admin${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface AdminStats {
  users: number;
  items: number;
  requests: number;
}

export interface AdminUsersResponse {
  users: User[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface AdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  accountType?: "solo" | "business" | "all";
  sort?: "newest" | "oldest" | "name_asc" | "name_desc";
}

export interface AdminItemsResponse {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminItemsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
}

export function getAdminStats(): Promise<AdminStats> {
  return adminFetch<AdminStats>("/stats");
}

export function getAdminUsers(params: AdminUsersParams = {}): Promise<AdminUsersResponse> {
  const q = new URLSearchParams();
  if (params.page)        q.set("page", String(params.page));
  if (params.pageSize)    q.set("pageSize", String(params.pageSize));
  if (params.search)      q.set("search", params.search);
  if (params.accountType) q.set("accountType", params.accountType);
  if (params.sort)        q.set("sort", params.sort);
  return adminFetch<AdminUsersResponse>(`/users?${q.toString()}`);
}

export function deleteAdminUser(id: string): Promise<{ ok: boolean }> {
  return adminFetch<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" });
}

export function getAdminItems(params: AdminItemsParams = {}): Promise<AdminItemsResponse> {
  const q = new URLSearchParams();
  if (params.page)     q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.search)   q.set("search", params.search);
  if (params.category) q.set("category", params.category);
  if (params.status)   q.set("status", params.status);
  if (params.sort)     q.set("sort", params.sort);
  return adminFetch<AdminItemsResponse>(`/items?${q.toString()}`);
}

export function deleteAdminItem(id: string): Promise<{ ok: boolean }> {
  return adminFetch<{ ok: boolean }>(`/items/${id}`, { method: "DELETE" });
}
