import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_USERS } from "../data/mock-users";
import type { User } from "../types/user";

/**
 * ── Phase 1 mock auth ──
 *
 * No real backend. `login()` signs in as a sample user so the borrow gate and
 * profile can be demoed; `logout()` returns to a guest. Phase 2 replaces this
 * with Supabase Auth — components depend only on the `useAuth()` shape, so the
 * swap stays contained here.
 *
 * (Imports the mock seed directly: this is the auth stub, not item UI, so it
 * sits outside the items data-flow law that keeps api/items.ts swappable.)
 */
interface AuthValue {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const value = useMemo<AuthValue>(
    () => ({
      isAuthenticated: currentUser !== null,
      currentUser,
      login: () => setCurrentUser(MOCK_USERS[0] ?? null),
      logout: () => setCurrentUser(null),
    }),
    [currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
