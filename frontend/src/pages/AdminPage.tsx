import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
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
import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import {
  deleteAdminItem,
  deleteAdminUser,
  getAdminItems,
  getAdminStats,
  getAdminUsers,
  type AdminItemsParams,
  type AdminUsersParams,
} from "../api/admin";
import { CATEGORIES, CATEGORY_LABELS, STATUSES, STATUS_LABELS } from "../types/item";

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
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<AdminUsersParams["accountType"]>("all");
  const [sort, setSort] = useState<NonNullable<AdminUsersParams["sort"]>>("newest");
  const [page, setPage] = useState(1);

  const params: AdminUsersParams = { page, pageSize: PAGE_SIZE, search, accountType, sort };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleAccountType = (v: AdminUsersParams["accountType"]) => { setAccountType(v); setPage(1); };
  const handleSort = (v: NonNullable<AdminUsersParams["sort"]>) => { setSort(v); setPage(1); };

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
          value={sort}
          onChange={(e) => handleSort(e.target.value as NonNullable<AdminUsersParams["sort"]>)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="newest">Newest first</MenuItem>
          <MenuItem value="oldest">Oldest first</MenuItem>
          <MenuItem value="name_asc">Name A → Z</MenuItem>
          <MenuItem value="name_desc">Name Z → A</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {data?.total ?? "—"} users
        </Typography>
      </Box>

      {isLoading ? (
        <Box p={4} textAlign="center"><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.users.map((u) => (
              <TableRow key={u.id} hover>
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
                  <Typography variant="caption">
                    {new Date(u.createdAt).toLocaleDateString("en-PH")}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={14} />}
                    disabled={u.isAdmin || deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete user "${u.name}"?`)) deleteMutation.mutate(u.id);
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
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}

function ItemsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const params: AdminItemsParams = { page, pageSize: PAGE_SIZE, search, category, status, sort };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "items", params],
    queryFn: () => getAdminItems(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminItem,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "items"] }),
  });

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCategory = (v: string) => { setCategory(v); setPage(1); };
  const handleStatus = (v: string) => { setStatus(v); setPage(1); };
  const handleSort = (v: string) => { setSort(v); setPage(1); };

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
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {data?.total ?? "—"} items
        </Typography>
      </Box>

      {isLoading ? (
        <Box p={4} textAlign="center"><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
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
              <TableRow key={item.id} hover>
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
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={14} />}
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete item "${item.title}"?`)) deleteMutation.mutate(item.id);
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
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}
