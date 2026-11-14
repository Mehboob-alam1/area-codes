/**
 * Hostinger starts this file. It must listen on 0.0.0.0 and PORT itself.
 * The API listens on 127.0.0.1 only. Next.js rewrites /backend-api to it.
 */
const fs = require("fs");
const http = require("http");
const path = require("path");
const { parse } = require("url");

const root = __dirname;
const frontendDir = path.join(root, "frontend");
const publicPort = Number(process.env.PORT || 3000);
const apiPort = String(process.env.API_PORT || 5000);

if (!fs.existsSync(path.join(frontendDir, ".next"))) {
  console.error("The Next.js build is missing. The deploy must run npm run build before start.");
  process.exit(1);
}

process.env.API_INTERNAL_URL = process.env.API_INTERNAL_URL || `http://127.0.0.1:${apiPort}`;

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

const next = require(path.join(frontendDir, "node_modules", "next"));
const app = next({ dev: false, dir: frontendDir, hostname: "0.0.0.0", port: publicPort });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    })
    .listen(publicPort, "0.0.0.0", () => {
      console.log(`World Area Code Directory listening on 0.0.0.0:${publicPort}`);
    });
});
