/**
 * Starts the Hostinger standalone package when the process is launched from the repo root.
 * Hostinger's Next.js deploy uses frontend/.next/standalone/server.js directly.
 */
const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(__dirname, "frontend", ".next", "standalone", "server.js"),
  path.join(__dirname, ".next", "standalone", "server.js"),
];

const entry = candidates.find((file) => fs.existsSync(file));

if (!entry) {
  console.error("The standalone server is missing. Run npm run build before starting.");
  process.exit(1);
}

require(entry);
