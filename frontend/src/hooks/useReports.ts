import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReport, getAdminReports, getMyReports, setAdminReportStatus } from "../api/reports";
import type { NewReportInput, ReportStatus } from "../types/report";

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewReportInput) => createReport(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["my", "reports"] }),
  });
}

export function useMyReports() {
  return useQuery({
    queryKey: ["my", "reports"],
    queryFn: () => getMyReports(),
  });
}

export function useAdminReports(status?: ReportStatus) {
  return useQuery({
    queryKey: ["admin", "reports", status],
    queryFn: () => getAdminReports(status),
  });
}

export function useAdminSetReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ReportStatus; note: string }) =>
      setAdminReportStatus(id, status, note),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });
}
