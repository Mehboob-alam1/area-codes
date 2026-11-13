/**
 * Runs the API and the Next.js site as one process for a single-port host.
 * The public port is PORT. The API stays on API_PORT and is reached through the Next.js rewrite.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webPort = String(process.env.PORT || "3000");
const apiPort = String(process.env.API_PORT || "5000");

const api = spawn(process.execPath, ["dist/server.js"], {
  cwd: path.join(root, "backend"),
  env: { ...process.env, PORT: apiPort },
  stdio: "inherit",
});

const web = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", webPort], {
  cwd: path.join(root, "frontend"),
  env: {
    ...process.env,
    PORT: webPort,
    API_INTERNAL_URL: process.env.API_INTERNAL_URL || `http://127.0.0.1:${apiPort}`,
  },
  stdio: "inherit",
});

function stop() {
  if (!api.killed) api.kill("SIGTERM");
  if (!web.killed) web.kill("SIGTERM");
}

process.on("SIGTERM", stop);
process.on("SIGINT", stop);

let stopped = false;
function finish(code) {
  if (stopped) return;
  stopped = true;
  stop();
  process.exit(code ?? 1);
}

api.on("exit", finish);
web.on("exit", finish);
