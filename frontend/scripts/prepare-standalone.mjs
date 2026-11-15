/**
 * Hostinger starts .next/standalone/server.js.
 * Static files are copied beside it. The API is attached when this checkout contains it.
 * A missing API must not remove the server Hostinger needs.
 */
import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(frontendDir, "..");
const standaloneRoot = path.join(frontendDir, ".next", "standalone");
const nestedAppDir = path.join(standaloneRoot, "frontend");
const standaloneDir =
  !existsSync(path.join(standaloneRoot, "server.js")) && existsSync(path.join(nestedAppDir, "server.js"))
    ? nestedAppDir
    : standaloneRoot;
const generatedServer = path.join(standaloneDir, "server.js");
const nextServer = path.join(standaloneDir, "next-server.js");

if (!existsSync(generatedServer) && !existsSync(nextServer)) {
  console.error("Next.js did not create .next/standalone/server.js.");
  process.exit(1);
}

cpSync(path.join(frontendDir, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
  dereference: true,
});

const publicDir = path.join(frontendDir, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true, dereference: true });
}

const backendDist = path.join(repoRoot, "backend", "dist");
const backendModules = path.join(repoRoot, "backend", "node_modules");

if (existsSync(backendDist)) {
  if (existsSync(generatedServer) && readFileSync(generatedServer, "utf8").includes("startServer")) {
    if (existsSync(nextServer)) rmSync(nextServer);
    renameSync(generatedServer, nextServer);
  }
  writeFileSync(
    generatedServer,
    `const apiPort = String(process.env.API_PORT || "5000");
process.env.API_PORT = apiPort;
process.env.API_INTERNAL_URL = process.env.API_INTERNAL_URL || "http://127.0.0.1:" + apiPort;
try {
  require("./backend/dist/server.js");
} catch (error) {
  console.error("The API did not start. The site will still serve pages.");
  console.error(error);
}
require("./next-server.js");
`,
  );
  try {
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
  } catch (error) {
    console.error("The API could not be packed. The site server is still in place.");
    console.error(error);
  }
}

mkdirSync(path.join(standaloneDir, "tmp"), { recursive: true });

if (standaloneDir !== standaloneRoot) {
  for (const name of readdirSync(standaloneDir)) {
    cpSync(path.join(standaloneDir, name), path.join(standaloneRoot, name), {
      recursive: true,
      dereference: true,
    });
  }
}

if (repoRoot !== frontendDir) {
  cpSync(standaloneRoot, path.join(repoRoot, ".next", "standalone"), { recursive: true, dereference: true });
}

console.log("Standalone server is ready at .next/standalone/server.js.");
