import { createHmac, timingSafeEqual } from "crypto";
import { env } from "../config/environment";
import type { AdminRole } from "../types";

export interface TokenPayload {
  sub: string;
  role: AdminRole;
  email: string;
  exp: number;
}

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function signToken(payload: Omit<TokenPayload, "exp">, expiresInSeconds = 60 * 60 * 12) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds });
  const signature = createHmac("sha256", env.jwtSecret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;
  const expected = createHmac("sha256", env.jwtSecret).update(`${header}.${body}`).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  const payload = decode<TokenPayload>(body);
  if (!payload?.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
