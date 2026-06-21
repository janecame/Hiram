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
  createdAt: string;
}
