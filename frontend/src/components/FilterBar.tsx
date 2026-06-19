import {
  Box,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Search } from "lucide-react";
import type { Category, ItemStatus } from "../types/item";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUSES,
  STATUS_LABELS,
} from "../types/item";
import type { SortKey } from "../api/items";

export type CategoryFilter = Category | "all";
export type StatusFilter = ItemStatus | "all";

interface FilterBarProps {
  category: CategoryFilter;
  onCategoryChange: (c: CategoryFilter) => void;
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  search: string;
  onSearchChange: (s: string) => void;
  resultCount?: number;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "nearest", label: "Nearest" },
  { value: "cheapest", label: "Cheapest" },
  { value: "newest", label: "Newest" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export function FilterBar({
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  resultCount,
}: FilterBarProps) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
      >
        <TextField
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items, areas…"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: { sm: 360 } }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          sx={{ minWidth: 160 }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        alignItems="center"
      >
        <Chip
          label="All"
          variant={category === "all" ? "filled" : "outlined"}
          color={category === "all" ? "primary" : "default"}
          onClick={() => onCategoryChange("all")}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={CATEGORY_LABELS[c]}
            variant={category === c ? "filled" : "outlined"}
            color={category === c ? "primary" : "default"}
            onClick={() => onCategoryChange(c)}
          />
        ))}

        <Box sx={{ flexGrow: 1 }} />
        {resultCount !== undefined && (
          <Typography variant="caption" color="text.secondary">
            {resultCount} {resultCount === 1 ? "item" : "items"}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
