/**
 * Hostinger starts the official Next.js file at .next/standalone/server.js.
 * That file must keep Next's startServer bootstrap. This script only adds
 * static files and the API beside it, then copies the package to the repo root
 * because the Hostinger app root is the repository.
 */
import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(frontendDir, "..");
const standaloneRoot = path.join(frontendDir, ".next", "standalone");
const nestedAppDir = path.join(standaloneRoot, "frontend");
let standaloneDir = standaloneRoot;

if (!existsSync(path.join(standaloneRoot, "server.js")) && existsSync(path.join(nestedAppDir, "server.js"))) {
  standaloneDir = nestedAppDir;
}

const generatedServer = path.join(standaloneDir, "server.js");
if (!existsSync(generatedServer)) {
  console.error("Next.js did not create .next/standalone/server.js.");
  process.exit(1);
}

const serverSource = readFileSync(generatedServer, "utf8");
if (!serverSource.includes("startServer")) {
  console.error("standalone/server.js is not the Next.js server Hostinger starts.");
  process.exit(1);
}

const staleWrapper = path.join(standaloneDir, "next-server.js");
if (existsSync(staleWrapper)) rmSync(staleWrapper);

cpSync(path.join(frontendDir, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
  dereference: true,
});

const publicDir = path.join(frontendDir, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true, dereference: true });
}

const directoryApi = path.join(frontendDir, "node_modules", "directory-api");
if (!existsSync(path.join(directoryApi, "index.js")) || !existsSync(path.join(directoryApi, "directory-seed.json"))) {
  console.error("The packed directory API is missing, so the site cannot load countries.");
  process.exit(1);
}
const standaloneModules = path.join(standaloneDir, "node_modules", "directory-api");
mkdirSync(path.dirname(standaloneModules), { recursive: true });
cpSync(directoryApi, standaloneModules, { recursive: true, dereference: true });
const seedDir = path.join(standaloneDir, "database", "seeds");
mkdirSync(seedDir, { recursive: true });
copyFileSync(path.join(repoRoot, "database", "seeds", "directory-seed.json"), path.join(seedDir, "directory-seed.json"));

mkdirSync(path.join(standaloneDir, "tmp"), { recursive: true });

if (standaloneDir !== standaloneRoot) {
  for (const name of readdirSync(standaloneDir)) {
    cpSync(path.join(standaloneDir, name), path.join(standaloneRoot, name), {
      recursive: true,
      dereference: true,
    });
  }
}

const publishedRoot = path.join(repoRoot, ".next", "standalone");
rmSync(publishedRoot, { recursive: true, force: true });
mkdirSync(path.join(repoRoot, ".next"), { recursive: true });
cpSync(standaloneRoot, publishedRoot, { recursive: true, dereference: true });

const published = path.join(repoRoot, ".next", "standalone", "server.js");
if (!existsSync(published) || !readFileSync(published, "utf8").includes("startServer")) {
  console.error("The repository root is missing .next/standalone/server.js.");
  process.exit(1);
}

console.log("Hostinger can start .next/standalone/server.js.");
