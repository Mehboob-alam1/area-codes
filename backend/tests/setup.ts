import path from "path";
import os from "os";

process.env.NODE_ENV = "test";
process.env.DATA_FILE = path.join(os.tmpdir(), `wacd-${process.pid}.json`);
process.env.SEED_FILE = path.resolve(process.cwd(), "../database/seeds/directory-seed.json");
process.env.ADMIN_JWT_SECRET = "test-secret-value";
process.env.ADMIN_BOOTSTRAP_EMAIL = "admin@test.local";
process.env.ADMIN_BOOTSTRAP_PASSWORD = "TestAdmin!2026";
process.env.ADMIN_BOOTSTRAP_NAME = "Test Admin";
process.env.DISABLE_RATE_LIMIT = "1";
process.env.CORS_ORIGIN = "http://localhost:3000";
