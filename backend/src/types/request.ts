export type RequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed' | 'return_requested' | 'counter_offered';

export type VerificationStatus = 'unsubmitted' | 'pending' | 'verified' | 'rejected';

export interface BorrowRequest {
  id: string;
  itemId: string;
  itemTitle: string;       // joined from items
  itemArea: string;        // joined from items
  borrowerId: string;
  borrowerName: string;    // joined from users
  borrowerVerificationStatus: VerificationStatus; // joined from users
  listerId: string;
  listerName: string;      // joined from users
  status: RequestStatus;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  proposedStartDate?: string; // YYYY-MM-DD — set when status is counter_offered
  proposedEndDate?: string;   // YYYY-MM-DD
  useHours: boolean;
  message?: string;
  createdAt: string;       // ISO string
}

export interface NewRequestInput {
  itemId: string;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  useHours: boolean;
  message?: string;
}
