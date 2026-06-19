import { Box, Typography } from "@mui/material";

interface StampBadgeProps {
  /** Small label, e.g. "PER DAY" or "DISTANCE" */
  label: string;
  /** Big value, e.g. "₱250" or "1.2km" */
  value: string;
  color?: string;
  size?: number;
}

/**
 * Round, dashed "stamp"-style badge — like a rental receipt or pawn ticket.
 * Hiram's signature visual element.
 */
export function StampBadge({
  label,
  value,
  color = "#1C4A3A",
  size = 84,
}: StampBadgeProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px dashed ${color}`,
        color,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        flexShrink: 0,
        backgroundColor: "rgba(255,255,255,0.55)",
        transform: "rotate(-4deg)",
      }}
    >
      <Typography
        variant="overline"
        sx={{ fontSize: 9, lineHeight: 1.2, opacity: 0.8 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700,
          fontSize: size > 70 ? 18 : 14,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
