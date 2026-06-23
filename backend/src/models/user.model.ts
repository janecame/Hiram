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
    isAdmin: (row["is_admin"] as boolean) ?? false,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  accountType?: "solo" | "business";
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

  async findByName(name: string): Promise<User | undefined> {
    const result = await pool.query(
      `SELECT * FROM public.users WHERE name = $1 LIMIT 1`,
      [name]
    );
    return result.rows[0] ? rowToUser(result.rows[0] as Record<string, unknown>) : undefined;
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (input.name !== undefined)        { sets.push(`name = $${idx++}`);         values.push(input.name); }
    if (input.email !== undefined)       { sets.push(`email = $${idx++}`);        values.push(input.email); }
    if (input.phone !== undefined)       { sets.push(`phone = $${idx++}`);        values.push(input.phone); }
    if (input.address !== undefined)     { sets.push(`address = $${idx++}`);      values.push(input.address); }
    if (input.accountType !== undefined) { sets.push(`account_type = $${idx++}`); values.push(input.accountType); }
    values.push(id);
    const result = await pool.query(
      `UPDATE public.users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
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

  async findAllAdmin(opts: {
    page?: number;
    pageSize?: number;
    search?: string;
    accountType?: "solo" | "business" | "all";
    sort?: "newest" | "oldest" | "name_asc" | "name_desc";
  } = {}): Promise<{ users: User[]; total: number; totalPages: number }> {
    const { page = 1, pageSize = 20, search = "", accountType, sort = "newest" } = opts;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (search.trim()) {
      conditions.push(`(name ILIKE $${p} OR email ILIKE $${p})`);
      params.push(`%${search.trim()}%`);
      p++;
    }
    if (accountType && accountType !== "all") {
      conditions.push(`account_type = $${p++}::account_type`);
      params.push(accountType);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const ORDER_MAP: Record<string, string> = {
      newest: "created_at DESC",
      oldest: "created_at ASC",
      name_asc: "name ASC",
      name_desc: "name DESC",
    };
    const orderBy = ORDER_MAP[sort] ?? ORDER_MAP["newest"];

    const countResult = await pool.query(`SELECT COUNT(*) FROM public.users ${where}`, params);
    const total = parseInt(countResult.rows[0]["count"] as string, 10);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;

    const result = await pool.query(
      `SELECT * FROM public.users ${where} ORDER BY ${orderBy} LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );
    return { users: result.rows.map(rowToUser), total, totalPages };
  },

  async deleteById(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM public.users WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },
};
