import { Card, Skeleton, Stack } from "@mui/material";

export function ItemCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ borderColor: "divider" }}>
      <Skeleton variant="rectangular" height={160} />
      <Stack spacing={1} sx={{ p: 2 }}>
        <Skeleton variant="text" width="80%" height={28} />
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="text" width="40%" height={28} />
      </Stack>
    </Card>
  );
}
