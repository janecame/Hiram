import { Chip } from "@mui/material";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { ItemStatus } from "../types/item";
import { STATUS_LABELS } from "../types/item";

interface StatusBadgeProps {
  status: ItemStatus;
}

/** MUI palette colors keyed by availability status. */
const STATUS_COLOR: Record<ItemStatus, "success" | "default" | "warning"> = {
  available: "success",
  unavailable: "default",
  reserved: "warning",
};

const STATUS_ICON: Record<ItemStatus, typeof CheckCircle2> = {
  available: CheckCircle2,
  unavailable: XCircle,
  reserved: Clock,
};

/** Prominent availability indicator for the item detail page. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const Icon = STATUS_ICON[status];
  return (
    <Chip
      icon={<Icon size={16} />}
      label={STATUS_LABELS[status]}
      color={STATUS_COLOR[status]}
      variant={status === "available" ? "filled" : "outlined"}
      sx={{ fontWeight: 600, alignSelf: "flex-start" }}
    />
  );
}
