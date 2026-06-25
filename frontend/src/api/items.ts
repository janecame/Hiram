import type { Category, Item, ItemStatus, NewItemInput } from "../types/item";
import { API_BASE } from "./_base";

export type SortKey = "nearest" | "cheapest" | "newest";

export interface ListItemsFilters {
  category?: Category | "all";
  status?: ItemStatus | "all";
  search?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  userLat?: number;
  userLng?: number;
}

export interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function getToken(): string | null {
  return localStorage.getItem("hiram_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listItems(
  filters: ListItemsFilters = {}
): Promise<PaginatedItems> {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "all")
    params.set("category", filters.category);
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.userLat != null) params.set("userLat", String(filters.userLat));
  if (filters.userLng != null) params.set("userLng", String(filters.userLng));

  const res = await fetch(`${API_BASE}/api/items?${params}`);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json() as Promise<PaginatedItems>;
}

export async function getItem(id: string): Promise<Item | null> {
  const res = await fetch(`${API_BASE}/api/items/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch item");
  return res.json() as Promise<Item>;
}

export async function getItemsByOwner(
  owner: string,
  opts?: { archived?: boolean }
): Promise<Item[]> {
  const params = new URLSearchParams({ owner, pageSize: "100" });
  if (opts?.archived === true) params.set("archived", "true");
  const res = await fetch(`${API_BASE}/api/items?${params}`);
  if (!res.ok) throw new Error("Failed to fetch items by owner");
  const data = (await res.json()) as PaginatedItems;
  return data.items;
}

export async function setItemArchived(id: string, archived: boolean): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/${id}/archive`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ archived }),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (res.status === 403) throw new Error("You do not own this item");
  if (res.status === 404) throw new Error("Item not found");
  if (!res.ok) throw new Error("Failed to update item");
  return res.json() as Promise<Item>;
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (res.status === 403) throw new Error("You do not own this item");
  if (res.status === 404) throw new Error("Item not found");
  if (!res.ok) throw new Error("Failed to delete item");
}

export async function createItem(input: NewItemInput): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) throw new Error("Failed to create item");
  return res.json() as Promise<Item>;
}

export async function updateItem(id: string, input: Partial<NewItemInput>): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("Authentication required — please log out and log back in");
  if (res.status === 403) throw new Error("You do not own this item");
  if (res.status === 404) throw new Error("Item not found");
  if (!res.ok) throw new Error("Failed to update item");
  return res.json() as Promise<Item>;
}
