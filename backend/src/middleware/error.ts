import type { NextFunction, Request, Response } from "express";
import { env } from "../config/environment";

export function errorHandler(error: { status?: number; message?: string; details?: unknown }, _req: Request, res: Response, _next: NextFunction) {
  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
  const message = status >= 500 && env.nodeEnv === "production" ? "The server could not complete that request." : error.message || "The server could not complete that request.";
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    error: { code: status === 404 ? "NOT_FOUND" : status === 403 ? "FORBIDDEN" : status === 401 ? "UNAUTHORIZED" : "ERROR", message, details: error.details },
  });
}
