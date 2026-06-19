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

/** "1.2 km away" */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km away`;
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
