export type ReportReason =
  | "item_not_handed_over"
  | "item_damaged"
  | "no_show"
  | "abusive_behavior"
  | "other";

export type ReportStatus = "open" | "resolved" | "dismissed";

export const REPORT_REASONS: ReportReason[] = [
  "item_not_handed_over",
  "item_damaged",
  "no_show",
  "abusive_behavior",
  "other",
];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  item_not_handed_over: "Item not handed over",
  item_damaged: "Item damaged",
  no_show: "No-show",
  abusive_behavior: "Abusive behavior",
  other: "Other",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export interface Report {
  id: string;
  requestId: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  itemTitle: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: string;
}

export interface NewReportInput {
  requestId: string;
  reportedId: string;
  reason: ReportReason;
  description: string;
}
