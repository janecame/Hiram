import { pool } from "../db";
import type { User } from "../types/user";

export interface NewUserInput {
  name: string;
  email: string;
  passwordHash: string;
  accountType?: "solo" | "business";
  phone?: string;
  address?: string;
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    email: row["email"] as string,
    accountType: row["account_type"] as User["accountType"],
    phone: (row["phone"] as string | null) ?? "",
    address: (row["address"] as string | null) ?? "",
    idSubmitted: row["id_submitted"] as boolean,
    businessDocsSubmitted: row["business_docs_submitted"] as boolean,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

export const UserModel = {
  async findByEmail(
    email: string
  ): Promise<(User & { passwordHash: string }) | undefined> {
    const result = await pool.query(
      `SELECT *, password_hash FROM public.users WHERE email = $1`,
      [email]
    );
    if (!result.rows[0]) return undefined;
    const row = result.rows[0] as Record<string, unknown>;
    return { ...rowToUser(row), passwordHash: row["password_hash"] as string };
  },

  async findById(id: string): Promise<User | undefined> {
    const result = await pool.query(
      `SELECT * FROM public.users WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? rowToUser(result.rows[0] as Record<string, unknown>) : undefined;
  },

  async create(input: NewUserInput): Promise<User> {
    const result = await pool.query(
      `INSERT INTO public.users
         (name, email, password_hash, account_type, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.name,
        input.email,
        input.passwordHash,
        input.accountType ?? "solo",
        input.phone ?? null,
        input.address ?? null,
      ]
    );
    return rowToUser(result.rows[0] as Record<string, unknown>);
  },

  async emailExists(email: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM public.users WHERE email = $1`,
      [email]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },
};
