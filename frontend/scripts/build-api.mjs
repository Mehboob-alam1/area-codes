/**
 * Compiles the API when this checkout still contains the backend folder.
 * Hostinger can build from the frontend directory alone, so a missing API must not stop the site build.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.resolve(frontendDir, "..", "backend");

if (!existsSync(path.join(backendDir, "package.json"))) {
  console.log("API project was not included in this checkout. The site will build on its own.");
  process.exit(0);
}

function run(args) {
  const result = spawnSync("npm", args, { cwd: backendDir, stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["install", "--include=dev"]);
run(["run", "build"]);
