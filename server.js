/**
 * Fallback when Hostinger starts the repository root instead of the standalone file.
 * The Next.js deployment starts .next/standalone/server.js directly.
 */
const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(__dirname, ".next", "standalone", "server.js"),
  path.join(__dirname, "frontend", ".next", "standalone", "server.js"),
];

const entry = candidates.find((file) => fs.existsSync(file));

if (!entry) {
  console.error("Missing .next/standalone/server.js. The Hostinger build script must be seed.");
  process.exit(1);
}

require(entry);
