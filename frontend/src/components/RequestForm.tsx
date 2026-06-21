import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useCreateRequest } from "../hooks/useRequests";
import type { Item } from "../types/item";

interface RequestFormProps {
  item: Item;
}

export function RequestForm({ item }: RequestFormProps) {
  const { isAuthenticated, currentUser, login } = useAuth();
  const createRequest = useCreateRequest();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useHours, setUseHours] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});

  const hasHourly = typeof item.pricePerHour === "number";

  // Owner viewing their own listing has nothing to request.
  const isOwner = isAuthenticated && currentUser?.name === item.owner;
  if (isOwner) return null;

  if (!isAuthenticated) {
    return (
      <Alert
        severity="info"
        variant="outlined"
        action={
          <Button color="inherit" size="small" onClick={() => login()}>
            Sign in
          </Button>
        }
      >
        Sign in to request this item
      </Alert>
    );
  }

  function validate(): boolean {
    const next: { start?: string; end?: string } = {};
    if (!startDate) next.start = "Start date is required";
    if (!endDate) next.end = "End date is required";
    if (startDate && endDate && endDate < startDate)
      next.end = "End date must be on or after the start date";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createRequest.mutate(
      {
        itemId: item.id,
        startDate,
        endDate,
        useHours,
        message: message.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err: unknown) => {
          if (err instanceof Error && err.message === "Authentication required") {
            login();
          }
        },
      }
    );
  }

  if (submitted) {
    return (
      <Alert severity="success" variant="outlined">
        Request sent! The lister will review it.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        Request to Borrow
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.start)}
          helperText={errors.start}
          fullWidth
        />
        <TextField
          label="End date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.end)}
          helperText={errors.end}
          fullWidth
        />
      </Stack>

      <ToggleButtonGroup
        value={useHours ? "hourly" : "daily"}
        exclusive
        onChange={(_, v) => {
          if (v) setUseHours(v === "hourly");
        }}
        size="small"
      >
        <ToggleButton value="daily">Daily</ToggleButton>
        {hasHourly && <ToggleButton value="hourly">Hourly</ToggleButton>}
      </ToggleButtonGroup>

      <TextField
        label="Message"
        multiline
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Any message for the lister? (optional)"
        fullWidth
      />

      {createRequest.isError &&
        !(
          createRequest.error instanceof Error &&
          createRequest.error.message === "Authentication required"
        ) && (
          <Alert severity="error" variant="outlined">
            Could not send your request. Please try again.
          </Alert>
        )}

      <Button
        variant="contained"
        color="secondary"
        size="large"
        onClick={handleSubmit}
        disabled={createRequest.isPending}
        startIcon={
          createRequest.isPending ? (
            <CircularProgress size={18} color="inherit" />
          ) : undefined
        }
        sx={{ alignSelf: "flex-start" }}
      >
        Request to Borrow
      </Button>
    </Stack>
  );
}
