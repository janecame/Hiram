import {
  Box,
  Card,
  CardActionArea,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import { MapPin, MoreVertical, Star } from "lucide-react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import type { Item, ItemStatus } from "../types/item";
import { CATEGORY_LABELS, STATUS_LABELS } from "../types/item";
import { formatDistance, formatPeso } from "../lib/format";
import { CategoryBlock } from "./CategoryBlock";

export interface CardMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

/**
 * Status → MUI Chip color (theme palette only, no hardcoded hex).
 * available = positive (success/green), reserved = highlight (warning/amber),
 * unavailable = muted (default/grey).
 */
const STATUS_CHIP_COLOR: Record<ItemStatus, ChipProps["color"]> = {
  available: "success",
  reserved: "warning",
  unavailable: "default",
};

export function ItemCard({ item, menuItems }: { item: Item; menuItems?: CardMenuItem[] }) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderColor: "divider",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 24px rgba(28,74,58,0.12)",
        },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/item/${item.id}`}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <Box sx={{ position: "relative" }}>
          {item.imageUrl ? (
            <Box
              component="img"
              src={item.imageUrl}
              alt={item.title}
              sx={{ display: "block", width: "100%", height: 160, objectFit: "cover" }}
            />
          ) : (
            <CategoryBlock category={item.category} />
          )}
          <Chip
            label={CATEGORY_LABELS[item.category]}
            size="small"
            variant="outlined"
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              bgcolor: "background.paper",
            }}
          />
          {menuItems ? (
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                top: 6,
                right: 6,
                bgcolor: "background.paper",
                zIndex: 2,
                "&:hover": { bgcolor: "background.paper" },
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
              }}
            >
              <MoreVertical size={16} />
            </IconButton>
          ) : (
            <Chip
              label={STATUS_LABELS[item.status]}
              size="small"
              color={STATUS_CHIP_COLOR[item.status]}
              variant={item.status === "unavailable" ? "outlined" : "filled"}
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                ...(item.status === "unavailable" && {
                  bgcolor: "background.paper",
                }),
              }}
            />
          )}
        </Box>

        <Stack spacing={1} sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            {item.title}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            sx={{ color: "text.secondary" }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <MapPin size={14} />
              <Typography variant="caption" noWrap>
                {item.distanceKm != null
                  ? `${item.area} · ${formatDistance(item.distanceKm)}`
                  : item.area}
              </Typography>
            </Stack>

            {item.rating !== undefined ? (
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ flexShrink: 0 }}
              >
                <Rating
                  value={item.rating}
                  precision={0.1}
                  readOnly
                  size="small"
                  icon={<Star size={14} fill="currentColor" />}
                  emptyIcon={<Star size={14} />}
                />
                {item.reviewCount !== undefined && (
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1, color: "text.secondary" }}
                  >
                    ({item.reviewCount})
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", flexShrink: 0 }}
              >
                No reviews yet
              </Typography>
            )}
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography
              variant="h6"
              color="secondary"
              sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}
            >
              {formatPeso(item.pricePerDay)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              / day
            </Typography>
          </Stack>
        </Stack>
      </CardActionArea>

      {menuItems && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 160 } } }}
        >
          {menuItems.map((mi) => (
            <MenuItem
              key={mi.label}
              onClick={() => { setMenuAnchor(null); mi.onClick(); }}
              sx={mi.danger ? { color: "error.main" } : undefined}
            >
              {mi.icon && <Box sx={{ mr: 1.25, display: "flex" }}>{mi.icon}</Box>}
              {mi.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Card>
  );
}
