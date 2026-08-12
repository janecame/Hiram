import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";

function requireJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

const JWT_SECRET = requireJwtSecret();

// Methods that mutate state must prove the request came from our own frontend JS
// (which can read the non-httpOnly hiram_csrf cookie), not just a browser that
// happens to be holding the httpOnly session cookie via SameSite=None.
const CSRF_EXEMPT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = (req.cookies as Record<string, string | undefined> | undefined)?.["hiram_token"];
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!CSRF_EXEMPT_METHODS.has(req.method)) {
    const csrfCookie = (req.cookies as Record<string, string | undefined>)["hiram_csrf"];
    const csrfHeader = req.header("x-csrf-token");
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      res.status(403).json({ error: "Invalid or missing CSRF token" });
      return;
    }
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
      iat: number;
    };

    const tokenValidAfter = await UserModel.getTokenValidAfter(payload.id);
    if (tokenValidAfter && payload.iat * 1000 < tokenValidAfter.getTime()) {
      res.status(401).json({ error: "Session expired, please log in again" });
      return;
    }

    req.user = { ...payload, isAdmin: payload.isAdmin ?? false };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
