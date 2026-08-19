import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { apiLogout } from "../api/auth";
import { getCurrentUser } from "../api/users";
import type { User } from "../types/user";

interface AuthValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
  login: () => void;
  logout: () => void;
  updateUser: (u: User) => void;
  setSession: (user: User) => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // The session lives in an httpOnly cookie now, unreadable by JS — so on
  // mount we have to ask the backend who (if anyone) it belongs to.
  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) setCurrentUser(user);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const logout = useCallback(() => {
    void apiLogout();
    setCurrentUser(null);
  }, []);

  const setSession = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const updateUser = useCallback((u: User) => setCurrentUser(u), []);

  const value = useMemo<AuthValue>(
    () => ({
      isAuthenticated: currentUser !== null,
      isLoading,
      currentUser,
      login,
      logout,
      updateUser,
      setSession,
    }),
    [currentUser, isLoading, login, logout, updateUser, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
