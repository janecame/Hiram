import type { NewReportInput, Report, ReportStatus } from "../types/report";
import { API_BASE } from "./_base";

function getToken(): string | null {
  return localStorage.getItem("hiram_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createReport(input: NewReportInput): Promise<Report> {
  const res = await fetch(`${API_BASE}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("Authentication required");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to submit report");
  }
  return res.json() as Promise<Report>;
}

export async function getMyReports(): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/api/reports/mine`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch your reports");
  return res.json() as Promise<Report[]>;
}

export async function getAdminReports(status?: ReportStatus): Promise<Report[]> {
  const q = status ? `?status=${status}` : "";
  const res = await fetch(`${API_BASE}/api/reports/admin${q}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json() as Promise<Report[]>;
}

export async function setAdminReportStatus(id: string, status: ReportStatus, note: string): Promise<Report> {
  const res = await fetch(`${API_BASE}/api/reports/admin/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update report status");
  }
  return res.json() as Promise<Report>;
}
