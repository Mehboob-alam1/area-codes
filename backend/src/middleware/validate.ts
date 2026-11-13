import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function asyncRoute(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function validate(schema: ZodSchema, target: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const source = target === "query" ? Object.fromEntries(Object.entries(req.query).map(([key, value]) => [key, value === "" ? undefined : value])) : req.body;
    const parsed = schema.safeParse(source);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION", message: "Request validation failed.", details: parsed.error.flatten() },
      });
    }
    if (target === "body") req.body = parsed.data;
    else req.query = parsed.data as Request["query"];
    next();
  };
}
