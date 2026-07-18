import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { AuthResponse } from "../api/auth";
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
      isAdmin?: boolean;
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
      verificationStatus: "unsubmitted",
      isAdmin: payload.isAdmin ?? false,
      disabled: false,
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
  updateUser: (u: User) => void;
  setSession: (resp: AuthResponse) => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(loadStoredUser);
  const navigate = useNavigate();

  const login = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
  }, []);

  const setSession = useCallback((resp: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, resp.token);
    setCurrentUser(resp.user);
  }, []);

  const updateUser = useCallback((u: User) => setCurrentUser(u), []);

  const value = useMemo<AuthValue>(
    () => ({
      isAuthenticated: currentUser !== null,
      currentUser,
      login,
      logout,
      updateUser,
      setSession,
    }),
    [currentUser, login, logout, updateUser, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}