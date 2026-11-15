/**
 * Hostinger starts this file when the application root is the repository.
 * The Next.js server itself lives in .next/standalone and listens on PORT.
 */
const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(__dirname, ".next", "standalone"),
  path.join(__dirname, "frontend", ".next", "standalone"),
];

const directory = candidates.find((folder) => fs.existsSync(path.join(folder, "server.js")));

if (!directory) {
  console.error("Missing .next/standalone/server.js. The Hostinger build script must be seed.");
  process.exit(1);
}

process.chdir(directory);
require(path.join(directory, "server.js"));
