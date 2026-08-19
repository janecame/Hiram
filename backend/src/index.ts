import "dotenv/config";
import { createServer } from "http";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { initSocket } from "./socket";
import itemsRouter from "./routes/items";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import requestsRouter from "./routes/requests";
import blockedDatesRouter from "./routes/blocked-dates";
import reviewsRouter from "./routes/reviews";
import notificationsRouter from "./routes/notifications";
import messagesRouter from "./routes/messages";
import uploadRouter from "./routes/upload";
import adminRouter from "./routes/admin";
import reportsRouter from "./routes/reports";
import paymentsRouter from "./routes/payments";
import { pool } from "./db";

const app = express();
const httpServer = createServer(app);

// Auth now rides on cookies (credentials: true), and browsers reject a wildcard
// Access-Control-Allow-Origin on credentialed requests — so origins must be an
// explicit list, never "*". Falls back to the Vite dev server origin only when
// ALLOWED_ORIGINS is unset, so local dev keeps working without extra config.
const allowedOrigins = process.env["ALLOWED_ORIGINS"]?.split(",").map((o) => o.trim()) ?? [
  "http://localhost:5173",
];
const corsOptions = { origin: allowedOrigins, credentials: true };

const io = new Server(httpServer, { cors: corsOptions });
initSocket(io);
const PORT = process.env["PORT"] ?? 3101;

app.use(cors(corsOptions));
app.use(cookieParser());

// Mounted before express.json() so the webhook route can read the raw body for signature verification.
app.use("/api/payments", paymentsRouter);

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", db: "unreachable", detail: String(err) });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/items", itemsRouter);
app.use("/api/items", blockedDatesRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/conversations", messagesRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reports", reportsRouter);

// Last-resort error handler so a thrown/forwarded error returns 500 instead of
// crashing the process. (Controllers handle their own expected errors; this is
// defense-in-depth for anything that slips through.)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled route error:", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
});

// A rejected promise that escapes a handler would otherwise terminate Node —
// log it and keep serving.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

httpServer.listen(PORT, () => {
  console.log(`Hiram API running on http://localhost:${PORT}`);
});
