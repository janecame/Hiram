import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, ClipboardList, User } from "lucide-react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useItem } from "../hooks/useItem";
import { useAuth } from "../auth/AuthContext";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  STATUS_LABELS,
} from "../types/item";
import { formatDistance, formatPeso } from "../lib/format";
import { CategoryBlock } from "../components/CategoryBlock";
import { StampBadge } from "../components/StampBadge";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { DurationSelector } from "../components/DurationSelector";
import { ReviewsSection } from "../components/ReviewsSection";
import { ChatPanel } from "../components/ChatPanel";

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const { isAuthenticated, login } = useAuth();
  const [requested, setRequested] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const isAvailable = item?.status === "available";

  function handleRequest() {
    // Phase 1: borrowing requires an account. Guests get a register/log-in prompt.
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    setRequested(true);
  }

  // Mock register/log-in from the gate dialog: sign in, then complete the request.
  function handleAuthAndRequest() {
    login();
    setAuthPromptOpen(false);
    setRequested(true);
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

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress color="primary" />
        </Stack>
      ) : !item ? (
        <EmptyState
          title="Item not found"
          message="This listing may have been removed."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
            alignItems: "start",
          }}
        >
          <Box
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              position: { md: "sticky" },
              top: { md: 88 },
            }}
          >
            <CategoryBlock category={item.category} height={360} iconSize={96} />
          </Box>

          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={CATEGORY_LABELS[item.category]}
                variant="outlined"
                color="primary"
              />
              <Chip
                label={CONDITION_LABELS[item.condition]}
                variant="outlined"
              />
              <StatusBadge status={item.status} />
            </Stack>

            <Typography variant="h3" component="h1">
              {item.title}
            </Typography>

            {item.brand && (
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                {item.brand}
              </Typography>
            )}

            <Stack direction="row" spacing={2} sx={{ my: 1 }}>
              <StampBadge
                label="Per day"
                value={formatPeso(item.pricePerDay)}
                color="#C94A2A"
              />
              <StampBadge
                label="Distance"
                value={`${item.distanceKm.toFixed(1)}km`}
                color="#1C4A3A"
              />
            </Stack>

            {typeof item.pricePerHour === "number" && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Also available hourly at{" "}
                <Box
                  component="span"
                  sx={{
                    color: "secondary.main",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {formatPeso(item.pricePerHour)}
                </Box>{" "}
                / hour
              </Typography>
            )}

            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
              {item.description}
            </Typography>

            <Divider />

            <Stack spacing={1}>
              <Row label="Area" value={`${item.area} · ${formatDistance(item.distanceKm)}`} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <User size={16} />
                <Typography variant="body2" color="text.secondary">
                  Listed by{" "}
                  {/* TODO: wire to ProfilePage (Round 3) */}
                  <Link
                    component={RouterLink}
                    to={`/profile/${encodeURIComponent(item.owner)}`}
                    color="primary"
                    fontWeight={600}
                  >
                    {item.owner}
                  </Link>
                </Typography>
              </Stack>
            </Stack>

            {item.requirements && (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ClipboardList size={18} />
                    <Typography variant="h6" component="h2">
                      Requirements to borrow
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", lineHeight: 1.7, whiteSpace: "pre-line" }}
                  >
                    {item.requirements}
                  </Typography>
                </Stack>
              </>
            )}

            <Divider />

            <DurationSelector
              pricePerDay={item.pricePerDay}
              pricePerHour={item.pricePerHour}
            />

            <Divider />

            {requested ? (
              <Alert severity="success" variant="outlined">
                Request sent! {item.owner} will be notified. (This is a demo —
                no real message was sent.)
              </Alert>
            ) : (
              <Stack spacing={1} alignItems="flex-start">
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleRequest}
                  disabled={!isAvailable}
                >
                  Request to Borrow
                </Button>
                {!isAvailable && (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    This item is {STATUS_LABELS[item.status].toLowerCase()} and
                    cannot be requested right now.
                  </Typography>
                )}
              </Stack>
            )}

            <Divider />

            <ChatPanel owner={item.owner} />

            <Divider />

            <ReviewsSection rating={item.rating} />
          </Stack>
        </Box>
      )}

      {/* Phase 1 mock auth prompt — guests must register/log in to borrow. */}
      <Dialog open={authPromptOpen} onClose={() => setAuthPromptOpen(false)}>
        <DialogTitle>Account required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You need an account to request an item. Please register or log in to
            continue. (Authentication is mocked in Phase 1.)
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthPromptOpen(false)} color="primary">
            Maybe later
          </Button>
          {/* Phase 1 mock: logs in as a sample user (Phase 2 = real auth). */}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleAuthAndRequest}
          >
            Register / Log in
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 64 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}
