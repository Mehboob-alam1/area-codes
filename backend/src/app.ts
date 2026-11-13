import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/environment";
import { isSupabaseConfigured } from "./config/database";
import { trackRequest } from "./lib/metrics";
import { errorHandler } from "./middleware/error";
import adminRoutes from "./routes/admin";
import directoryRoutes from "./routes/directory";
import phoneRoutes from "./routes/phone";

export const app = express();

if (env.nodeEnv === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.corsOrigins, methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json({ limit: "2mb" }));
app.use((_req, _res, next) => {
  trackRequest();
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.disableRateLimit,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests. Try again in a few minutes." } },
});
const phoneLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.disableRateLimit,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Phone lookup is temporarily limited. Try again shortly." } },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.disableRateLimit,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many sign-in attempts." } },
});

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "world-area-code-directory",
      dataProvider: "local-json",
      supabaseConfigured: isSupabaseConfigured(),
      time: new Date().toISOString(),
    },
  });
});

app.use("/api/v1", limiter);
app.use("/api/v1/phone", phoneLimiter, phoneRoutes);
app.use("/api/v1/admin/auth/login", authLimiter);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", directoryRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "That API route does not exist." } });
});

app.use(errorHandler);
