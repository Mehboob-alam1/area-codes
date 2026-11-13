import type { NextFunction, Request, Response } from "express";
import { hasPermission } from "../lib/permissions";
import { verifyToken } from "../lib/tokens";
import { findAdminById } from "../repositories/store";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Sign in to continue." } });
  }
  const admin = findAdminById(payload.sub);
  if (!admin || admin.status !== "active") {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "This administrator account is not active." } });
  }
  req.admin = admin;
  next();
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin || !hasPermission(req.admin.role, permission)) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You do not have permission for this action." } });
    }
    next();
  };
}
