export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const childProcess = await import("node:child_process");
    const spawn = childProcess.spawn;
    if (typeof spawn !== "function") {
      console.error("The API could not be started from this server.");
      return;
    }

    const publicPort = String(process.env.PORT || "");
    let apiPort = String(process.env.API_PORT || "5000");
    if (publicPort && apiPort === publicPort) apiPort = "5050";
    process.env.API_PORT = apiPort;
    process.env.API_INTERNAL_URL = `http://127.0.0.1:${apiPort}`;

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

    const child = spawn(process.execPath, [serverFile], {
      stdio: "inherit",
      env: {
        ...process.env,
        API_PORT: apiPort,
        API_INTERNAL_URL: process.env.API_INTERNAL_URL,
      },
    });
    child.on("error", (error) => {
      console.error("The API did not start. The site will still serve pages.");
      console.error(error);
    });
    child.on("exit", (code) => {
      if (code) console.error(`The directory API stopped with code ${code}.`);
    });

    const started = Date.now();
    while (Date.now() - started < 15000) {
      try {
        const response = await fetch(`${process.env.API_INTERNAL_URL}/api/v1/stats`);
        if (response.ok) return;
      } catch {
        // The API process is still opening its port.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    console.error("The directory API did not become ready.");
  } catch (error) {
    console.error("The API did not start. The site will still serve pages.");
    console.error(error);
  }
}
