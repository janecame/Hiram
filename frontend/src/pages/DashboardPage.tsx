import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useRequests, useUpdateRequestStatus } from "../hooks/useRequests";
import type { BorrowRequest } from "../types/request";
import { EmptyState } from "../components/EmptyState";

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

export function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { data: requests, isLoading } = useRequests("lister");
  const updateStatus = useUpdateRequestStatus();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const active = (requests ?? []).filter((r) => r.status === "approved");

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
        Manage borrow requests and active rentals for your listings.
      </Typography>

      {/* Pending Requests */}
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Pending Requests
      </Typography>
      {isLoading ? (
        <LoadingRows />
      ) : pending.length === 0 ? (
        <EmptyState
          title="No pending requests"
          message="When someone asks to borrow one of your items, it shows up here."
        />
      ) : (
        <Stack spacing={2}>
          {pending.map((req) => (
            <RequestRow key={req.id}>
              <RequestDetails req={req} showMessage />
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexShrink: 0 }}
                alignItems="center"
              >
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({ id: req.id, status: "approved" })
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({ id: req.id, status: "declined" })
                  }
                >
                  Decline
                </Button>
              </Stack>
            </RequestRow>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Active Rentals */}
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Active Rentals
      </Typography>
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
              <Stack sx={{ flexShrink: 0 }} justifyContent="center">
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({ id: req.id, status: "completed" })
                  }
                >
                  Mark as Returned
                </Button>
              </Stack>
            </RequestRow>
          ))}
        </Stack>
      )}

      {updateStatus.isError && (
        <Alert severity="error" variant="outlined" sx={{ mt: 3 }}>
          Could not update the request. Please try again.
        </Alert>
      )}
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

function RequestDetails({
  req,
  showMessage = false,
}: {
  req: BorrowRequest;
  showMessage?: boolean;
}) {
  return (
    <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="h6" component="h3" sx={{ lineHeight: 1.2 }}>
        {req.itemTitle}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Borrower: {req.borrowerName}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {formatRange(req.startDate, req.endDate)}
        </Typography>
        <Chip
          label={req.useHours ? "Hourly" : "Daily"}
          size="small"
          variant="outlined"
        />
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
          “{req.message}”
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
