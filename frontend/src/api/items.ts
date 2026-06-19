import { MOCK_ITEMS } from "../data/mock-items";
import type { Category, Item, NewItemInput } from "../types/item";

/**
 * ── The only file the real backend will replace ──
 *
 * Every function returns a Promise with a small artificial delay so that
 * TanStack Query behaves realistically (loading states, refetches, etc.).
 * When the real API lands, swap these bodies for fetch() calls and keep the
 * same signatures — nothing upstream (hooks/pages/components) changes.
 */

// In-memory store seeded from the mock data. `createItem` mutates this.
let store: Item[] = [...MOCK_ITEMS];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export type SortKey = "nearest" | "cheapest" | "newest";

export interface ListItemsFilters {
  category?: Category | "all";
  search?: string;
  sort?: SortKey;
}

export async function listItems(
  filters: ListItemsFilters = {},
): Promise<Item[]> {
  await delay();

  const { category = "all", search = "", sort = "nearest" } = filters;
  const query = search.trim().toLowerCase();

  let result = store.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const matchesSearch =
      query === "" ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.area.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "cheapest":
        return a.pricePerDay - b.pricePerDay;
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "nearest":
      default:
        return a.distanceKm - b.distanceKm;
    }
  });

  return result;
}

export async function getItem(id: string): Promise<Item | null> {
  await delay();
  return store.find((item) => item.id === id) ?? null;
}

export async function createItem(input: NewItemInput): Promise<Item> {
  await delay();

  const item: Item = {
    ...input,
    id: crypto.randomUUID(),
    // Faked until real geolocation exists.
    distanceKm: Math.round((Math.random() * 9 + 0.3) * 10) / 10,
    // New listings start available; rating accrues from reviews later.
    status: "available",
    createdAt: new Date().toISOString(),
  };

  // Newest first so it surfaces at the top of Browse.
  store = [item, ...store];
  return item;
}
