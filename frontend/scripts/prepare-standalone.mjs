/**
 * Hostinger serves Next.js only when .next/standalone/server.js exists.
 * This packs that server together with the API and the directory seed.
 */
import { cpSync, copyFileSync, existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(frontendDir, "..");
const standaloneDir = path.join(frontendDir, ".next", "standalone");
const generatedServer = path.join(standaloneDir, "server.js");
const nextServer = path.join(standaloneDir, "next-server.js");

if (!existsSync(generatedServer) && !existsSync(nextServer)) {
  console.error("Next.js did not create .next/standalone/server.js.");
  process.exit(1);
}

if (!existsSync(nextServer)) {
  renameSync(generatedServer, nextServer);
}

writeFileSync(
  generatedServer,
  `const path = require("path");
const apiPort = String(process.env.API_PORT || "5000");
process.env.API_INTERNAL_URL = process.env.API_INTERNAL_URL || "http://127.0.0.1:" + apiPort;
const savedPort = process.env.PORT;
process.env.PORT = apiPort;
try {
  require("./backend/dist/server.js");
} catch (error) {
  console.error("The API did not start. The site will still serve pages.");
  console.error(error);
} finally {
  if (savedPort === undefined) delete process.env.PORT;
  else process.env.PORT = savedPort;
}
require("./next-server.js");
`,
);

cpSync(path.join(frontendDir, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
  dereference: true,
});

const publicDir = path.join(frontendDir, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true, dereference: true });
}

const backendModules = path.join(repoRoot, "backend", "node_modules");
const backendDist = path.join(repoRoot, "backend", "dist");
if (!existsSync(backendDist)) {
  console.error("backend/dist is missing. Build the API before the frontend.");
  process.exit(1);
}

cpSync(backendDist, path.join(standaloneDir, "backend", "dist"), { recursive: true, dereference: true });
if (existsSync(backendModules)) {
  cpSync(backendModules, path.join(standaloneDir, "backend", "node_modules"), {
    recursive: true,
    dereference: true,
  });
}
copyFileSync(path.join(repoRoot, "backend", "package.json"), path.join(standaloneDir, "backend", "package.json"));

const seedDir = path.join(standaloneDir, "database", "seeds");
mkdirSync(seedDir, { recursive: true });
copyFileSync(
  path.join(repoRoot, "database", "seeds", "directory-seed.json"),
  path.join(seedDir, "directory-seed.json"),
);
mkdirSync(path.join(standaloneDir, "tmp"), { recursive: true });

const rootStandalone = path.join(repoRoot, ".next", "standalone");
cpSync(standaloneDir, rootStandalone, { recursive: true, dereference: true });

console.log("Standalone package is ready for Hostinger.");
