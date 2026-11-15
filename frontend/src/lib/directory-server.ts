import { app } from "directory-api";

let opening: Promise<string> | null = null;

function localBase() {
  if (!opening) {
    opening = new Promise<string>((resolve, reject) => {
      const server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("The directory API did not open a local port."));
          return;
        }
        resolve(`http://127.0.0.1:${address.port}`);
      });
      server.on("error", (error) => {
        opening = null;
        reject(error);
      });
    }).catch((error) => {
      opening = null;
      console.error("The directory API could not start inside the website.");
      console.error(error);
      throw error;
    });
  }
  return opening;
}

export async function directoryFetch(pathname: string, init?: RequestInit) {
  const base = await localBase();
  return fetch(`${base}${pathname}`, { ...init, cache: "no-store" });
}
