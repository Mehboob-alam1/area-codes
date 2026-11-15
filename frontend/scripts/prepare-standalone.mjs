/**
 * Hostinger starts the official Next.js file at .next/standalone/server.js.
 * That file must keep Next's startServer bootstrap. This script only adds
 * static files and the API beside it, then copies the package to the repo root
 * because the Hostinger app root is the repository.
 */
import { spawnSync } from "node:child_process";
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

const backendDist = path.join(repoRoot, "backend", "dist");
if (existsSync(backendDist)) {
  try {
    cpSync(backendDist, path.join(standaloneDir, "backend", "dist"), { recursive: true, dereference: true });
    copyFileSync(path.join(repoRoot, "backend", "package.json"), path.join(standaloneDir, "backend", "package.json"));
    const lockFile = path.join(repoRoot, "backend", "package-lock.json");
    if (existsSync(lockFile)) {
      copyFileSync(lockFile, path.join(standaloneDir, "backend", "package-lock.json"));
    }
    const install = spawnSync("npm", ["install", "--omit=dev", "--ignore-scripts"], {
      cwd: path.join(standaloneDir, "backend"),
      stdio: "inherit",
      shell: true,
    });
    if (install.status !== 0) {
      console.error("The API dependencies were not installed. The website server is still in place.");
    }
    const seedDir = path.join(standaloneDir, "database", "seeds");
    mkdirSync(seedDir, { recursive: true });
    copyFileSync(
      path.join(repoRoot, "database", "seeds", "directory-seed.json"),
      path.join(seedDir, "directory-seed.json"),
    );
  } catch (error) {
    console.error("The API could not be packed. The Next.js server is still in place.");
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

mkdirSync(path.join(repoRoot, ".next"), { recursive: true });
cpSync(standaloneRoot, path.join(repoRoot, ".next", "standalone"), { recursive: true, dereference: true });

const published = path.join(repoRoot, ".next", "standalone", "server.js");
if (!existsSync(published) || !readFileSync(published, "utf8").includes("startServer")) {
  console.error("The repository root is missing .next/standalone/server.js.");
  process.exit(1);
}

console.log("Hostinger can start .next/standalone/server.js.");
