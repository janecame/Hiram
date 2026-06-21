import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Rating,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useUserByName } from "../hooks/useUser";
import { useRequests } from "../hooks/useRequests";
import { useCreateReview } from "../hooks/useReviews";
import { useAuth } from "../auth/AuthContext";
import { ACCOUNT_TYPE_LABELS } from "../types/user";
import type { BorrowRequest, RequestStatus } from "../types/request";
import { EmptyState } from "../components/EmptyState";

const STATUS_CHIP_COLOR: Record<
  RequestStatus,
  "default" | "success" | "error" | "primary"
> = {
  pending: "default",
  approved: "success",
  declined: "error",
  completed: "primary",
  cancelled: "default",
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

export function ProfilePage() {
  const { owner } = useParams<{ owner: string }>();
  const name = owner ? decodeURIComponent(owner) : undefined;

  const { currentUser } = useAuth();
  const isOwnProfile = Boolean(name && currentUser?.name === name);

  const { data: user, isLoading: userLoading } = useUserByName(name);

  const isBusiness = user?.accountType === "business";

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

      {/* Profile header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 3 }}
      >
        <Avatar
          sx={{
            width: 72,
            height: 72,
            bgcolor: "primary.main",
            fontFamily: '"Archivo", sans-serif',
            fontSize: 28,
          }}
        >
          {(name ?? "?").charAt(0).toUpperCase()}
        </Avatar>
        <Stack spacing={0.5}>
          <Typography variant="h3" component="h1">
            {name ?? "Unknown user"}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {user && (
              <Chip
                icon={isBusiness ? <Building2 size={15} /> : <BadgeCheck size={15} />}
                label={ACCOUNT_TYPE_LABELS[user.accountType]}
                color={isBusiness ? "primary" : "default"}
                variant={isBusiness ? "filled" : "outlined"}
                size="small"
              />
            )}
            {user?.address && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                <MapPin size={14} />
                <Typography variant="caption">{user.address}</Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>

      {/* Credentials — unverified in Phase 1 */}
      {userLoading ? null : user ? (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            p: 2.5,
            mb: 4,
          }}
        >
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Credentials
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <Credential icon={<Mail size={16} />} label="Email" value={user.email} />
            <Credential icon={<Phone size={16} />} label="Phone" value={user.phone} />
            <CredentialStatus
              label="Government ID"
              submitted={user.idSubmitted}
            />
            {isBusiness && (
              <CredentialStatus
                label="Business papers"
                submitted={user.businessDocsSubmitted}
              />
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 1.5, display: "block" }}>
            Credential verification arrives in Phase 2 — submitted documents are
            not yet verified.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This lister hasn't set up a full profile yet.
          </Typography>
        </Box>
      )}

      {isOwnProfile && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            My Requests
          </Typography>
          <MyRequestsTab />
        </>
      )}
    </Container>
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

  // Reset local state whenever a new request is opened.
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

function Credential({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 110 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

function CredentialStatus({
  label,
  submitted,
}: {
  label: string;
  submitted: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: submitted ? "success.main" : "text.disabled", display: "flex" }}>
        {submitted ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 110 }}>
        {label}
      </Typography>
      <Chip
        label={submitted ? "On file" : "Not submitted"}
        size="small"
        color={submitted ? "success" : "default"}
        variant="outlined"
      />
    </Stack>
  );
}
