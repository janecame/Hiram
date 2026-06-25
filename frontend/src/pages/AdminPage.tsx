import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Search, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  deleteAdminItem,
  deleteAdminUser,
  getAdminItems,
  getAdminStats,
  getAdminUsers,
  setUserVerification,
  type AdminItemsParams,
  type AdminUsersParams,
} from "../api/admin";
import { CATEGORIES, CATEGORY_LABELS, STATUSES, STATUS_LABELS } from "../types/item";
import {
  VERIFICATION_STATUSES,
  VERIFICATION_STATUS_LABELS,
  type User,
  type VerificationStatus,
} from "../types/user";

const VERIFICATION_CHIP_COLOR: Record<
  VerificationStatus,
  "default" | "warning" | "success" | "error"
> = {
  unsubmitted: "default",
  pending: "warning",
  verified: "success",
  rejected: "error",
};

const PAGE_SIZE = 15;

export function AdminPage() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState(0);

  if (!currentUser?.isAdmin) return <Navigate to="/" replace />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} color="primary" mb={0.5}>
        Admin Panel
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Logged in as {currentUser.email}
      </Typography>

      <StatsBar />

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="Users" />
          <Tab label="Items" />
        </Tabs>
        <Box>
          {tab === 0 && <UsersTab />}
          {tab === 1 && <ItemsTab />}
        </Box>
      </Paper>
    </Container>
  );
}

function StatsBar() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
  });

  if (isLoading) return <CircularProgress size={20} />;

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      {(
        [
          { label: "Total Users", value: data?.users },
          { label: "Total Items", value: data?.items },
          { label: "Total Requests", value: data?.requests },
        ] as { label: string; value: number | undefined }[]
      ).map(({ label, value }) => (
        <Paper
          key={label}
          variant="outlined"
          sx={{ px: 3, py: 2, flex: 1, textAlign: "center" }}
        >
          <Typography variant="h4" fontWeight={700} color="primary">
            {value ?? "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const snackbar = useSnackbar();
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<AdminUsersParams["accountType"]>("all");
  const [verificationStatus, setVerificationStatus] =
    useState<NonNullable<AdminUsersParams["verificationStatus"]>>("all");
  const [sort, setSort] = useState<NonNullable<AdminUsersParams["sort"]>>("newest");
  const [page, setPage] = useState(1);
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const params: AdminUsersParams = { page, pageSize: PAGE_SIZE, search, accountType, verificationStatus, sort };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(deleteAdminUser)),
    onSuccess: () => {
      setSelected(new Set());
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const handleSearch = (v: string) => { setSearch(v); setPage(1); setSelected(new Set()); };
  const handleAccountType = (v: AdminUsersParams["accountType"]) => { setAccountType(v); setPage(1); setSelected(new Set()); };
  const handleVerification = (v: NonNullable<AdminUsersParams["verificationStatus"]>) => { setVerificationStatus(v); setPage(1); setSelected(new Set()); };
  const handleSort = (v: NonNullable<AdminUsersParams["sort"]>) => { setSort(v); setPage(1); setSelected(new Set()); };

  const selectableUsers = data?.users.filter((u) => !u.isAdmin) ?? [];
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id));
  const someSelected = selectableUsers.some((u) => selected.has(u.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableUsers.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableUsers.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    const label = `${ids.length} user${ids.length > 1 ? "s" : ""}`;
    setConfirmState({
      title: `Delete ${label}?`,
      message: `${label} will be permanently removed. This cannot be undone.`,
      confirmLabel: `Delete ${label}`,
      onConfirm: () => {
        bulkDeleteMutation.mutate(ids, {
          onSuccess: () => {
            setConfirmState(null);
            snackbar.success(`${label} deleted.`);
          },
          onError: () => {
            setConfirmState(null);
            snackbar.error("Could not delete users. Please try again.");
          },
        });
      },
    });
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 2, p: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Select
          size="small"
          value={accountType}
          onChange={(e) => handleAccountType(e.target.value as AdminUsersParams["accountType"])}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All types</MenuItem>
          <MenuItem value="solo">Solo</MenuItem>
          <MenuItem value="business">Business</MenuItem>
        </Select>
        <Select
          size="small"
          value={verificationStatus}
          onChange={(e) => handleVerification(e.target.value as NonNullable<AdminUsersParams["verificationStatus"]>)}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="all">All ID statuses</MenuItem>
          {VERIFICATION_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{VERIFICATION_STATUS_LABELS[s]}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={sort}
          onChange={(e) => handleSort(e.target.value as NonNullable<AdminUsersParams["sort"]>)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="newest">Newest first</MenuItem>
          <MenuItem value="oldest">Oldest first</MenuItem>
          <MenuItem value="name_asc">Name A → Z</MenuItem>
          <MenuItem value="name_desc">Name Z → A</MenuItem>
        </Select>
        <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
          {selected.size > 0 && (
            <Button
              size="small"
              color="error"
              variant="contained"
              startIcon={<Trash2 size={14} />}
              disabled={bulkDeleteMutation.isPending}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selected.size})
            </Button>
          )}
          <Typography variant="body2" color="text.secondary">
            {data?.total ?? "—"} users
          </Typography>
        </Box>
      </Box>

      {isLoading ? (
        <Box p={4} textAlign="center"><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleSelectAll}
                  disabled={selectableUsers.length === 0}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>ID Verification</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.users.map((u) => (
              <TableRow
                key={u.id}
                hover
                selected={selected.has(u.id)}
                onClick={() => { if (!u.isAdmin) toggleRow(u.id); }}
                sx={{ cursor: u.isAdmin ? "default" : "pointer" }}
              >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    size="small"
                    checked={selected.has(u.id)}
                    disabled={u.isAdmin}
                    onChange={() => toggleRow(u.id)}
                  />
                </TableCell>
                <TableCell>
                  {u.name}
                  {u.isAdmin && (
                    <Chip
                      label="admin"
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 18, fontSize: 10 }}
                    />
                  )}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={u.accountType} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={VERIFICATION_STATUS_LABELS[u.verificationStatus]}
                    size="small"
                    color={VERIFICATION_CHIP_COLOR[u.verificationStatus]}
                    variant={u.verificationStatus === "unsubmitted" ? "outlined" : "filled"}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(u.createdAt).toLocaleDateString("en-PH")}
                  </Typography>
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    startIcon={<ShieldCheck size={14} />}
                    disabled={u.verificationStatus === "unsubmitted"}
                    onClick={() => setReviewUser(u)}
                    sx={{ mr: 1 }}
                  >
                    Review
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={14} />}
                    disabled={u.isAdmin || deleteMutation.isPending}
                    onClick={() => {
                      const name = u.name;
                      setConfirmState({
                        title: `Delete "${name}"?`,
                        message: "This user will be permanently removed. This cannot be undone.",
                        confirmLabel: "Delete user",
                        onConfirm: () => {
                          deleteMutation.mutate(u.id, {
                            onSuccess: () => {
                              setConfirmState(null);
                              snackbar.success(`User "${name}" deleted.`);
                            },
                            onError: () => {
                              setConfirmState(null);
                              snackbar.error("Could not delete user. Please try again.");
                            },
                          });
                        },
                      });
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ReviewIdDialog
        user={reviewUser}
        onClose={() => setReviewUser(null)}
        onVerdict={(status, userName) => {
          snackbar.success(
            status === "verified"
              ? `${userName}'s ID has been approved.`
              : `${userName}'s ID has been rejected.`
          );
        }}
      />
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        message={confirmState?.message ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />

      {(data?.totalPages ?? 1) > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <Pagination
            count={data?.totalPages ?? 1}
            page={page}
            onChange={(_, v) => { setPage(v); setSelected(new Set()); }}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}

function ReviewIdDialog({
  user,
  onClose,
  onVerdict,
}: {
  user: User | null;
  onClose: () => void;
  onVerdict?: (status: "verified" | "rejected", userName: string) => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: ({ status }: { status: "verified" | "rejected" }) =>
      setUserVerification(user!.id, status, status === "rejected" ? reason : undefined),
    onSuccess: (_, { status }) => {
      const userName = user!.name;
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      void qc.invalidateQueries({ queryKey: ["user"] });
      setReason("");
      onClose();
      onVerdict?.(status, userName);
    },
  });

  return (
    <Dialog open={Boolean(user)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Review government ID — {user?.name}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">Current status:</Typography>
            {user && (
              <Chip
                label={VERIFICATION_STATUS_LABELS[user.verificationStatus]}
                size="small"
                color={VERIFICATION_CHIP_COLOR[user.verificationStatus]}
              />
            )}
          </Stack>

          {user?.idImageUrl ? (
            <Box
              component="a"
              href={user.idImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "block" }}
            >
              <Box
                component="img"
                src={user.idImageUrl}
                alt="Submitted government ID"
                sx={{
                  width: "100%",
                  maxHeight: 360,
                  objectFit: "contain",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.default",
                }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No ID image on file.
            </Typography>
          )}

          <TextField
            label="Rejection reason (shown to the user if you reject)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />

          {mutation.error && (
            <Typography variant="body2" color="error">
              {(mutation.error as Error).message}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="outlined"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ status: "rejected" })}
        >
          Reject
        </Button>
        <Button
          color="primary"
          variant="contained"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ status: "verified" })}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ItemsTab() {
  const qc = useQueryClient();
  const snackbar = useSnackbar();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const params: AdminItemsParams = { page, pageSize: PAGE_SIZE, search, category, status, sort };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "items", params],
    queryFn: () => getAdminItems(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminItem,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "items"] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(deleteAdminItem)),
    onSuccess: () => {
      setSelected(new Set());
      void qc.invalidateQueries({ queryKey: ["admin", "items"] });
    },
  });

  const handleSearch = (v: string) => { setSearch(v); setPage(1); setSelected(new Set()); };
  const handleCategory = (v: string) => { setCategory(v); setPage(1); setSelected(new Set()); };
  const handleStatus = (v: string) => { setStatus(v); setPage(1); setSelected(new Set()); };
  const handleSort = (v: string) => { setSort(v); setPage(1); setSelected(new Set()); };

  const pageItems = data?.items ?? [];
  const allSelected = pageItems.length > 0 && pageItems.every((item) => selected.has(item.id));
  const someSelected = pageItems.some((item) => selected.has(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageItems.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageItems.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    const label = `${ids.length} item${ids.length > 1 ? "s" : ""}`;
    setConfirmState({
      title: `Delete ${label}?`,
      message: `${label} will be permanently removed. This cannot be undone.`,
      confirmLabel: `Delete ${label}`,
      onConfirm: () => {
        bulkDeleteMutation.mutate(ids, {
          onSuccess: () => {
            setConfirmState(null);
            snackbar.success(`${label} deleted.`);
          },
          onError: () => {
            setConfirmState(null);
            snackbar.error("Could not delete items. Please try again.");
          },
        });
      },
    });
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 2, p: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search title…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Select
          size="small"
          value={category}
          onChange={(e) => handleCategory(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All categories</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All statuses</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="newest">Newest first</MenuItem>
          <MenuItem value="cheapest">Price low → high</MenuItem>
        </Select>
        <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
          {selected.size > 0 && (
            <Button
              size="small"
              color="error"
              variant="contained"
              startIcon={<Trash2 size={14} />}
              disabled={bulkDeleteMutation.isPending}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selected.size})
            </Button>
          )}
          <Typography variant="body2" color="text.secondary">
            {data?.total ?? "—"} items
          </Typography>
        </Box>
      </Box>

      {isLoading ? (
        <Box p={4} textAlign="center"><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleSelectAll}
                  disabled={pageItems.length === 0}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Price / day</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((item) => (
              <TableRow
                key={item.id}
                hover
                selected={selected.has(item.id)}
                onClick={() => toggleRow(item.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    size="small"
                    checked={selected.has(item.id)}
                    onChange={() => toggleRow(item.id)}
                  />
                </TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.owner}</TableCell>
                <TableCell>
                  <Chip label={CATEGORY_LABELS[item.category]} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[item.status]}
                    size="small"
                    color={item.status === "available" ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">₱{item.pricePerDay}/day</Typography>
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={14} />}
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      const title = item.title;
                      setConfirmState({
                        title: `Delete "${title}"?`,
                        message: "This listing will be permanently removed. This cannot be undone.",
                        confirmLabel: "Delete item",
                        onConfirm: () => {
                          deleteMutation.mutate(item.id, {
                            onSuccess: () => {
                              setConfirmState(null);
                              snackbar.success(`"${title}" deleted.`);
                            },
                            onError: () => {
                              setConfirmState(null);
                              snackbar.error("Could not delete item. Please try again.");
                            },
                          });
                        },
                      });
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {(data?.totalPages ?? 1) > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <Pagination
            count={data?.totalPages ?? 1}
            page={page}
            onChange={(_, v) => { setPage(v); setSelected(new Set()); }}
            color="primary"
            size="small"
          />
        </Box>
      )}
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        message={confirmState?.message ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </Box>
  );
}
