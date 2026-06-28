export type AccountType = "solo" | "business";

export type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  phone: string;
  address: string;
  /** S3 URL for the user's profile avatar */
  avatarUrl?: string;
  /** Default item-listing location */
  defaultProvince?: string;
  defaultCity?: string;
  defaultBarangay?: string;
  /** Stable PSGC codes for the default location — pre-selects the picker dropdowns */
  defaultProvinceCode?: string;
  defaultCityCode?: string;
  defaultBarangayCode?: string;
  defaultAddressDetail?: string;
  /** Default meet-up/handover note for listings */
  defaultMeetup?: string;
  /** Default pickup map pin — auto-fills the listing form's location */
  defaultLat?: number;
  defaultLng?: number;
  idSubmitted: boolean;
  businessDocsSubmitted: boolean;
  /** Manual government-ID review state. */
  verificationStatus: VerificationStatus;
  /** Uploaded government-ID image. Only exposed to the owner and admins — stripped from public reads. */
  idImageUrl?: string;
  /** Reason shown to the user when their ID is rejected. */
  idRejectionReason?: string;
  isAdmin: boolean;
  /** Admin-set disable flag. Disabled users cannot log in. */
  disabled: boolean;
  disabledReason?: string;
  termsAcceptedAt?: string;
  createdAt: string;
}
