import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import itemsRouter from "./routes/items";
import authRouter from "./routes/auth";
import requestsRouter from "./routes/requests";
import blockedDatesRouter from "./routes/blocked-dates";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/items", blockedDatesRouter);
app.use("/api/requests", requestsRouter);

// Last-resort error handler so a thrown/forwarded error returns 500 instead of
// crashing the process. (Controllers handle their own expected errors; this is
// defense-in-depth for anything that slips through.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

app.listen(PORT, () => {
  console.log(`Hiram API running on http://localhost:${PORT}`);
});
