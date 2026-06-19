import { Box, Card, CardActionArea, Chip, Stack, Typography } from "@mui/material";
import { MapPin } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import type { Item } from "../types/item";
import { CATEGORY_LABELS } from "../types/item";
import { formatDistance, formatPeso } from "../lib/format";
import { CategoryBlock } from "./CategoryBlock";

export function ItemCard({ item }: { item: Item }) {
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
          <CategoryBlock category={item.category} />
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
        </Box>

        <Stack spacing={1} sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            {item.title}
          </Typography>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ color: "text.secondary" }}
          >
            <MapPin size={14} />
            <Typography variant="caption">
              {item.area} · {formatDistance(item.distanceKm)}
            </Typography>
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
    </Card>
  );
}
