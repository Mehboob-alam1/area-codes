export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { createRequire } = await import("node:module");
    const fs = await import("node:fs");
    const path = await import("node:path");
    const require = createRequire(path.join(process.cwd(), "package.json"));
    const publicPort = String(process.env.PORT || "");
    let apiPort = String(process.env.API_PORT || "5000");
    if (publicPort && apiPort === publicPort) apiPort = "5050";
    process.env.API_PORT = apiPort;
    if (!process.env.API_INTERNAL_URL || apiPort === "5050") {
      process.env.API_INTERNAL_URL = `http://127.0.0.1:${apiPort}`;
    }

    const candidates = [
      path.join(process.cwd(), "backend", "dist", "server.js"),
      path.join(process.cwd(), ".next", "standalone", "backend", "dist", "server.js"),
      path.join(process.cwd(), "frontend", ".next", "standalone", "backend", "dist", "server.js"),
    ];
    const serverFile = candidates.find((file) => fs.existsSync(file));
    if (!serverFile) {
      console.error("The API bundle was not packed with the standalone server.");
      return;
    }
    require(serverFile);
  } catch (error) {
    console.error("The API did not start. The site will still serve pages.");
    console.error(error);
  }
}
