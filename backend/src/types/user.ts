export type AccountType = "solo" | "business";

export interface User {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  phone: string;
  address: string;
  idSubmitted: boolean;
  businessDocsSubmitted: boolean;
  isAdmin: boolean;
  createdAt: string;
}
