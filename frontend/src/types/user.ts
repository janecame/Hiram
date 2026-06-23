export type AccountType = "solo" | "business";

export interface User {
  id: string;
  name: string;
  accountType: AccountType;
  email: string;
  phone: string;
  address: string;
  /** Government ID on file (unverified in Phase 1) */
  idSubmitted: boolean;
  /** Business papers on file — business accounts only (unverified in Phase 1) */
  businessDocsSubmitted: boolean;
  isAdmin: boolean;
  /** ISO string */
  createdAt: string;
}

export const ACCOUNT_TYPES: AccountType[] = ["solo", "business"];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  solo: "Solo",
  business: "Business",
};
