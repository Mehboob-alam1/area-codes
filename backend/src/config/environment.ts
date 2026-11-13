import path from "path";
import dotenv from "dotenv";

dotenv.config();

const root = path.resolve(__dirname, "../../..");

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production" && !process.env.ADMIN_JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET is required in production.");
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  dataFile: process.env.DATA_FILE || path.join(root, "database", "data", "store.json"),
  seedFile: process.env.SEED_FILE || path.join(root, "database", "seeds", "directory-seed.json"),
  jwtSecret: process.env.ADMIN_JWT_SECRET || "dev-only-change-me",
  usingDevJwtSecret: !process.env.ADMIN_JWT_SECRET,
  adminEmail: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@worldareacodes.local",
  adminPassword:
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    (nodeEnv === "production" ? "" : "DirectoryAdmin!2026"),
  adminName: process.env.ADMIN_BOOTSTRAP_NAME || "Local Super Admin",
  disableRateLimit: process.env.DISABLE_RATE_LIMIT === "1",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
};
