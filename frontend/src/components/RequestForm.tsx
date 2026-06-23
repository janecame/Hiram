import { useEffect, useState } from "react";
import {
  Alert,
  Box,
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
import { formatPeso } from "../lib/format";
import type { Item } from "../types/item";

interface RequestFormProps {
  item: Item;
}

export function RequestForm({ item }: RequestFormProps) {
  const { isAuthenticated, currentUser, login } = useAuth();
  const createRequest = useCreateRequest();

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [duration, setDuration] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [useHours, setUseHours] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ start?: string; end?: string; duration?: string }>({});

  const hasHourly = typeof item.pricePerHour === "number";
  const rate = useHours && hasHourly ? item.pricePerHour! : item.pricePerDay;
  const estimatedTotal = rate * (duration > 0 ? duration : 0);

  useEffect(() => {
    if (!startDate) return;
    const start = new Date(`${startDate}T${startTime || "00:00"}`);
    if (Number.isNaN(start.getTime())) return;
    const ms = useHours
      ? duration * 60 * 60 * 1000
      : duration * 24 * 60 * 60 * 1000;
    const end = new Date(start.getTime() + ms);
    setEndDate(end.toISOString().slice(0, 10));
    setEndTime(end.toTimeString().slice(0, 5));
  }, [startDate, startTime, duration, useHours]);

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
    const next: { start?: string; end?: string; duration?: string } = {};
    if (!startDate) next.start = "Start date is required";
    if (duration < 1) next.duration = `Must be at least 1 ${useHours ? "hour" : "day"}`;
    if (!endDate) next.end = "Return date is required";
    if (startDate && endDate && startTime && endTime) {
      const s = new Date(`${startDate}T${startTime}`);
      const e = new Date(`${endDate}T${endTime}`);
      if (e <= s) next.end = "Return must be after the start";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createRequest.mutate(
      {
        itemId: item.id,
        startDate: `${startDate}T${startTime}`,
        endDate: `${endDate}T${endTime}`,
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
          label="Start time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Stack>

      <TextField
        label={`Duration (${useHours ? "hours" : "days"})`}
        type="number"
        value={duration}
        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
        inputProps={{ min: 1 }}
        error={Boolean(errors.duration)}
        helperText={errors.duration}
        fullWidth
      />

      <Box
        sx={{
          borderRadius: 2,
          border: "1px dashed",
          borderColor: "divider",
          p: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatPeso(rate)} / {useHours ? "hour" : "day"} × {duration}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Est. total
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "secondary.main", fontFamily: '"JetBrains Mono", monospace' }}
            >
              {formatPeso(estimatedTotal)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Return date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.end)}
          helperText={errors.end}
          fullWidth
        />
        <TextField
          label="Return time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Stack>
      {endDate && (
        <Typography variant="caption" sx={{ color: "text.secondary", mt: -0.5 }}>
          Auto-calculated from start + duration — you can still edit these.
        </Typography>
      )}

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
