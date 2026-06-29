export type ReportReason =
  | "item_not_handed_over"
  | "item_damaged"
  | "no_show"
  | "abusive_behavior"
  | "other";

export type ReportStatus = "open" | "resolved" | "dismissed";

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
