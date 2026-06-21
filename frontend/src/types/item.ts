export type Category =
  | "tools"
  | "outdoor"
  | "events"
  | "electronics"
  | "appliances";

export type Condition = "like-new" | "good" | "fair";

export type ItemStatus = "available" | "unavailable" | "reserved";

export interface Item {
  id: string;
  title: string;
  category: Category;
  description: string;
  /** Manufacturer / brand (optional) — new in Phase 1 */
  brand?: string;
  /** PHP per day */
  pricePerDay: number;
  /** PHP per hour (optional) — new in Phase 1 */
  pricePerHour?: number;
  /** Uploaded image URL; falls back to the category icon when absent */
  imageUrl?: string;
  /** Faked for now — later computed from PostGIS */
  distanceKm: number;
  area: string;
  /** Owner display name — becomes a userId later */
  owner: string;
  condition: Condition;
  /** Availability state — new in Phase 1 */
  status: ItemStatus;
  /** 0–5 average rating (optional) — new in Phase 1 */
  rating?: number;
  /** Personal requirements the lister sets for borrowers (optional) */
  requirements?: string;
  /** How many identical units the lister has available — new in Phase 2 */
  quantity: number;
  /** ISO string */
  createdAt: string;
}

/**
 * Shape accepted by createItem. Server-managed fields are derived:
 * `id`, `createdAt`, `distanceKm` are generated; `status` defaults to
 * "available" and `rating` accrues from reviews — neither is lister-supplied.
 */
export type NewItemInput = Omit<
  Item,
  "id" | "createdAt" | "distanceKm" | "status" | "rating" | "owner"
>;

export const CATEGORIES: Category[] = [
  "tools",
  "outdoor",
  "events",
  "electronics",
  "appliances",
];

export const CONDITIONS: Condition[] = ["like-new", "good", "fair"];

export const CATEGORY_LABELS: Record<Category, string> = {
  tools: "Tools",
  outdoor: "Outdoor",
  events: "Events",
  electronics: "Electronics",
  appliances: "Appliances",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  "like-new": "Like new",
  good: "Good",
  fair: "Fair",
};

export const STATUSES: ItemStatus[] = ["available", "unavailable", "reserved"];

export const STATUS_LABELS: Record<ItemStatus, string> = {
  available: "Available",
  unavailable: "Unavailable",
  reserved: "Reserved",
};
