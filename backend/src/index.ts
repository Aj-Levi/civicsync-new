import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import adminAuthRoutes from "./routes/adminAuthRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 5001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true, // allow cookies
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res
    .status(200)
    .json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminAuthRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀  CivicSync backend running on http://localhost:${PORT}`);
    console.log(`📡  Environment: ${process.env.NODE_ENV ?? "development"}`);
  });
};

start();
