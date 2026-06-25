import { useState, useEffect } from "react";
import { Box, Chip, Container, Pagination, Stack, Typography } from "@mui/material";
import { MapPinOff } from "lucide-react";
import { useItems } from "../hooks/useItems";
import { useUserLocation } from "../hooks/useUserLocation";
import type { SortKey } from "../api/items";
import {
  FilterBar,
  type CategoryFilter,
  type StatusFilter,
} from "../components/FilterBar";
import { ItemCard } from "../components/ItemCard";
import { ItemCardSkeleton } from "../components/ItemCardSkeleton";
import { EmptyState } from "../components/EmptyState";

const gridSx = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    md: "repeat(3, 1fr)",
    lg: "repeat(4, 1fr)",
  },
} as const;

export function BrowsePage() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("nearest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { coords: userCoords, status: locationStatus, request: requestLocation } = useUserLocation();

  // Silently request location on mount, same behaviour as before.
  useEffect(() => {
    requestLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetPage() {
    setPage(1);
  }

  const { data, isLoading } = useItems({
    category,
    status,
    sort,
    search,
    page,
    userLat: userCoords?.lat,
    userLng: userCoords?.lng,
  });

  const items = data?.items;
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1">
          Borrow what you need, nearby
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Rent tools, gear, and appliances from people around you.
        </Typography>
      </Stack>

      <FilterBar
        category={category}
        onCategoryChange={(v) => { setCategory(v); resetPage(); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); resetPage(); }}
        sort={sort}
        onSortChange={(v) => { setSort(v); resetPage(); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); resetPage(); }}
        resultCount={total}
      />

      {locationStatus === "denied" && sort === "nearest" && (
        <Chip
          icon={<MapPinOff size={14} />}
          label="Enable location to sort by distance"
          size="small"
          variant="outlined"
          sx={{ mb: 2 }}
        />
      )}

      {isLoading ? (
        <Box sx={gridSx}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </Box>
      ) : items && items.length > 0 ? (
        <>
          <Box sx={gridSx}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </Box>
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </Container>
  );
}
