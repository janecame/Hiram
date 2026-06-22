import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Rating,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowLeft, Plus } from "lucide-react";
import { Link as RouterLink, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useItemsByOwner } from "../hooks/useItems";
import { useRequests } from "../hooks/useRequests";
import { useCreateReview } from "../hooks/useReviews";
import { ItemCard } from "../components/ItemCard";
import { ItemCardSkeleton } from "../components/ItemCardSkeleton";
import { EmptyState } from "../components/EmptyState";
import type { BorrowRequest, RequestStatus } from "../types/request";

const STATUS_CHIP_COLOR: Record<
  RequestStatus,
  "default" | "success" | "error" | "primary"
> = {
  pending: "default",
  approved: "success",
  declined: "error",
  completed: "primary",
  cancelled: "default",
  return_requested: "default",
};

function formatRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "requests" ? 1 : 0;

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSearchParams(newValue === 1 ? { tab: "requests" } : {});
  };

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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h3" component="h1">
          My Items
        </Typography>
        {tab === 0 && (
          <Button
            component={RouterLink}
            to="/list"
            variant="contained"
            color="secondary"
            startIcon={<Plus size={18} />}
          >
            List an item
          </Button>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="My Items" />
        <Tab label="My Requests" />
      </Tabs>

      {tab === 0 && <ItemsGrid ownerName={currentUser.name} />}
      {tab === 1 && <MyRequestsTab />}
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

function MyRequestsTab() {
  const { data: requests, isLoading } = useRequests("borrower");
  const [reviewedRequestIds, setReviewedRequestIds] = useState<Set<string>>(
    () => new Set()
  );
  const [reviewTarget, setReviewTarget] = useState<BorrowRequest | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const markReviewed = (requestId: string) => {
    setReviewedRequestIds((prev) => {
      const next = new Set(prev);
      next.add(requestId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={88} />
        ))}
      </Stack>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <EmptyState
        title="No requests yet"
        message="Items you ask to borrow will appear here."
      />
    );
  }

  return (
    <Stack spacing={2}>
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}
      {requests.map((req) => (
        <RequestHistoryRow
          key={req.id}
          req={req}
          reviewed={reviewedRequestIds.has(req.id)}
          onReview={() => setReviewTarget(req)}
        />
      ))}
      <ReviewDialog
        request={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSuccess={(req) => {
          markReviewed(req.id);
          setReviewTarget(null);
          setSuccessMessage(`Thanks for reviewing "${req.itemTitle}"!`);
        }}
      />
    </Stack>
  );
}

function RequestHistoryRow({
  req,
  reviewed,
  onReview,
}: {
  req: BorrowRequest;
  reviewed: boolean;
  onReview: () => void;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
      }}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
        <Link
          component={RouterLink}
          to={`/item/${req.itemId}`}
          color="primary"
          fontWeight={600}
          variant="h6"
          underline="hover"
        >
          {req.itemTitle}
        </Link>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {formatRange(req.startDate, req.endDate)}
        </Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        <Chip
          label={req.status}
          size="small"
          color={STATUS_CHIP_COLOR[req.status]}
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
        {req.status === "completed" &&
          (reviewed ? (
            <Chip label="Reviewed" size="small" color="primary" variant="filled" />
          ) : (
            <Button size="small" variant="outlined" onClick={onReview}>
              Leave a Review
            </Button>
          ))}
      </Stack>
    </Box>
  );
}

function ReviewDialog({
  request,
  onClose,
  onSuccess,
}: {
  request: BorrowRequest | null;
  onClose: () => void;
  onSuccess: (request: BorrowRequest) => void;
}) {
  const createReview = useCreateReview();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const open = request !== null;

  useEffect(() => {
    if (open) {
      setRating(null);
      setComment("");
      setError("");
    }
  }, [open, request?.id]);

  const handleSubmit = async () => {
    if (!request || rating === null) return;
    setError("");
    try {
      await createReview.mutateAsync({
        itemId: request.itemId,
        requestId: request.id,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess(request);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Rate your experience</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {request && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              How was borrowing "{request.itemTitle}"?
            </Typography>
          )}
          <Box>
            <Rating
              value={rating}
              onChange={(_, v) => setRating(v)}
              size="large"
            />
          </Box>
          <TextField
            label="Share your experience (optional)"
            multiline
            minRows={3}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={rating === null || createReview.isPending}
          onClick={() => void handleSubmit()}
        >
          {createReview.isPending ? "Submitting…" : "Submit review"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
