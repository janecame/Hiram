import "dotenv/config";
import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items";
import authRouter from "./routes/auth";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);

app.listen(PORT, () => {
  console.log(`Hiram API running on http://localhost:${PORT}`);
});
