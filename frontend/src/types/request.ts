export type RequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "cancelled"
  | "completed";

export interface BorrowRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemArea: string;
  borrowerId: string;
  borrowerName: string;
  listerId: string;
  listerName: string;
  status: RequestStatus;
  startDate: string;
  endDate: string;
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
