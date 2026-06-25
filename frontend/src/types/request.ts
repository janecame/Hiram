import type { VerificationStatus } from "./user";

export type RequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "cancelled"
  | "completed"
  | "return_requested"
  | "counter_offered";

export interface BorrowRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemArea: string;
  borrowerId: string;
  borrowerName: string;
  borrowerVerificationStatus: VerificationStatus;
  listerId: string;
  listerName: string;
  status: RequestStatus;
  startDate: string;
  endDate: string;
  proposedStartDate?: string;
  proposedEndDate?: string;
  useHours: boolean;
  message?: string;
  createdAt: string;
}

export interface NewRequestInput {
  itemId: string;
  startDate: string;
  endDate: string;
  useHours: boolean;
  message?: string;
}
