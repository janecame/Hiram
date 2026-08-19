import { useState, useEffect } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Container,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { MapPinOff, RefreshCw } from "lucide-react";
import { useItems, useItemSuggestions } from "../hooks/useItems";
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

  // searchInput = what's currently typed (drives suggestions)
  // debouncedInput = debounced searchInput (fed to suggestions hook)
  // committedSearch = only updates on Enter/select (drives the items query)
  const [searchInput, setSearchInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [page, setPage] = useState(1);

  const { coords: userCoords, status: locationStatus, request: requestLocation } = useUserLocation();

  useEffect(() => {
    requestLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce suggestions fetch only — main query is triggered by commit
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function resetPage() {
    setPage(1);
  }

  const { data, isLoading, isError, error, isFetching, refetch } = useItems({
    category,
    status,
    sort,
    search: committedSearch,
    page,
    userLat: userCoords?.lat,
    userLng: userCoords?.lng,
  });

  const { data: suggestions } = useItemSuggestions(debouncedInput);

  const items = data?.items;
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
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
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchCommit={(s) => { setCommittedSearch(s); resetPage(); }}
        searchSuggestions={suggestions ?? []}
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

      {isError ? (
        <Alert
          severity="error"
          variant="outlined"
          sx={{ my: 4, alignItems: "center" }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshCw size={14} />}
              disabled={isFetching}
              onClick={() => refetch()}
            >
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
          }
        >
          <AlertTitle>Couldn't load items</AlertTitle>
          {error instanceof Error
            ? error.message
            : "Something went wrong while fetching listings."}
        </Alert>
      ) : isLoading ? (
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
