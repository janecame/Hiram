export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * fetch wrapper for our own API: always sends the httpOnly session cookie
 * (credentials: "include"), and echoes the readable hiram_csrf cookie as a
 * header on mutating requests so the backend's double-submit check passes.
 */
export function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (MUTATING_METHODS.has(method)) {
    const csrf = readCookie("hiram_csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
}
