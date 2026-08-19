import type { NewReportInput, Report, ReportStatus } from "../types/report";
import { authFetch } from "./_base";

export async function createReport(input: NewReportInput): Promise<Report> {
  const res = await authFetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await authFetch("/api/reports/mine");
  if (!res.ok) throw new Error("Failed to fetch your reports");
  return res.json() as Promise<Report[]>;
}

export async function getAdminReports(status?: ReportStatus): Promise<Report[]> {
  const q = status ? `?status=${status}` : "";
  const res = await authFetch(`/api/reports/admin${q}`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json() as Promise<Report[]>;
}

export async function setAdminReportStatus(id: string, status: ReportStatus, note: string): Promise<Report> {
  const res = await authFetch(`/api/reports/admin/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update report status");
  }
  return res.json() as Promise<Report>;
}
