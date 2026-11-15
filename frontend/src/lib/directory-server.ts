import http from "node:http";
import { app } from "directory-api";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, done?: (error?: Error) => void) => void;

const handle = (app as unknown as { handle: Handler }).handle.bind(app);

function headerValue(value: string | number | string[] | undefined) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined) return "";
  return String(value);
}

function invoke(method: string, url: string, headers: Record<string, string>, body?: string) {
  return new Promise<{ status: number; headers: Record<string, string>; body: Buffer }>((resolve, reject) => {
    const socket = {
      remoteAddress: "127.0.0.1",
      encrypted: false,
      destroy() {},
      on() { return this; },
      once() { return this; },
      removeListener() { return this; },
      write() { return true; },
      end() { return this; },
    };
    const req = new http.IncomingMessage(socket as unknown as http.IncomingMessage["socket"]);
    req.method = method;
    req.url = url;
    req.headers = headers;
    req.httpVersion = "1.1";
    req.httpVersionMajor = 1;
    req.httpVersionMinor = 1;
    req.socket = socket as unknown as http.IncomingMessage["socket"];
    req.connection = req.socket;

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      const outgoing: Record<string, string> = {};
      for (const [key, value] of Object.entries(res.getHeaders())) outgoing[key] = headerValue(value);
      resolve({ status: res.statusCode || 200, headers: outgoing, body: Buffer.concat(chunks) });
    };
    res.write = ((chunk: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), typeof encoding === "string" ? encoding : undefined));
      if (typeof encoding === "function") encoding();
      if (typeof callback === "function") callback();
      return true;
    }) as http.ServerResponse["write"];
    res.end = ((chunk?: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void) => {
      if (chunk && typeof chunk !== "function") {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), typeof encoding === "string" ? encoding : undefined));
      }
      if (typeof chunk === "function") chunk();
      if (typeof encoding === "function") encoding();
      if (typeof callback === "function") callback();
      finish();
      return res;
    }) as http.ServerResponse["end"];

    const timer = setTimeout(() => {
      if (!settled) reject(new Error("The directory took too long to answer."));
    }, 8000);

    if (body) req.push(Buffer.from(body));
    req.push(null);
    try {
      handle(req, res, (error) => {
        clearTimeout(timer);
        if (error) reject(error);
        else finish();
      });
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

export async function directoryFetch(pathname: string, init?: RequestInit) {
  const method = init?.method || "GET";
  const headers: Record<string, string> = { host: "127.0.0.1" };
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
  }
  const body = typeof init?.body === "string" ? init.body : undefined;
  if (body && !headers["content-length"]) headers["content-length"] = String(Buffer.byteLength(body));
  const result = await invoke(method, pathname, headers, body);
  return new Response(new Uint8Array(result.body), { status: result.status, headers: result.headers });
}
