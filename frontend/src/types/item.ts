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
  /** Computed via PostGIS when user coords are provided; undefined otherwise */
  distanceKm?: number;
  lat?: number;
  lng?: number;
  /** PSGC province name (manual select) */
  province?: string;
  /** PSGC city / municipality name (manual select) */
  city?: string;
  /** PSGC barangay name (manual select) */
  barangay?: string;
  /** Block / lot / street / landmark — free text */
  addressDetail?: string;
  area: string;
  /** UUID of the owner user */
  ownerId: string;
  /** Owner display name */
  owner: string;
  condition: Condition;
  /** Availability state — new in Phase 1 */
  status: ItemStatus;
  /** 0–5 average rating (optional) — new in Phase 1 */
  rating?: number;
  /** Number of reviews backing the rating (optional) — new in Phase 4 */
  reviewCount?: number;
  /** Personal requirements the lister sets for borrowers (optional) */
  requirements?: string;
  /** How many identical units the lister has available — new in Phase 2 */
  quantity: number;
  /** Whether the listing is archived (hidden from browse; owner-only action) */
  archived: boolean;
  /** ISO string */
  createdAt: string;
}

/**
 * Shape accepted by createItem. Server-managed fields are derived:
 * `id`, `createdAt`, `distanceKm` are generated; `status` defaults to
 * "available", `archived` defaults to false, and `rating` accrues from reviews.
 */
export type NewItemInput = Omit<
  Item,
  "id" | "createdAt" | "distanceKm" | "status" | "rating" | "owner" | "ownerId" | "archived"
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
