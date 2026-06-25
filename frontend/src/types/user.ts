export type AccountType = "solo" | "business";

export type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  accountType: AccountType;
  email: string;
  phone: string;
  address: string;
  /** Government ID on file */
  idSubmitted: boolean;
  /** Business papers on file — business accounts only (unverified in Phase 1) */
  businessDocsSubmitted: boolean;
  /** Manual government-ID review state */
  verificationStatus: VerificationStatus;
  /** Uploaded government-ID image — only present for the owner and admins */
  idImageUrl?: string;
  /** Reason shown when an ID submission is rejected */
  idRejectionReason?: string;
  isAdmin: boolean;
  /** ISO string */
  createdAt: string;
}

export const ACCOUNT_TYPES: AccountType[] = ["solo", "business"];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  solo: "Solo",
  business: "Business",
};

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  "unsubmitted",
  "pending",
  "verified",
  "rejected",
];

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  unsubmitted: "Not submitted",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};
