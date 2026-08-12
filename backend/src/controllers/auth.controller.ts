import "dotenv/config";
import crypto from "crypto";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
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
const TOKEN_TTL = "7d";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Cross-origin (Vercel <-> Render) requires SameSite=None, which in turn requires
// Secure — browsers drop None cookies that aren't Secure. Dev over plain http
// needs Secure off, so this is tied to NODE_ENV rather than hardcoded.
const isProd = process.env["NODE_ENV"] === "production";

function setSessionCookies(res: Response, userId: string, email: string, name: string, isAdmin: boolean): void {
  const token = jwt.sign({ id: userId, email, name, isAdmin }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie("hiram_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: TOKEN_TTL_MS,
  });
  res.cookie("hiram_csrf", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: TOKEN_TTL_MS,
  });
}

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password, accountType, termsAcceptedAt } = req.body as {
      name: string;
      email: string;
      password: string;
      accountType?: "solo" | "business";
      termsAcceptedAt?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    if (await UserModel.emailExists(email)) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, passwordHash, accountType, termsAcceptedAt });
    setSessionCookies(res, user.id, user.email, user.name, user.isAdmin);

    res.status(201).json({ user });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const record = await UserModel.findByEmail(email);
    if (!record || !(await bcrypt.compare(password, record.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (record.disabled) {
      res.status(403).json({ error: "Your account has been disabled. Please contact support." });
      return;
    }

    setSessionCookies(res, record.id, record.email, record.name, record.isAdmin);

    const { passwordHash: _ph, ...user } = record;
    res.json({ user });
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await UserModel.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie("hiram_token", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax" });
    res.clearCookie("hiram_csrf", { httpOnly: false, secure: isProd, sameSite: isProd ? "none" : "lax" });
    res.json({ success: true });
  },
};
