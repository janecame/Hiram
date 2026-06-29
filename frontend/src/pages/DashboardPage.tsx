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
  Divider,
  MenuItem,
  Rating,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "../context/SnackbarContext";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCounterOffer, useRequests, useUpdateRequestStatus } from "../hooks/useRequests";
import { useCreateReview, useReviewsByUser } from "../hooks/useReviews";
import { useCreateReport, useMyReports } from "../hooks/useReports";
import type { BorrowRequest } from "../types/request";
import { REPORT_REASONS, REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from "../types/report";
import { EmptyState } from "../components/EmptyState";

function formatRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    if (iso.includes("T")) {
      opts.hour = "numeric";
      opts.minute = "2-digit";
    }
    return d.toLocaleString("en-PH", opts);
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { data: requests, isLoading } = useRequests("lister");
  const updateStatus = useUpdateRequestStatus();
  const snackbar = useSnackbar();
  const [tab, setTab] = useState(0);
  const [ratedRequestIds, setRatedRequestIds] = useState<Set<string>>(() => new Set());
  const [reviewTarget, setReviewTarget] = useState<BorrowRequest | null>(null);
  const [counterTarget, setCounterTarget] = useState<BorrowRequest | null>(null);
  const [reportTarget, setReportTarget] = useState<BorrowRequest | null>(null);
  const { data: myReports, isLoading: myReportsLoading } = useMyReports();

  const markRated = (requestId: string) => {
    setRatedRequestIds((prev) => {
      const next = new Set(prev);
      next.add(requestId);
      return next;
    });
  };

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const counterOffered = (requests ?? []).filter((r) => r.status === "counter_offered");
  const active = (requests ?? []).filter((r) => r.status === "approved" || r.status === "return_requested");
  const completed = (requests ?? []).filter((r) => r.status === "completed");

  const pendingCount = pending.length + counterOffered.length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Manage borrow requests and active rentals for your listings.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab
          label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <span>Pending Rentals</span>
              {pendingCount > 0 && (
                <Chip label={pendingCount} size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />
              )}
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <span>Active Rentals</span>
              {active.length > 0 && (
                <Chip label={active.length} size="small" color="success" sx={{ height: 18, fontSize: 11 }} />
              )}
            </Stack>
          }
        />
        <Tab label="Completed" />
        <Tab label="My Reports" />
      </Tabs>

      {/* ── Tab 0: Pending ─────────────────────────────────────── */}
      {tab === 0 && (
        <>
          {isLoading ? (
            <LoadingRows />
          ) : pending.length === 0 && counterOffered.length === 0 ? (
            <EmptyState
              title="No pending requests"
              message="When someone asks to borrow one of your items, it shows up here."
            />
          ) : (
            <Stack spacing={3}>
              {pending.length > 0 && (
                <Stack spacing={2}>
                  {pending.map((req) => (
                    <RequestRow key={req.id}>
                      <RequestDetails req={req} showMessage showBorrowerRating />
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexShrink: 0 }}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate(
                              { id: req.id, status: "approved" },
                              {
                                onSuccess: () => snackbar.success("Request approved."),
                                onError: () => snackbar.error("Could not approve request. Please try again."),
                              }
                            )
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={updateStatus.isPending}
                          onClick={() => setCounterTarget(req)}
                        >
                          Propose new dates
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate(
                              { id: req.id, status: "declined" },
                              {
                                onSuccess: () => snackbar.success("Request declined."),
                                onError: () => snackbar.error("Could not decline request. Please try again."),
                              }
                            )
                          }
                        >
                          Decline
                        </Button>
                      </Stack>
                    </RequestRow>
                  ))}
                </Stack>
              )}

              {counterOffered.length > 0 && (
                <>
                  {pending.length > 0 && <Divider />}
                  <Typography variant="overline" sx={{ color: "text.secondary" }}>
                    Counter-Offers Sent
                  </Typography>
                  <Stack spacing={2}>
                    {counterOffered.map((req) => (
                      <RequestRow key={req.id}>
                        <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                          <RequestDetails req={req} />
                          {req.proposedStartDate && req.proposedEndDate && (
                            <Typography variant="body2" sx={{ color: "warning.dark", fontWeight: 500 }}>
                              Proposed: {formatRange(req.proposedStartDate, req.proposedEndDate)}
                            </Typography>
                          )}
                        </Stack>
                        <Stack sx={{ flexShrink: 0 }} justifyContent="center">
                          <Chip label="Waiting for borrower" size="small" variant="outlined" color="primary" />
                        </Stack>
                      </RequestRow>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </>
      )}

      {/* ── Tab 1: Active ──────────────────────────────────────── */}
      {tab === 1 && (
        <>
          {isLoading ? (
            <LoadingRows />
          ) : active.length === 0 ? (
            <EmptyState
              title="No active rentals"
              message="Approved requests appear here until the item is returned."
            />
          ) : (
            <Stack spacing={2}>
              {active.map((req) => (
                <RequestRow key={req.id}>
                  <RequestDetails req={req} />
                  <Stack sx={{ flexShrink: 0 }} justifyContent="center" spacing={1}>
                    {req.status === "return_requested" && (
                      <Chip label="Return requested" size="small" color="warning" variant="filled" />
                    )}
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate(
                          { id: req.id, status: "completed" },
                          {
                            onSuccess: () => snackbar.success("Rental marked as returned."),
                            onError: () => snackbar.error("Could not update rental. Please try again."),
                          }
                        )
                      }
                    >
                      Mark as Returned
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setReportTarget(req)}
                    >
                      Report
                    </Button>
                  </Stack>
                </RequestRow>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* ── Tab 2: Completed ───────────────────────────────────── */}
      {tab === 2 && (
        <>
          {isLoading ? (
            <LoadingRows />
          ) : completed.length === 0 ? (
            <EmptyState
              title="No completed rentals yet"
              message="Rentals you mark as returned will appear here."
            />
          ) : (
            <Stack spacing={2}>
              {completed.map((req) => (
                <RequestRow key={req.id}>
                  <RequestDetails req={req} />
                  <Stack sx={{ flexShrink: 0 }} justifyContent="center" spacing={1}>
                    {ratedRequestIds.has(req.id) ? (
                      <Chip label="Rated" size="small" color="primary" variant="filled" />
                    ) : (
                      <Button variant="outlined" size="small" onClick={() => setReviewTarget(req)}>
                        Rate Borrower
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setReportTarget(req)}
                    >
                      Report
                    </Button>
                  </Stack>
                </RequestRow>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* ── Tab 3: My Reports ─────────────────────────────────── */}
      {tab === 3 && (
        <>
          {myReportsLoading ? (
            <LoadingRows />
          ) : !myReports || myReports.length === 0 ? (
            <EmptyState
              title="No reports filed"
              message="Reports you file on rentals will appear here with their status."
            />
          ) : (
            <Stack spacing={2}>
              {myReports.map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    p: 2.5,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                  }}
                >
                  <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ lineHeight: 1.2 }}>
                      {r.itemTitle}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Reported: {r.reportedName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Reason: {REPORT_REASON_LABELS[r.reason]}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      "{r.description}"
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      {new Date(r.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                    </Typography>
                  </Stack>
                  <Box sx={{ flexShrink: 0 }}>
                    <Chip
                      label={REPORT_STATUS_LABELS[r.status]}
                      size="small"
                      color={r.status === "open" ? "warning" : r.status === "resolved" ? "success" : "default"}
                      variant="filled"
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </>
      )}

      <RateBorrowerDialog
        request={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSuccess={(req) => {
          markRated(req.id);
          setReviewTarget(null);
          snackbar.success(`You rated ${req.borrowerName} for "${req.itemTitle}".`);
        }}
      />
      <CounterOfferDialog
        request={counterTarget}
        onClose={() => setCounterTarget(null)}
        onSuccess={() => {
          setCounterTarget(null);
          snackbar.success("Counter-offer sent to borrower.");
        }}
      />
      <ReportDialog
        request={reportTarget}
        reportedId={reportTarget?.borrowerId ?? null}
        reportedLabel={reportTarget ? `borrower ${reportTarget.borrowerName}` : ""}
        onClose={() => setReportTarget(null)}
        onSuccess={() => {
          setReportTarget(null);
          snackbar.success("Report submitted. Admin will review it.");
        }}
      />
    </Container>
  );
}

function RequestRow({ children }: { children: React.ReactNode }) {
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
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
      }}
    >
      {children}
    </Box>
  );
}

function BorrowerRatingBadge({ borrowerId }: { borrowerId: string }) {
  const { data: reviews } = useReviewsByUser(borrowerId);
  const listerReviews = (reviews ?? []).filter((r) => r.reviewType === "lister_to_borrower");

  if (listerReviews.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        No ratings yet
      </Typography>
    );
  }

  const avg = listerReviews.reduce((sum, r) => sum + r.rating, 0) / listerReviews.length;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Rating value={avg} readOnly size="small" precision={0.5} />
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {avg.toFixed(1)} ({listerReviews.length})
      </Typography>
    </Stack>
  );
}

function RequestDetails({
  req,
  showMessage = false,
  showBorrowerRating = false,
}: {
  req: BorrowRequest;
  showMessage?: boolean;
  showBorrowerRating?: boolean;
}) {
  return (
    <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="h6" component="h3" sx={{ lineHeight: 1.2 }}>
        {req.itemTitle}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Borrower: {req.borrowerName}
          </Typography>
          {req.borrowerVerificationStatus === "verified" && (
            <Chip label="Verified" size="small" color="primary" variant="filled" sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
          )}
        </Stack>
        {showBorrowerRating && <BorrowerRatingBadge borrowerId={req.borrowerId} />}
      </Stack>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {formatRange(req.startDate, req.endDate)}
        </Typography>
        <Chip label={req.useHours ? "Hourly" : "Daily"} size="small" variant="outlined" />
      </Stack>
      {showMessage && req.message && (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          "{req.message}"
        </Typography>
      )}
    </Stack>
  );
}

function LoadingRows() {
  return (
    <Stack spacing={2}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={96} />
      ))}
    </Stack>
  );
}

function CounterOfferDialog({
  request,
  onClose,
  onSuccess,
}: {
  request: BorrowRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const counterOffer = useCounterOffer();
  const [proposedStart, setProposedStart] = useState("");
  const [proposedEnd, setProposedEnd] = useState("");
  const [error, setError] = useState("");

  const open = request !== null;

  useEffect(() => {
    if (open) {
      setProposedStart(request?.startDate ?? "");
      setProposedEnd(request?.endDate ?? "");
      setError("");
    }
  }, [open, request?.id]);

  const handleSubmit = async () => {
    if (!request || !proposedStart || !proposedEnd) return;
    if (proposedEnd < proposedStart) {
      setError("End date must be on or after start date.");
      return;
    }
    setError("");
    try {
      await counterOffer.mutateAsync({
        id: request.id,
        proposedStartDate: proposedStart,
        proposedEndDate: proposedEnd,
      });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Propose new dates</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {request && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Suggest alternative dates to {request.borrowerName} for "{request.itemTitle}".
              They will be notified and can accept or decline.
            </Typography>
          )}
          <TextField
            label="Proposed start date"
            type="date"
            fullWidth
            value={proposedStart}
            onChange={(e) => setProposedStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Proposed end date"
            type="date"
            fullWidth
            value={proposedEnd}
            onChange={(e) => setProposedEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={counterOffer.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={!proposedStart || !proposedEnd || counterOffer.isPending}
          onClick={() => void handleSubmit()}
        >
          {counterOffer.isPending ? "Sending…" : "Send counter-offer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReportDialog({
  request,
  reportedId,
  reportedLabel,
  onClose,
  onSuccess,
}: {
  request: BorrowRequest | null;
  reportedId: string | null;
  reportedLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createReport = useCreateReport();
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const open = request !== null && reportedId !== null;

  useEffect(() => {
    if (open) {
      setReason("");
      setDescription("");
      setError("");
    }
  }, [open, request?.id]);

  const handleSubmit = async () => {
    if (!request || !reportedId || !reason || !description.trim()) return;
    setError("");
    try {
      await createReport.mutateAsync({
        requestId: request.id,
        reportedId,
        reason: reason as import("../types/report").ReportReason,
        description: description.trim(),
      });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Report {reportedLabel}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {request && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Report an issue with the rental of "{request.itemTitle}". Admin will review your report.
            </Typography>
          )}
          <TextField
            select
            label="Reason"
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            size="small"
          >
            {REPORT_REASONS.map((r) => (
              <MenuItem key={r} value={r}>{REPORT_REASON_LABELS[r]}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            multiline
            minRows={3}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened…"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={createReport.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!reason || !description.trim() || createReport.isPending}
          onClick={() => void handleSubmit()}
        >
          {createReport.isPending ? "Submitting…" : "Submit report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RateBorrowerDialog({
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
      <DialogTitle>Rate this borrower</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {request && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              How was {request.borrowerName} as a borrower for "{request.itemTitle}"?
            </Typography>
          )}
          <Box>
            <Rating value={rating} onChange={(_, v) => setRating(v)} size="large" />
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
          {createReview.isPending ? "Submitting…" : "Submit rating"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
