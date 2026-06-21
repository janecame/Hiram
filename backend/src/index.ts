import "dotenv/config";
import express from "express";
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

app.listen(PORT, () => {
  console.log(`Hiram API running on http://localhost:${PORT}`);
});
