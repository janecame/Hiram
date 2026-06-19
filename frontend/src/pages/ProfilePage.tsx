import type { ReactNode } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useUserByName } from "../hooks/useUser";
import { useItemsByOwner } from "../hooks/useItems";
import { ACCOUNT_TYPE_LABELS } from "../types/user";
import { ItemCard } from "../components/ItemCard";
import { ItemCardSkeleton } from "../components/ItemCardSkeleton";
import { EmptyState } from "../components/EmptyState";

const gridSx = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    md: "repeat(3, 1fr)",
    lg: "repeat(4, 1fr)",
  },
} as const;

export function ProfilePage() {
  const { owner } = useParams<{ owner: string }>();
  const name = owner ? decodeURIComponent(owner) : undefined;

  const { data: user, isLoading: userLoading } = useUserByName(name);
  const { data: items, isLoading: itemsLoading } = useItemsByOwner(name);

  const isBusiness = user?.accountType === "business";

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

      {/* Profile header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 3 }}
      >
        <Avatar
          sx={{
            width: 72,
            height: 72,
            bgcolor: "primary.main",
            fontFamily: '"Archivo", sans-serif',
            fontSize: 28,
          }}
        >
          {(name ?? "?").charAt(0).toUpperCase()}
        </Avatar>
        <Stack spacing={0.5}>
          <Typography variant="h3" component="h1">
            {name ?? "Unknown user"}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {user && (
              <Chip
                icon={isBusiness ? <Building2 size={15} /> : <BadgeCheck size={15} />}
                label={ACCOUNT_TYPE_LABELS[user.accountType]}
                color={isBusiness ? "primary" : "default"}
                variant={isBusiness ? "filled" : "outlined"}
                size="small"
              />
            )}
            {user?.address && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                <MapPin size={14} />
                <Typography variant="caption">{user.address}</Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>

      {/* Credentials — unverified in Phase 1 */}
      {userLoading ? null : user ? (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            p: 2.5,
            mb: 4,
          }}
        >
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Credentials
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <Credential icon={<Mail size={16} />} label="Email" value={user.email} />
            <Credential icon={<Phone size={16} />} label="Phone" value={user.phone} />
            <CredentialStatus
              label="Government ID"
              submitted={user.idSubmitted}
            />
            {isBusiness && (
              <CredentialStatus
                label="Business papers"
                submitted={user.businessDocsSubmitted}
              />
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 1.5, display: "block" }}>
            Credential verification arrives in Phase 2 — submitted documents are
            not yet verified.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This lister hasn't set up a full profile yet.
          </Typography>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Items listed{name ? ` by ${name}` : ""}
      </Typography>

      {itemsLoading ? (
        <Box sx={gridSx}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </Box>
      ) : items && items.length > 0 ? (
        <Box sx={gridSx}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </Box>
      ) : (
        <EmptyState
          title="No items listed"
          message="This person hasn't listed anything for rent yet."
        />
      )}
    </Container>
  );
}

function Credential({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 110 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

function CredentialStatus({
  label,
  submitted,
}: {
  label: string;
  submitted: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: submitted ? "success.main" : "text.disabled", display: "flex" }}>
        {submitted ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 110 }}>
        {label}
      </Typography>
      <Chip
        label={submitted ? "On file" : "Not submitted"}
        size="small"
        color={submitted ? "success" : "default"}
        variant="outlined"
      />
    </Stack>
  );
}
