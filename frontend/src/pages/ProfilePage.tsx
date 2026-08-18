import { type ReactNode, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Rating,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Camera,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { ChatPopup } from "../components/ChatPopup";
import { PHLocationPicker, type PHLocationValue } from "../components/PHLocationPicker";
import { LocationPicker } from "../components/LocationPicker";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useUserByName, useUpdateUser, useSubmitId, useUpdateAvatar } from "../hooks/useUser";
import { useReviewsByUser } from "../hooks/useReviews";
import { validateImageFile } from "../lib/uploadValidation";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  type User,
} from "../types/user";
import type { Review } from "../types/review";
import { ItemsGrid, ArchivedGrid, DeleteConfirmDialog } from "./MyItemsPage";
import type { Item } from "../types/item";

export function ProfilePage() {
  const { owner } = useParams<{ owner: string }>();
  const name = owner ? decodeURIComponent(owner) : undefined;
  const navigate = useNavigate();
  const auth = useAuth();
  const snackbar = useSnackbar();

  const { data: user, isLoading: userLoading } = useUserByName(name);
  const updateMutation = useUpdateUser(name ?? "");
  const submitIdMutation = useSubmitId();
  const updateAvatarMutation = useUpdateAvatar();

  const [editOpen, setEditOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isBusiness = user?.accountType === "business";
  const isOwnProfile = Boolean(auth.currentUser && user && auth.currentUser.id === user.id);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { snackbar.error(err); e.target.value = ""; return; }
    updateAvatarMutation.mutate(file, {
      onSuccess: (updated) => {
        auth.updateUser(updated);
        snackbar.success("Profile photo updated.");
      },
      onError: () => snackbar.error("Could not update profile photo. Please try again."),
    });
    e.target.value = "";
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back
      </Button>

      {/* Profile header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 3 }}
      >
        {/* Avatar with upload overlay for own profile */}
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Avatar
            src={user?.avatarUrl}
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
          {isOwnProfile && (
            <>
              <Box
                onClick={() => avatarInputRef.current?.click()}
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.45)",
                  opacity: 0,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  "&:hover": { opacity: 1 },
                }}
              >
                {updateAvatarMutation.isPending ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  <Camera size={20} color="#fff" />
                )}
              </Box>
              <input
                ref={avatarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                hidden
                onChange={handleAvatarChange}
              />
            </>
          )}
        </Box>

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
            {user?.verificationStatus === "verified" && (
              <Chip
                icon={<ShieldCheck size={15} />}
                label="Verified"
                color="success"
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

        {isOwnProfile ? (
          <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
            {user && user.verificationStatus !== "verified" && (
              <Button
                variant="outlined"
                color={user.verificationStatus === "rejected" ? "error" : "primary"}
                startIcon={<ShieldCheck size={16} />}
                size="small"
                onClick={() => setVerifyOpen(true)}
              >
                {user.verificationStatus === "pending"
                  ? "Verification Pending"
                  : user.verificationStatus === "rejected"
                  ? "Re-verify ID"
                  : "Verify"}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Pencil size={16} />}
              size="small"
              onClick={() => setEditOpen(true)}
            >
              Edit Profile
            </Button>
          </Stack>
        ) : user && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<MessageCircle size={16} />}
            size="small"
            onClick={() => setChatOpen(true)}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            Message
          </Button>
        )}
      </Stack>

      {/* Credentials & Verifications */}
      {userLoading ? null : user ? (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Credentials & Verifications
          </Typography>
          <Stack spacing={0.75} sx={{ mt: 0.5 }}>
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
            {isBusiness && (
              <CredentialDoc label="Business papers" submitted={user.businessDocsSubmitted} />
            )}
          </Stack>
          {isBusiness && (
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: "block" }}>
              Business-paper verification arrives in Phase 2 — submitted documents are not yet verified.
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This lister hasn't set up a full profile yet.
          </Typography>
        </Box>
      )}

      {user && <ProfileItemsSection ownerName={user.name} readOnly={!isOwnProfile} />}

      {user && <BorrowerRatingsSection userId={user.id} />}

      {user && isOwnProfile && (
        <>
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
                  snackbar.success("Profile updated.");
                  if (updated.name !== user.name) {
                    void navigate(`/profile/${encodeURIComponent(updated.name)}`);
                  }
                },
              });
            }}
          />
          <VerifyDialog
            open={verifyOpen}
            user={user}
            error={submitIdMutation.error ? (submitIdMutation.error as Error).message : undefined}
            onClose={() => setVerifyOpen(false)}
            onUpload={(file) =>
              submitIdMutation.mutate(file, {
                onSuccess: (updated) => {
                  auth.updateUser(updated);
                  setVerifyOpen(false);
                  snackbar.success("ID submitted. We'll notify you once it's reviewed.");
                },
              })
            }
          />
        </>
      )}

      {user && !isOwnProfile && (
        <ChatPopup
          owner={user.name}
          listerId={user.id}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </Container>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function BorrowerRatingsSection({ userId }: { userId: string }) {
  const { data: allReviews, isLoading } = useReviewsByUser(userId);
  const reviews = (allReviews ?? []).filter((r: Review) => r.reviewType === "lister_to_borrower");

  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Borrower Rating
        </Typography>
        {avg !== null && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Rating
              value={avg}
              precision={0.1}
              readOnly
              size="small"
              icon={<Star size={14} fill="currentColor" />}
              emptyIcon={<Star size={14} />}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {avg.toFixed(1)} ({reviews.length})
            </Typography>
          </Stack>
        )}
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={24} color="primary" />
        </Stack>
      ) : reviews.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No borrower ratings yet.
        </Typography>
      ) : (
        <Stack spacing={2} divider={<Divider flexItem />}>
          {reviews.map((review: Review) => (
            <Stack key={review.id} direction="row" spacing={1.5} alignItems="flex-start">
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
                {review.reviewerName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle2">{review.reviewerName}</Typography>
                  <Rating
                    value={review.rating}
                    readOnly
                    size="small"
                    icon={<Star size={13} fill="currentColor" />}
                    emptyIcon={<Star size={13} />}
                  />
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatReviewDate(review.createdAt)}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  for "{review.itemTitle}"
                </Typography>
                {review.comment && (
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    {review.comment}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function ProfileItemsSection({ ownerName, readOnly }: { ownerName: string; readOnly: boolean }) {
  const [tab, setTab] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          My Items
        </Typography>
        {!readOnly && tab === 0 && (
          <Button
            component={RouterLink}
            to="/list"
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<Plus size={16} />}
          >
            List an item
          </Button>
        )}
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="My Items" />
        <Tab label="Archived" />
      </Tabs>

      {tab === 0 && (
        <ItemsGrid
          ownerName={ownerName}
          onDelete={readOnly ? undefined : setDeleteTarget}
          readOnly={readOnly}
        />
      )}
      {tab === 1 && (
        <ArchivedGrid
          ownerName={ownerName}
          onDelete={readOnly ? undefined : setDeleteTarget}
          readOnly={readOnly}
        />
      )}

      {!readOnly && (
        <DeleteConfirmDialog item={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </Box>
  );
}

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

function VerifyDialog({
  open,
  user,
  error,
  onClose,
  onUpload,
}: {
  open: boolean;
  user: User;
  error?: string;
  onClose: () => void;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const snackbar = useSnackbar();
  const status = user.verificationStatus;
  const canUpload = status === "unsubmitted" || status === "rejected";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {status === "pending" ? "Verification Pending" : status === "rejected" ? "Re-verify ID" : "Verify your identity"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {status === "pending" && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Your ID is under review by an admin. We'll notify you once it's processed.
            </Typography>
          )}
          {status === "rejected" && user.idRejectionReason && (
            <Typography variant="body2" sx={{ color: "error.main" }}>
              Rejected: {user.idRejectionReason}
            </Typography>
          )}
          {canUpload && (
            <>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                ID verification uploads are temporarily unavailable. Please check back later.
              </Typography>
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                hidden
                disabled
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const err = validateImageFile(file);
                  if (err) { snackbar.error(err); e.target.value = ""; return; }
                  onUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outlined"
                disabled
                onClick={() => inputRef.current?.click()}
                fullWidth
              >
                Uploads temporarily disabled
              </Button>
            </>
          )}
          {error && (
            <Typography variant="body2" sx={{ color: "error.main" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {status === "pending" ? "Close" : "Cancel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface EditProfileDialogProps {
  open: boolean;
  user: User;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (data: Partial<Pick<User,
    | "name" | "email" | "phone" | "address" | "accountType"
    | "defaultProvince" | "defaultCity" | "defaultBarangay"
    | "defaultProvinceCode" | "defaultCityCode" | "defaultBarangayCode"
    | "defaultAddressDetail" | "defaultLat" | "defaultLng"
  >>) => void;
}

function EditProfileDialog({ open, user, isSaving, error, onClose, onSave }: EditProfileDialogProps) {
  const [form, setForm] = useState<User>({ ...user });

  const handleChange = (field: keyof User, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = ({ province, city, barangay, provinceCode, cityCode, barangayCode }: PHLocationValue) => {
    setForm((prev) => ({
      ...prev,
      defaultProvince: province,
      defaultCity: city,
      defaultBarangay: barangay,
      defaultProvinceCode: provinceCode,
      defaultCityCode: cityCode,
      defaultBarangayCode: barangayCode,
    }));
  };

  const handleMapChange = (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, defaultLat: lat, defaultLng: lng }));
  };

  const currentDefaultArea = [user.defaultBarangay, user.defaultCity, user.defaultProvince]
    .filter(Boolean)
    .join(", ");

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

          <Divider />
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Address
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: -1.5 }}>
            This will auto-fill the location when you post a new listing.
          </Typography>
          <PHLocationPicker
            onChange={handleLocationChange}
            currentArea={currentDefaultArea || undefined}
            initialProvinceCode={user.defaultProvinceCode}
            initialCityCode={user.defaultCityCode}
            initialBarangayCode={user.defaultBarangayCode}
            initialProvinceName={user.defaultProvince}
            initialCityName={user.defaultCity}
            initialBarangayName={user.defaultBarangay}
          />
          <TextField
            label="Street / landmark (optional)"
            value={form.defaultAddressDetail ?? ""}
            onChange={(e) => handleChange("defaultAddressDetail", e.target.value)}
            fullWidth
            size="small"
          />

          <Divider />
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Default pickup location
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: -1.5 }}>
            Drop a pin where borrowers pick up. This auto-fills the map when you post a new listing.
          </Typography>
          <LocationPicker
            lat={form.defaultLat}
            lng={form.defaultLng}
            onChange={handleMapChange}
            helperText="Click on the map or drag the pin to set your default pickup spot."
          />

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
          onClick={() => onSave({
            name: form.name,
            email: form.email,
            phone: form.phone,
            // Keep the header's location chip in sync with the dynamic address.
            address: [form.defaultBarangay, form.defaultCity, form.defaultProvince]
              .filter(Boolean)
              .join(", ") || form.address,
            accountType: form.accountType,
            defaultProvince: form.defaultProvince,
            defaultCity: form.defaultCity,
            defaultBarangay: form.defaultBarangay,
            defaultProvinceCode: form.defaultProvinceCode,
            defaultCityCode: form.defaultCityCode,
            defaultBarangayCode: form.defaultBarangayCode,
            defaultAddressDetail: form.defaultAddressDetail,
            defaultLat: form.defaultLat,
            defaultLng: form.defaultLng,
          })}
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
