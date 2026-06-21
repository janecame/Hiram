import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { apiLogin, apiRegister } from "../api/auth";
import type { User } from "../types/user";

const TOKEN_KEY = "hiram_token";

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const payload = JSON.parse(atob(raw.split(".")[1] ?? "")) as {
      id: string;
      email: string;
      name: string;
      exp: number;
    };
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      accountType: "solo",
      phone: "",
      address: "",
      idSubmitted: false,
      businessDocsSubmitted: false,
      createdAt: "",
    };
  } catch {
    return null;
  }
}

interface AuthValue {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(loadStoredUser);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const openModal = useCallback(() => {
    setEmail(""); setPassword(""); setName(""); setError(""); setMode("login");
    setModalOpen(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
  }, []);

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      let resp;
      if (mode === "login") {
        resp = await apiLogin({ email, password });
      } else {
        if (!name.trim()) { setError("Name is required"); setBusy(false); return; }
        resp = await apiRegister({ name: name.trim(), email, password });
      }
      localStorage.setItem(TOKEN_KEY, resp.token);
      setCurrentUser(resp.user);
      setModalOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const value = useMemo<AuthValue>(
    () => ({
      isAuthenticated: currentUser !== null,
      currentUser,
      login: openModal,
      logout,
    }),
    [currentUser, openModal, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>
          {mode === "login" ? "Log in to Hiram" : "Create an account"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => { if (v) { setMode(v as "login" | "register"); setError(""); } }}
              size="small"
              fullWidth
            >
              <ToggleButton value="login">Log in</ToggleButton>
              <ToggleButton value="register">Sign up</ToggleButton>
            </ToggleButtonGroup>

            {mode === "register" && (
              <TextField
                label="Your name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            )}
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={mode === "login"}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { void handleSubmit(); } }}
            />

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}

            <Button
              variant="contained"
              color="secondary"
              size="large"
              disabled={busy || !email || !password}
              onClick={() => void handleSubmit()}
            >
              {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
            </Button>

            <Divider />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Seed accounts: any <code>@seed.hiram.ph</code> email with password{" "}
                <code>password123</code>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
