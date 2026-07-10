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
  DialogContentText,
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
import { Archive, ArrowLeft, Pencil, Plus, Trash2, ArchiveRestore } from "lucide-react";
import { Link as RouterLink, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useArchivedItemsByOwner, useDeleteItem, useItemsByOwner, useSetItemArchived } from "../hooks/useItems";
import { useRequests, useRespondToCounter } from "../hooks/useRequests";
import { useCreateCheckout, usePaymentStatus } from "../hooks/usePayments";
import { useCreateReview } from "../hooks/useReviews";
import { ItemCard } from "../components/ItemCard";
import type { CardMenuItem } from "../components/ItemCard";
import { ItemCardSkeleton } from "../components/ItemCardSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ReportDialog } from "./DashboardPage";
import type { BorrowRequest, RequestStatus } from "../types/request";
import type { Item } from "../types/item";

const STATUS_CHIP_COLOR: Record<
  RequestStatus,
  "default" | "success" | "error" | "primary" | "warning"
> = {
  pending: "default",
  approved: "success",
  declined: "error",
  completed: "primary",
  cancelled: "default",
  return_requested: "default",
  counter_offered: "warning",
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
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "archived" ? 1 : tabParam === "requests" ? 2 : 0;

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (newValue === 1) setSearchParams({ tab: "archived" });
    else if (newValue === 2) setSearchParams({ tab: "requests" });
    else setSearchParams({});
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
        <Tab label="Archived" />
        <Tab label="My Requests" />
      </Tabs>

      {tab === 0 && (
        <ItemsGrid ownerName={currentUser.name} onDelete={setDeleteTarget} />
      )}
      {tab === 1 && (
        <ArchivedGrid ownerName={currentUser.name} onDelete={setDeleteTarget} />
      )}
      {tab === 2 && <MyRequestsTab />}

      <DeleteConfirmDialog
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </Container>
  );
}

function ItemsGrid({
  ownerName,
  onDelete,
}: {
  ownerName: string;
  onDelete: (item: Item) => void;
}) {
  const { data: items, isLoading } = useItemsByOwner(ownerName);
  const archiveMutation = useSetItemArchived();
  const snackbar = useSnackbar();
  const navigate = useNavigate();

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
      {items.map((item) => {
        const menuItems: CardMenuItem[] = [
          {
            label: "Edit",
            icon: <Pencil size={15} />,
            onClick: () => navigate(`/item/${item.id}/edit`),
          },
          {
            label: "Archive",
            icon: <Archive size={15} />,
            onClick: () =>
              archiveMutation.mutate(
                { id: item.id, archived: true },
                {
                  onSuccess: () => snackbar.success(`"${item.title}" archived.`),
                  onError: () => snackbar.error("Could not archive item. Please try again."),
                }
              ),
          },
          {
            label: "Delete",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(item),
            danger: true,
          },
        ];
        return <ItemCard key={item.id} item={item} menuItems={menuItems} />;
      })}
    </Box>
  );
}

function ArchivedGrid({
  ownerName,
  onDelete,
}: {
  ownerName: string;
  onDelete: (item: Item) => void;
}) {
  const { data: items, isLoading } = useArchivedItemsByOwner(ownerName);
  const archiveMutation = useSetItemArchived();
  const snackbar = useSnackbar();

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
        title="No archived items"
        message="Items you archive will appear here. You can unarchive them at any time."
      />
    );
  }

  return (
    <Box sx={gridSx}>
      {items.map((item) => {
        const menuItems: CardMenuItem[] = [
          {
            label: "Unarchive",
            icon: <ArchiveRestore size={15} />,
            onClick: () =>
              archiveMutation.mutate(
                { id: item.id, archived: false },
                {
                  onSuccess: () => snackbar.success(`"${item.title}" unarchived.`),
                  onError: () => snackbar.error("Could not unarchive item. Please try again."),
                }
              ),
          },
          {
            label: "Delete",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(item),
            danger: true,
          },
        ];
        return <ItemCard key={item.id} item={item} menuItems={menuItems} />;
      })}
    </Box>
  );
}

function DeleteConfirmDialog({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteItem();
  const snackbar = useSnackbar();
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!item) return;
    setError("");
    try {
      await deleteMutation.mutateAsync(item.id);
      onClose();
      snackbar.success(`"${item.title}" has been deleted.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={item !== null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete this item?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>"{item?.title}"</strong> will be permanently deleted. This
          cannot be undone.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={deleteMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={deleteMutation.isPending}
          onClick={() => void handleDelete()}
        >
          {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type RequestFilter = "all" | "pending" | "active" | "completed";

const FILTER_LABELS: Record<RequestFilter, string> = {
  all: "All",
  pending: "Pending",
  active: "Active",
  completed: "Completed",
};

function MyRequestsTab() {
  const { data: requests, isLoading } = useRequests("borrower");
  const snackbar = useSnackbar();
  const respondToCounter = useRespondToCounter();
  const [filter, setFilter] = useState<RequestFilter>("all");
  const [reviewedRequestIds, setReviewedRequestIds] = useState<Set<string>>(
    () => new Set()
  );
  const [reviewTarget, setReviewTarget] = useState<BorrowRequest | null>(null);
  const [reportTarget, setReportTarget] = useState<BorrowRequest | null>(null);

  const markReviewed = (requestId: string) => {
    setReviewedRequestIds((prev) => {
      const next = new Set(prev);
      next.add(requestId);
      return next;
    });
  };

  const all = requests ?? [];
  const visibleRequests = all.filter((r) => {
    if (filter === "pending") return r.status === "pending" || r.status === "counter_offered";
    if (filter === "active") return r.status === "approved" || r.status === "return_requested";
    if (filter === "completed") return r.status === "completed";
    return true;
  });

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={88} />
        ))}
      </Stack>
    );
  }

  const handleAcceptCounter = (req: BorrowRequest) =>
    respondToCounter.mutate(
      { id: req.id, action: "accept" },
      {
        onSuccess: () => snackbar.success("Counter-offer accepted. The lister will review your updated request."),
        onError: () => snackbar.error("Could not accept counter-offer. Please try again."),
      }
    );

  const handleDeclineCounter = (req: BorrowRequest) =>
    respondToCounter.mutate(
      { id: req.id, action: "decline" },
      {
        onSuccess: () => snackbar.success("Counter-offer declined."),
        onError: () => snackbar.error("Could not decline counter-offer. Please try again."),
      }
    );

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
        {(Object.keys(FILTER_LABELS) as RequestFilter[]).map((f) => (
          <Chip
            key={f}
            label={FILTER_LABELS[f]}
            onClick={() => setFilter(f)}
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "filled" : "outlined"}
            sx={{ fontWeight: filter === f ? 600 : 400 }}
          />
        ))}
      </Stack>

      {visibleRequests.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No requests yet" : `No ${FILTER_LABELS[filter].toLowerCase()} requests`}
          message={filter === "all" ? "Items you ask to borrow will appear here." : ""}
        />
      ) : (
        <Stack spacing={2}>
          {visibleRequests.map((req) => (
            <RequestHistoryRow
              key={req.id}
              req={req}
              reviewed={reviewedRequestIds.has(req.id)}
              onReview={() => setReviewTarget(req)}
              onReport={() => setReportTarget(req)}
              onAcceptCounter={() => handleAcceptCounter(req)}
              onDeclineCounter={() => handleDeclineCounter(req)}
              isCounterPending={respondToCounter.isPending}
            />
          ))}
        </Stack>
      )}

      <ReviewDialog
        request={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSuccess={(req) => {
          markReviewed(req.id);
          setReviewTarget(null);
          snackbar.success(`Thanks for reviewing "${req.itemTitle}"!`);
        }}
      />
      <ReportDialog
        request={reportTarget}
        reportedId={reportTarget?.listerId ?? null}
        reportedLabel={reportTarget ? `lister ${reportTarget.listerName}` : ""}
        onClose={() => setReportTarget(null)}
        onSuccess={() => {
          setReportTarget(null);
          snackbar.success("Report submitted. Admin will review it.");
        }}
      />
    </>
  );
}

function RequestHistoryRow({
  req,
  reviewed,
  onReview,
  onReport,
  onAcceptCounter,
  onDeclineCounter,
  isCounterPending,
}: {
  req: BorrowRequest;
  reviewed: boolean;
  onReview: () => void;
  onReport: () => void;
  onAcceptCounter: () => void;
  onDeclineCounter: () => void;
  isCounterPending: boolean;
}) {
  const isCounterOffered = req.status === "counter_offered";
  const { data: payment } = usePaymentStatus(req.status === "approved" ? req.id : undefined);
  const createCheckout = useCreateCheckout();
  const snackbar = useSnackbar();

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: isCounterOffered ? "warning.main" : "divider",
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
        {isCounterOffered && req.proposedStartDate && req.proposedEndDate && (
          <Typography variant="body2" sx={{ color: "warning.dark", fontWeight: 500 }}>
            Proposed: {formatRange(req.proposedStartDate, req.proposedEndDate)}
          </Typography>
        )}
      </Stack>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ flexShrink: 0 }}
        flexWrap="wrap"
        useFlexGap
      >
        <Chip
          label={isCounterOffered ? "Counter-offer" : req.status}
          size="small"
          color={STATUS_CHIP_COLOR[req.status]}
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
        {isCounterOffered && (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              disabled={isCounterPending}
              onClick={onAcceptCounter}
            >
              Accept dates
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={isCounterPending}
              onClick={onDeclineCounter}
            >
              Decline
            </Button>
          </Stack>
        )}
        {req.status === "approved" &&
          (payment?.status === "paid" ? (
            <Chip label="Paid" size="small" color="success" variant="filled" />
          ) : (
            <Button
              size="small"
              variant="contained"
              color="secondary"
              disabled={createCheckout.isPending}
              onClick={() =>
                createCheckout.mutate(req.id, {
                  onError: () => snackbar.error("Could not start payment. Please try again."),
                })
              }
            >
              Pay now
            </Button>
          ))}
        {req.status === "completed" &&
          (reviewed ? (
            <Chip label="Reviewed" size="small" color="primary" variant="filled" />
          ) : (
            <Button size="small" variant="outlined" onClick={onReview}>
              Leave a Review
            </Button>
          ))}
        {(req.status === "approved" || req.status === "completed") && (
          <Button size="small" variant="outlined" color="error" onClick={onReport}>
            Report
          </Button>
        )}
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
