import { type ReactNode, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useUserByName, useUpdateUser } from "../hooks/useUser";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, type User } from "../types/user";

export function ProfilePage() {
  const { owner } = useParams<{ owner: string }>();
  const name = owner ? decodeURIComponent(owner) : undefined;
  const navigate = useNavigate();
  const auth = useAuth();

  const { data: user, isLoading: userLoading } = useUserByName(name);
  const updateMutation = useUpdateUser(name ?? "");

  const [editOpen, setEditOpen] = useState(false);

  const isBusiness = user?.accountType === "business";
  const isOwnProfile = Boolean(auth.currentUser && user && auth.currentUser.id === user.id);

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
          {(user?.name ?? name ?? "?").charAt(0).toUpperCase()}
        </Avatar>

        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="h3" component="h1">
            {user?.name ?? name ?? "Unknown user"}
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

        {isOwnProfile && (
          <Button
            variant="outlined"
            startIcon={<Pencil size={16} />}
            size="small"
            onClick={() => setEditOpen(true)}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            Edit Profile
          </Button>
        )}
      </Stack>

      {/* Credentials & Verifications */}
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
            Credentials & Verifications
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <CredentialRow
              icon={<Mail size={16} />}
              label="Email"
              value={user.email}
              verified={false}
            />
            <CredentialRow
              icon={<Phone size={16} />}
              label="Phone"
              value={user.phone}
              verified={false}
            />
            <CredentialDoc label="Government ID" submitted={user.idSubmitted} />
            {isBusiness && (
              <CredentialDoc label="Business papers" submitted={user.businessDocsSubmitted} />
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 1.5, display: "block" }}>
            Verification of credentials arrives in Phase 2 — submitted documents are not yet verified.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This lister hasn't set up a full profile yet.
          </Typography>
        </Box>
      )}

      {user && isOwnProfile && (
        <EditProfileDialog
          open={editOpen}
          user={user}
          isSaving={updateMutation.isPending}
          error={updateMutation.error?.message}
          onClose={() => { setEditOpen(false); updateMutation.reset(); }}
          onSave={(data) => {
            updateMutation.mutate(data, {
              onSuccess: (updated) => {
                auth.updateUser(updated);
                setEditOpen(false);
                if (updated.name !== user.name) {
                  void navigate(`/profile/${encodeURIComponent(updated.name)}`);
                }
              },
            });
          }}
        />
      )}
    </Container>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function CredentialRow({
  icon,
  label,
  value,
  verified,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  verified: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 110 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {value}
      </Typography>
      <VerificationBadge verified={verified} />
    </Stack>
  );
}

function CredentialDoc({ label, submitted }: { label: string; submitted: boolean }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: submitted ? "warning.main" : "text.disabled", display: "flex" }}>
        {submitted ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 110 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1, color: submitted ? "text.primary" : "text.disabled" }}>
        {submitted ? "On file" : "Not submitted"}
      </Typography>
      {submitted ? (
        <VerificationBadge verified={false} />
      ) : (
        <Chip
          label="Not submitted"
          size="small"
          variant="outlined"
          sx={{ color: "text.disabled", borderColor: "divider" }}
        />
      )}
    </Stack>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <Chip
      icon={verified ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
      label={verified ? "Verified" : "Unverified"}
      size="small"
      color={verified ? "success" : "default"}
      variant={verified ? "filled" : "outlined"}
      sx={{
        color: verified ? undefined : "text.disabled",
        borderColor: verified ? undefined : "divider",
      }}
    />
  );
}

interface EditProfileDialogProps {
  open: boolean;
  user: User;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (data: Partial<Pick<User, "name" | "email" | "phone" | "address" | "accountType">>) => void;
}

function EditProfileDialog({ open, user, isSaving, error, onClose, onSave }: EditProfileDialogProps) {
  const [form, setForm] = useState<User>({ ...user });

  const handleChange = (field: keyof User, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h5" component="span">
          Edit Profile
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Address"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            fullWidth
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Account type</InputLabel>
            <Select
              label="Account type"
              value={form.accountType}
              onChange={(e) => handleChange("accountType", e.target.value)}
            >
              {ACCOUNT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {ACCOUNT_TYPE_LABELS[t]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave({ name: form.name, email: form.email, phone: form.phone, address: form.address, accountType: form.accountType })}
          variant="contained"
          color="primary"
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
