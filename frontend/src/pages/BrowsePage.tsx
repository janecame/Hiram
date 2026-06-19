import { useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useItems } from "../hooks/useItems";
import type { SortKey } from "../api/items";
import { FilterBar, type CategoryFilter } from "../components/FilterBar";
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
  const [sort, setSort] = useState<SortKey>("nearest");
  const [search, setSearch] = useState("");

  const { data: items, isLoading } = useItems({ category, sort, search });

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
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
        resultCount={items?.length}
      />

      {isLoading ? (
        <Box sx={gridSx}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </Box>
      ) : items && items.length > 0 ? (
        <Box sx={gridSx}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </Box>
      ) : (
        <EmptyState />
      )}
    </Container>
  );
}
