import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataFile = path.join(os.tmpdir(), "wacd-vitest.json");
fs.rmSync(dataFile, { force: true });

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATA_FILE: dataFile,
      SEED_FILE: path.join(root, "database", "seeds", "directory-seed.json"),
      ADMIN_JWT_SECRET: "test-secret-value",
      ADMIN_BOOTSTRAP_EMAIL: "admin@test.local",
      ADMIN_BOOTSTRAP_PASSWORD: "TestAdmin!2026",
      ADMIN_BOOTSTRAP_NAME: "Test Admin",
      DISABLE_RATE_LIMIT: "1",
      CORS_ORIGIN: "http://localhost:3000",
    },
  },
});
