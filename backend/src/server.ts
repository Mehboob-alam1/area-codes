import { app } from "./app";
import { env } from "./config/environment";
import { loadStore } from "./repositories/store";

loadStore();

if (env.usingDevJwtSecret && env.nodeEnv !== "production") {
  console.warn("ADMIN_JWT_SECRET is not set. The API is using a development-only signing secret.");
}

app.listen(env.port, "127.0.0.1", () => {
  console.log(`World Area Code Directory API listening on http://127.0.0.1:${env.port}`);
});
