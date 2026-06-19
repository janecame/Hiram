import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { formatPeso } from "../lib/format";

type DurationUnit = "hours" | "days";

interface DurationSelectorProps {
  pricePerDay: number;
  /** When absent, only the "days" option is offered. */
  pricePerHour?: number;
}

/**
 * Lets the borrower pick a duration in hours or days and shows the
 * estimated total. Hourly mode is only available when `pricePerHour` exists.
 */
export function DurationSelector({ pricePerDay, pricePerHour }: DurationSelectorProps) {
  const hourlyAvailable = typeof pricePerHour === "number";
  const [unit, setUnit] = useState<DurationUnit>(hourlyAvailable ? "hours" : "days");
  const [quantity, setQuantity] = useState(1);

  const rate = unit === "hours" && hourlyAvailable ? pricePerHour! : pricePerDay;
  const total = useMemo(
    () => rate * (Number.isFinite(quantity) && quantity > 0 ? quantity : 0),
    [rate, quantity]
  );

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        Choose duration
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        {hourlyAvailable && (
          <ToggleButtonGroup
            value={unit}
            exclusive
            size="small"
            color="primary"
            onChange={(_, next: DurationUnit | null) => {
              if (next) {
                setUnit(next);
                setQuantity(1);
              }
            }}
          >
            <ToggleButton value="hours">Hours</ToggleButton>
            <ToggleButton value="days">Days</ToggleButton>
          </ToggleButtonGroup>
        )}

        <TextField
          type="number"
          size="small"
          label={unit === "hours" ? "Number of hours" : "Number of days"}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          inputProps={{ min: 1, step: 1 }}
          sx={{ width: 160 }}
        />
      </Stack>

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
            {formatPeso(rate)} / {unit === "hours" ? "hour" : "day"} × {quantity}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Est. total
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "secondary.main", fontFamily: '"JetBrains Mono", monospace' }}
            >
              {formatPeso(total)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {!hourlyAvailable && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          This item is rented by the day only.
        </Typography>
      )}
    </Stack>
  );
}
