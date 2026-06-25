import {
  Drill,
  Tent,
  PartyPopper,
  Cpu,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "../types/item";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** "₱250" */
export function formatPeso(amount: number): string {
  return peso.format(amount);
}

/** "1.2 km away" — returns empty string when distance is unknown */
export function formatDistance(km: number | undefined): string {
  if (km == null) return "";
  return `${km.toFixed(1)} km away`;
}

/** Haversine great-circle distance between two GPS points, in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Icon + tint used for the photo-less image blocks. */
export const CATEGORY_VISUALS: Record<
  Category,
  { icon: LucideIcon; tint: string }
> = {
  tools: { icon: Drill, tint: "#1C4A3A" },
  outdoor: { icon: Tent, tint: "#2F7D5B" },
  events: { icon: PartyPopper, tint: "#C94A2A" },
  electronics: { icon: Cpu, tint: "#3A5A8A" },
  appliances: { icon: WashingMachine, tint: "#E8A020" },
};
