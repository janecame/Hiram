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
  /** UUID of the owner user */
  ownerId: string;
  /** Owner display name */
  owner: string;
  condition: Condition;
  /** Availability state — new in Phase 1 */
  status: ItemStatus;
  /** 0–5 average rating (optional) — new in Phase 1 */
  rating?: number;
  /** Number of reviews backing the average rating (optional) — computed from reviews */
  reviewCount?: number;
  /** Personal requirements the lister sets for borrowers (optional) */
  requirements?: string;
  /** How many identical units the lister has available — new in Phase 2 */
  quantity: number;
  /** ISO string */
  createdAt: string;
}

/**
 * Shape accepted by POST /api/items — server assigns id, createdAt, distanceKm,
 * defaults status to "available", and leaves rating to accrue from reviews.
 */
export type NewItemInput = Omit<
  Item,
  "id" | "createdAt" | "distanceKm" | "status" | "rating" | "reviewCount" | "owner" | "ownerId"
>;

export const CATEGORIES: Category[] = [
  "tools",
  "outdoor",
  "events",
  "electronics",
  "appliances",
];

export const STATUSES: ItemStatus[] = ["available", "unavailable", "reserved"];
