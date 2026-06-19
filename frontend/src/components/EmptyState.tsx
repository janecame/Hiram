import { Box, Stack, Typography } from "@mui/material";
import { PackageOpen } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  message = "Try a different category or search term.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Stack
      alignItems="center"
      spacing={1.5}
      sx={{ py: 10, color: "text.secondary", textAlign: "center" }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: "2px dashed",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PackageOpen size={32} />
      </Box>
      <Typography variant="h6" color="text.primary">
        {title}
      </Typography>
      <Typography variant="body2">{message}</Typography>
    </Stack>
  );
}
