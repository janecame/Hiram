export type AccountType = "solo" | "business";

export type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  phone: string;
  address: string;
  idSubmitted: boolean;
  businessDocsSubmitted: boolean;
  /** Manual government-ID review state. */
  verificationStatus: VerificationStatus;
  /** Uploaded government-ID image. Only exposed to the owner and admins — stripped from public reads. */
  idImageUrl?: string;
  /** Reason shown to the user when their ID is rejected. */
  idRejectionReason?: string;
  isAdmin: boolean;
  createdAt: string;
}
