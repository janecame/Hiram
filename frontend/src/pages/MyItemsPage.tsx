import { Box, Button, Container, Typography } from "@mui/material";
import { ArrowLeft, Plus } from "lucide-react";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useItemsByOwner } from "../hooks/useItems";
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

export function MyItemsPage() {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back to browse
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h3" component="h1">
          My Items
        </Typography>
        <Button
          component={RouterLink}
          to="/list"
          variant="contained"
          color="secondary"
          startIcon={<Plus size={18} />}
        >
          List an item
        </Button>
      </Box>

      <ItemsGrid ownerName={currentUser.name} />
    </Container>
  );
}

function ItemsGrid({ ownerName }: { ownerName: string }) {
  const { data: items, isLoading } = useItemsByOwner(ownerName);

  if (isLoading) {
    return (
      <Box sx={gridSx}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </Box>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No items listed yet"
        message="Start listing your items and let others borrow them."
      />
    );
  }

  return (
    <Box sx={gridSx}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </Box>
  );
}
