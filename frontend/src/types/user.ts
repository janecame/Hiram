export type AccountType = "solo" | "business";

export type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  accountType: AccountType;
  email: string;
  phone: string;
  address: string;
  /** S3 URL for the user's profile avatar */
  avatarUrl?: string;
  /** Default item-listing location (auto-fills the listing form) */
  defaultProvince?: string;
  defaultCity?: string;
  defaultBarangay?: string;
  /** Stable PSGC codes for the default location — pre-selects the picker dropdowns */
  defaultProvinceCode?: string;
  defaultCityCode?: string;
  defaultBarangayCode?: string;
  defaultAddressDetail?: string;
  /** Default meet-up / handover note */
  defaultMeetup?: string;
  /** Default pickup map pin — auto-fills the listing form's location */
  defaultLat?: number;
  defaultLng?: number;
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
  /** Admin-set disable flag */
  disabled: boolean;
  disabledReason?: string;
  termsAcceptedAt?: string;
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
