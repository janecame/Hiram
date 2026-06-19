import { MOCK_USERS } from "../data/mock-users";
import type { User } from "../types/user";

/**
 * ── User data layer — the only file the real backend will replace ──
 *
 * Mirrors api/items.ts: async with a small artificial delay so TanStack Query
 * behaves realistically. When real auth lands (Supabase), swap these bodies for
 * fetch() calls and keep the signatures — hooks/pages/components don't change.
 *
 * Profiles are looked up by `name` because items reference their lister via the
 * `owner` display-name string (there are no userIds on items yet — Phase 2).
 */

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function getUserByName(name: string): Promise<User | null> {
  await delay();
  return MOCK_USERS.find((u) => u.name === name) ?? null;
}

export async function getUser(id: string): Promise<User | null> {
  await delay();
  return MOCK_USERS.find((u) => u.id === id) ?? null;
}
