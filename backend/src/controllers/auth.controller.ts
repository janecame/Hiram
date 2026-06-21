import "dotenv/config";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "hiram-secret";
const TOKEN_TTL = "7d";

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password, accountType } = req.body as {
      name: string;
      email: string;
      password: string;
      accountType?: "solo" | "business";
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }
    if (await UserModel.emailExists(email)) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, passwordHash, accountType });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: TOKEN_TTL,
    });

    res.status(201).json({ token, user });
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

    const token = jwt.sign(
      { id: record.id, email: record.email, name: record.name },
      JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    const { passwordHash: _ph, ...user } = record;
    res.json({ token, user });
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await UserModel.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  },
};
