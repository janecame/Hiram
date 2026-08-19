import { pool } from "../db";
import type { User } from "../types/user";

export interface NewUserInput {
  name: string;
  email: string;
  passwordHash: string;
  accountType?: "solo" | "business";
  phone?: string;
  address?: string;
  termsAcceptedAt?: string;
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    email: row["email"] as string,
    accountType: row["account_type"] as User["accountType"],
    phone: (row["phone"] as string | null) ?? "",
    address: (row["address"] as string | null) ?? "",
    avatarUrl: (row["avatar_url"] as string | null) ?? undefined,
    defaultProvince: (row["default_province"] as string | null) ?? undefined,
    defaultCity: (row["default_city"] as string | null) ?? undefined,
    defaultBarangay: (row["default_barangay"] as string | null) ?? undefined,
    defaultProvinceCode: (row["default_province_code"] as string | null) ?? undefined,
    defaultCityCode: (row["default_city_code"] as string | null) ?? undefined,
    defaultBarangayCode: (row["default_barangay_code"] as string | null) ?? undefined,
    defaultAddressDetail: (row["default_address_detail"] as string | null) ?? undefined,
    defaultMeetup: (row["default_meetup"] as string | null) ?? undefined,
    defaultLat: row["default_lat"] != null ? Number(row["default_lat"]) : undefined,
    defaultLng: row["default_lng"] != null ? Number(row["default_lng"]) : undefined,
    idSubmitted: row["id_submitted"] as boolean,
    businessDocsSubmitted: row["business_docs_submitted"] as boolean,
    verificationStatus: (row["verification_status"] as User["verificationStatus"]) ?? "unsubmitted",
    idImageUrl: (row["id_image_url"] as string | null) ?? undefined,
    idRejectionReason: (row["id_rejection_reason"] as string | null) ?? undefined,
    isAdmin: (row["is_admin"] as boolean) ?? false,
    disabled: (row["disabled"] as boolean) ?? false,
    disabledReason: (row["disabled_reason"] as string | null) ?? undefined,
    termsAcceptedAt:
      row["terms_accepted_at"] instanceof Date
        ? (row["terms_accepted_at"] as Date).toISOString()
        : (row["terms_accepted_at"] as string | null) ?? undefined,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

/** Public view of a user — never leaks the raw government-ID image. */
function toPublicUser(user: User): User {
  const { idImageUrl: _idImageUrl, idRejectionReason: _idRejectionReason, ...rest } = user;
  return rest;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  accountType?: "solo" | "business";
  avatarUrl?: string;
  defaultProvince?: string;
  defaultCity?: string;
  defaultBarangay?: string;
  defaultProvinceCode?: string;
  defaultCityCode?: string;
  defaultBarangayCode?: string;
  defaultAddressDetail?: string;
  defaultMeetup?: string;
  defaultLat?: number;
  defaultLng?: number;
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
         (name, email, password_hash, account_type, phone, address, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.name,
        input.email,
        input.passwordHash,
        input.accountType ?? "solo",
        input.phone ?? null,
        input.address ?? null,
        input.termsAcceptedAt ?? null,
      ]
    );
    return rowToUser(result.rows[0] as Record<string, unknown>);
  },

  async findByName(name: string): Promise<User | undefined> {
    const result = await pool.query(
      `SELECT * FROM public.users WHERE name = $1 LIMIT 1`,
      [name]
    );
    return result.rows[0]
      ? toPublicUser(rowToUser(result.rows[0] as Record<string, unknown>))
      : undefined;
  },

  async searchByName(q: string, limit = 10): Promise<User[]> {
    const result = await pool.query(
      `SELECT * FROM public.users
       WHERE name ILIKE $1
         AND disabled = false
       ORDER BY name ASC
       LIMIT $2`,
      [`%${q.trim()}%`, limit]
    );
    return result.rows.map((row) => toPublicUser(rowToUser(row as Record<string, unknown>)));
  },

  /** Owner re-submits a government ID: stores the image and resets review to pending. */
  async submitId(userId: string, imageUrl: string): Promise<User> {
    const result = await pool.query(
      `UPDATE public.users
         SET id_image_url = $1,
             id_submitted = true,
             verification_status = 'pending',
             id_rejection_reason = NULL,
             verified = false
       WHERE id = $2
       RETURNING *`,
      [imageUrl, userId]
    );
    return rowToUser(result.rows[0] as Record<string, unknown>);
  },

  /** Admin decision on a submitted ID. Keeps the legacy `verified` boolean in sync. */
  async setVerification(
    id: string,
    status: "pending" | "verified" | "rejected",
    reason?: string
  ): Promise<User | undefined> {
    const result = await pool.query(
      `UPDATE public.users
         SET verification_status = $1::verification_status,
             id_rejection_reason = $2,
             verified = ($1 = 'verified')
       WHERE id = $3
       RETURNING *`,
      [status, status === "rejected" ? (reason ?? null) : null, id]
    );
    return result.rows[0] ? rowToUser(result.rows[0] as Record<string, unknown>) : undefined;
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (input.name !== undefined)                { sets.push(`name = $${idx++}`);                 values.push(input.name); }
    if (input.email !== undefined)               { sets.push(`email = $${idx++}`);                values.push(input.email); }
    if (input.phone !== undefined)               { sets.push(`phone = $${idx++}`);                values.push(input.phone); }
    if (input.address !== undefined)             { sets.push(`address = $${idx++}`);              values.push(input.address); }
    if (input.accountType !== undefined)         { sets.push(`account_type = $${idx++}`);         values.push(input.accountType); }
    if (input.avatarUrl !== undefined)           { sets.push(`avatar_url = $${idx++}`);           values.push(input.avatarUrl); }
    if (input.defaultProvince !== undefined)     { sets.push(`default_province = $${idx++}`);     values.push(input.defaultProvince); }
    if (input.defaultCity !== undefined)         { sets.push(`default_city = $${idx++}`);         values.push(input.defaultCity); }
    if (input.defaultBarangay !== undefined)     { sets.push(`default_barangay = $${idx++}`);     values.push(input.defaultBarangay); }
    if (input.defaultProvinceCode !== undefined) { sets.push(`default_province_code = $${idx++}`); values.push(input.defaultProvinceCode); }
    if (input.defaultCityCode !== undefined)     { sets.push(`default_city_code = $${idx++}`);     values.push(input.defaultCityCode); }
    if (input.defaultBarangayCode !== undefined) { sets.push(`default_barangay_code = $${idx++}`); values.push(input.defaultBarangayCode); }
    if (input.defaultAddressDetail !== undefined){ sets.push(`default_address_detail = $${idx++}`);values.push(input.defaultAddressDetail); }
    if (input.defaultMeetup !== undefined)       { sets.push(`default_meetup = $${idx++}`);       values.push(input.defaultMeetup); }
    if (input.defaultLat !== undefined)          { sets.push(`default_lat = $${idx++}`);          values.push(input.defaultLat); }
    if (input.defaultLng !== undefined)          { sets.push(`default_lng = $${idx++}`);          values.push(input.defaultLng); }
    values.push(id);
    const result = await pool.query(
      `UPDATE public.users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rowToUser(result.rows[0] as Record<string, unknown>);
  },

  /** Records that the logged-in user has accepted the current Terms and Conditions. */
  async acceptTerms(id: string): Promise<User> {
    const result = await pool.query(
      `UPDATE public.users
         SET terms_accepted_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return rowToUser(result.rows[0] as Record<string, unknown>);
  },

  async setDisabled(id: string, disabled: boolean, reason?: string): Promise<User | undefined> {
    const result = await pool.query(
      `UPDATE public.users
         SET disabled = $1,
             disabled_reason = $2,
             token_valid_after = CASE WHEN $1 THEN NOW() ELSE token_valid_after END
       WHERE id = $3
       RETURNING *`,
      [disabled, disabled ? (reason ?? null) : null, id]
    );
    return result.rows[0] ? rowToUser(result.rows[0] as Record<string, unknown>) : undefined;
  },

  /** Earliest issue-time a token must have to still be accepted; null means no restriction. */
  async getTokenValidAfter(id: string): Promise<Date | null> {
    const result = await pool.query(
      `SELECT token_valid_after FROM public.users WHERE id = $1`,
      [id]
    );
    const value = result.rows[0]?.["token_valid_after"] as Date | null | undefined;
    return value ?? null;
  },

  async getPasswordHash(id: string): Promise<string | undefined> {
    const result = await pool.query(
      `SELECT password_hash FROM public.users WHERE id = $1`,
      [id]
    );
    return result.rows[0]?.["password_hash"] as string | undefined;
  },

  /** Updates the password and invalidates any tokens issued before now. */
  async changePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query(
      `UPDATE public.users
         SET password_hash = $1,
             token_valid_after = NOW()
       WHERE id = $2`,
      [passwordHash, id]
    );
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
    verificationStatus?: User["verificationStatus"] | "all";
    sort?: "newest" | "oldest" | "name_asc" | "name_desc";
  } = {}): Promise<{ users: User[]; total: number; totalPages: number }> {
    const { page = 1, pageSize = 20, search = "", accountType, verificationStatus, sort = "newest" } = opts;

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
    if (verificationStatus && verificationStatus !== "all") {
      conditions.push(`verification_status = $${p++}::verification_status`);
      params.push(verificationStatus);
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
