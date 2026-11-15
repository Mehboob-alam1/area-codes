/**
 * Packs the Express directory into one file so the hosted site can load it
 * without a second Node process or a separate node_modules tree.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(frontendDir, "..");
const backendDir = path.join(repoRoot, "backend");
const outputDir = path.join(frontendDir, "node_modules", "directory-api");
const seedSource = path.join(repoRoot, "database", "seeds", "directory-seed.json");

if (!existsSync(path.join(backendDir, "src", "app.ts"))) {
  console.error("The API source is missing, so the directory cannot be packed.");
  process.exit(1);
}
if (!existsSync(seedSource)) {
  console.error("database/seeds/directory-seed.json is missing.");
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

const banner = `(() => {
  const fs = require("fs");
  const path = require("path");
  const os = require("os");
  const candidates = [
    path.join(__dirname, "directory-seed.json"),
    path.join(process.cwd(), "database", "seeds", "directory-seed.json"),
    path.join(process.cwd(), ".next", "standalone", "database", "seeds", "directory-seed.json"),
    path.join(process.cwd(), "frontend", ".next", "standalone", "database", "seeds", "directory-seed.json"),
  ];
  const seedFile = candidates.find((file) => fs.existsSync(file));
  if (seedFile && !process.env.SEED_FILE) process.env.SEED_FILE = seedFile;
  if (!process.env.DATA_FILE) process.env.DATA_FILE = path.join(os.tmpdir(), "world-area-code-store.json");
})();`;

await esbuild.build({
  entryPoints: [path.join(backendDir, "src", "app.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: path.join(outputDir, "index.js"),
  banner: { js: banner },
  logLevel: "info",
});

copyFileSync(seedSource, path.join(outputDir, "directory-seed.json"));
writeFileSync(
  path.join(outputDir, "package.json"),
  JSON.stringify({ name: "directory-api", version: "1.0.0", private: true, main: "index.js" }, null, 2),
);

console.log("Packed the directory API for the website.");
