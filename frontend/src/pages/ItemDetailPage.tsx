import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, User } from "lucide-react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useItem } from "../hooks/useItem";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from "../types/item";
import { formatDistance, formatPeso } from "../lib/format";
import { CategoryBlock } from "../components/CategoryBlock";
import { StampBadge } from "../components/StampBadge";
import { EmptyState } from "../components/EmptyState";

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const [requested, setRequested] = useState(false);

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
            </Stack>

            <Typography variant="h3" component="h1">
              {item.title}
            </Typography>

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

            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
              {item.description}
            </Typography>

            <Divider />

            <Stack spacing={1}>
              <Row label="Area" value={`${item.area} · ${formatDistance(item.distanceKm)}`} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <User size={16} />
                <Typography variant="body2" color="text.secondary">
                  Listed by <strong>{item.owner}</strong>
                </Typography>
              </Stack>
            </Stack>

            <Divider />

            {requested ? (
              <Alert severity="success" variant="outlined">
                Request sent! {item.owner} will be notified. (This is a demo —
                no real message was sent.)
              </Alert>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => setRequested(true)}
                sx={{ alignSelf: "flex-start" }}
              >
                Request to Borrow
              </Button>
            )}
          </Stack>
        </Box>
      )}
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
