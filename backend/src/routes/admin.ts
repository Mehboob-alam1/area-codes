import { Router } from "express";
import { z } from "zod";
import { env } from "../config/environment";
import { passwordPolicyError, verifyPassword } from "../lib/password";
import { signToken } from "../lib/tokens";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { recordsFromImport } from "../services/import";
import { requestMetrics } from "../lib/metrics";
import {
  countriesToCsv,
  createAdminUser,
  getCountryDetail,
  createAreaCode,
  createCity,
  createCountry,
  createRegion,
  dashboardStats,
  findAdminByEmail,
  importCountries,
  listAdmins,
  listAreaCodes,
  listAudit,
  listCities,
  listCountries,
  listRegions,
  listSearchLogs,
  loadStore,
  publicAdmin,
  pushAudit,
  setVerification,
  softDelete,
  transaction,
  updateAreaCode,
  updateCity,
  updateCountry,
  updateRegion,
  updateSettings,
} from "../repositories/store";
import type { PageQuery, VerificationStatus } from "../types";

const router = Router();
const attempts = new Map<string, { count: number; until: number }>();

const countrySchema = z.object({
  name: z.string().trim().min(1).max(120),
  officialName: z.string().trim().max(180).optional(),
  slug: z.string().trim().max(140).optional(),
  iso2: z.string().trim().length(2),
  iso3: z.string().trim().length(3),
  callingCode: z.string().trim().regex(/^\+\d{1,4}$/).nullable().optional(),
  callingCodes: z.array(z.string()).optional(),
  capital: z.string().trim().max(120).nullable().optional(),
  continent: z.string().trim().max(40).nullable().optional(),
  currencyCode: z.string().trim().max(8).nullable().optional(),
  currencyName: z.string().trim().max(80).nullable().optional(),
  languages: z.array(z.string()).optional(),
  internationalPrefix: z.string().trim().max(8).nullable().optional(),
  nationalPrefix: z.string().trim().max(8).nullable().optional(),
  numberingNotes: z.string().max(4000).optional(),
  description: z.string().max(4000).optional(),
  status: z.enum(["draft", "published", "unpublished"]).optional(),
});

router.post("/auth/login", validate(z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) })), (req, res) => {
  if (env.nodeEnv === "production" && env.usingDevJwtSecret) {
    return res.status(503).json({ success: false, error: { code: "NOT_CONFIGURED", message: "Admin sign-in is not configured." } });
  }
  const email = req.body.email.toLowerCase();
  const current = attempts.get(email);
  if (current && current.until > Date.now()) {
    return res.status(429).json({ success: false, error: { code: "LOCKED", message: "Too many sign-in attempts. Try again later." } });
  }
  const admin = findAdminByEmail(email);
  const valid = admin && admin.status === "active" && verifyPassword(req.body.password, admin.passwordHash);
  if (!valid || !admin) {
    const count = (current && current.until > Date.now() ? current.count : current?.count || 0) + 1;
    attempts.set(email, { count, until: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
    transaction((data) => pushAudit(data, { adminId: admin?.id || null, action: "login_failed", tableName: "admin_users", recordId: admin?.id || null }));
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password." } });
  }
  attempts.delete(email);
  transaction((data) => pushAudit(data, { adminId: admin.id, action: "login", tableName: "admin_users", recordId: admin.id }));
  res.json({ success: true, data: { token: signToken({ sub: admin.id, role: admin.role, email: admin.email }), admin: publicAdmin(admin) } });
});

router.use(requireAuth);

router.get("/me", (req, res) => {
  res.json({ success: true, data: publicAdmin(req.admin!) });
});

router.get("/dashboard", requirePermission("records:read"), (_req, res) => {
  res.json({ success: true, data: { ...dashboardStats(), apiRequests: requestMetrics() } });
});

router.get("/countries", requirePermission("records:read"), (req, res) => {
  const page = listCountries({ page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50, search: String(req.query.search || "") || undefined, status: String(req.query.status || "all") }, "admin");
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get("/countries/export", requirePermission("export"), (_req, res) => {
  res.type("text/csv").send(countriesToCsv());
});

router.get("/countries/:id", requirePermission("records:read"), (req, res) => {
  const detail = getCountryDetail(req.params.id, "admin");
  if (!detail) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Country not found." } });
  res.json({ success: true, data: detail });
});

router.post("/countries", requirePermission("records:write"), validate(countrySchema), (req, res) => {
  const country = createCountry(req.body, req.admin!.id);
  res.status(201).json({ success: true, data: country });
});

router.put("/countries/:id", requirePermission("records:write"), validate(countrySchema.partial()), (req, res) => {
  const country = updateCountry(req.params.id, req.body, req.admin!.id);
  res.json({ success: true, data: country });
});

router.delete("/countries/:id", requirePermission("records:delete"), (req, res) => {
  softDelete("countries", req.params.id, req.admin!.id);
  res.json({ success: true, data: { deleted: true } });
});

router.get("/regions", requirePermission("records:read"), (req, res) => {
  const page = listRegions({ page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50, search: String(req.query.search || "") || undefined, country: String(req.query.country || "") || undefined } as PageQuery, "admin");
  res.json({ success: true, data: page.items, meta: { total: page.total, page: page.page, pages: page.pages } });
});

router.post(
  "/regions",
  requirePermission("records:write"),
  validate(z.object({ countryId: z.string().uuid(), name: z.string().trim().min(1).max(120), regionType: z.string().trim().min(2).max(40), description: z.string().max(2000).optional(), status: z.enum(["draft", "published", "unpublished"]).optional() })),
  (req, res) => {
    res.status(201).json({ success: true, data: createRegion(req.body, req.admin!.id) });
  },
);

router.put(
  "/regions/:id",
  requirePermission("records:write"),
  validate(z.object({ name: z.string().trim().min(1).max(120).optional(), regionType: z.string().trim().max(40).optional(), description: z.string().max(2000).optional(), status: z.enum(["draft", "published", "unpublished"]).optional() })),
  (req, res) => res.json({ success: true, data: updateRegion(req.params.id, req.body, req.admin!.id) }),
);

router.delete("/regions/:id", requirePermission("records:delete"), (req, res) => {
  softDelete("regions", req.params.id, req.admin!.id);
  res.json({ success: true, data: { deleted: true } });
});

router.get("/cities", requirePermission("records:read"), (req, res) => {
  const page = listCities({ page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50, search: String(req.query.search || "") || undefined, country: String(req.query.country || "") || undefined } as PageQuery, "admin");
  res.json({ success: true, data: page.items, meta: { total: page.total, page: page.page, pages: page.pages } });
});

router.post(
  "/cities",
  requirePermission("records:write"),
  validate(z.object({ countryId: z.string().uuid(), regionId: z.string().uuid().nullable().optional(), name: z.string().trim().min(1).max(120), description: z.string().max(2000).optional(), status: z.enum(["draft", "published", "unpublished"]).optional() })),
  (req, res) => res.status(201).json({ success: true, data: createCity(req.body, req.admin!.id) }),
);

router.put(
  "/cities/:id",
  requirePermission("records:write"),
  validate(z.object({ name: z.string().trim().min(1).max(120).optional(), regionId: z.string().uuid().nullable().optional(), description: z.string().max(2000).optional(), status: z.enum(["draft", "published", "unpublished"]).optional() })),
  (req, res) => res.json({ success: true, data: updateCity(req.params.id, req.body, req.admin!.id) }),
);

router.delete("/cities/:id", requirePermission("records:delete"), (req, res) => {
  softDelete("cities", req.params.id, req.admin!.id);
  res.json({ success: true, data: { deleted: true } });
});

router.get("/area-codes", requirePermission("records:read"), (req, res) => {
  const page = listAreaCodes({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: String(req.query.search || "") || undefined,
    country: String(req.query.country || "") || undefined,
    verification: String(req.query.verification || "") || undefined,
    sort: String(req.query.sort || "") || undefined,
    order: req.query.order === "asc" ? "asc" : req.query.order === "desc" ? "desc" : undefined,
  } as PageQuery, "admin");
  res.json({ success: true, data: page.items, meta: { total: page.total, page: page.page, pages: page.pages } });
});

const areaSchema = z.object({
  countryId: z.string().uuid(),
  code: z.string().trim().min(1).max(8),
  codeType: z.string().trim().max(40).optional(),
  notes: z.string().max(2000).optional(),
  dialingInstructions: z.string().max(2000).optional(),
  nationalPrefix: z.string().max(8).nullable().optional(),
  sourceUrl: z.string().trim().max(400).optional(),
  sourceName: z.string().trim().max(160).optional(),
  regionName: z.string().trim().max(120).optional(),
  cityName: z.string().trim().max(120).optional(),
  createMissingPlaces: z.boolean().optional(),
  verificationStatus: z.enum(["pending", "verified", "outdated", "conflicting", "rejected"]).optional(),
  status: z.enum(["draft", "published", "unpublished"]).optional(),
});

router.post("/area-codes", requirePermission("records:write"), validate(areaSchema), (req, res) => {
  res.status(201).json({ success: true, data: createAreaCode(req.body, req.admin!.id) });
});

router.put(
  "/area-codes/:id",
  requirePermission("records:write"),
  validate(areaSchema.partial().omit({ countryId: true, createMissingPlaces: true, regionName: true, cityName: true, sourceUrl: true, sourceName: true })),
  (req, res) => res.json({ success: true, data: updateAreaCode(req.params.id, req.body, req.admin!.id) }),
);

router.post("/area-codes/:id/verify", requirePermission("records:verify"), (req, res) => {
  res.json({ success: true, data: setVerification(req.params.id, "verified", req.admin!.id) });
});

router.post(
  "/area-codes/:id/verification",
  requirePermission("records:verify"),
  validate(z.object({ verificationStatus: z.enum(["pending", "verified", "outdated", "conflicting", "rejected"]) })),
  (req, res) => res.json({ success: true, data: setVerification(req.params.id, req.body.verificationStatus as VerificationStatus, req.admin!.id) }),
);

router.delete("/area-codes/:id", requirePermission("records:delete"), (req, res) => {
  softDelete("areaCodes", req.params.id, req.admin!.id);
  res.json({ success: true, data: { deleted: true } });
});

function previewCountries(content: string, format: "csv" | "json") {
  const data = loadStore();
  const records = recordsFromImport(format, content);
  const seen = new Set<string>();
  return records.map((record) => {
    const values = record.values;
    const errors: string[] = [];
    const name = String(values.name || "");
    const iso2 = String(values.iso2 || "").toUpperCase();
    const iso3 = String(values.iso3 || "").toUpperCase();
    if (!name) errors.push("name is required");
    if (!/^[A-Z]{2}$/.test(iso2)) errors.push("iso2 must be two letters");
    if (!/^[A-Z]{3}$/.test(iso3)) errors.push("iso3 must be three letters");
    if (iso2 && seen.has(iso2)) errors.push("duplicate iso2 in this file");
    if (iso2) seen.add(iso2);
    if (iso2 && data.countries.some((country) => !country.deletedAt && country.iso2 === iso2)) errors.push("iso2 already exists");
    return { line: record.line, values: { name, iso2, iso3, callingCode: values.calling_code || values.callingCode || "", capital: values.capital || "", continent: values.continent || "", officialName: values.official_name || values.officialName || name }, errors };
  });
}

router.post(
  "/import/preview",
  requirePermission("import"),
  validate(z.object({ format: z.enum(["csv", "json"]), content: z.string().min(1).max(2_000_000), entity: z.enum(["countries"]).default("countries") })),
  (req, res) => {
    const rows = previewCountries(req.body.content, req.body.format);
    res.json({ success: true, data: { rows, valid: rows.filter((row) => row.errors.length === 0).length, invalid: rows.filter((row) => row.errors.length).length } });
  },
);

router.post(
  "/import/csv",
  requirePermission("import"),
  validate(z.object({ content: z.string().min(1).max(2_000_000), skipInvalid: z.boolean().default(false) })),
  (req, res) => {
    const rows = previewCountries(req.body.content, "csv");
    if (!req.body.skipInvalid && rows.some((row) => row.errors.length)) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION", message: "The file has invalid rows. Preview them, or send skipInvalid to import only the valid rows." }, details: rows.filter((row) => row.errors.length) });
    }
    const created = importCountries(
      rows.filter((row) => row.errors.length === 0).map((row) => row.values),
      req.admin!.id,
    );
    res.status(201).json({ success: true, data: { imported: created.length, records: created } });
  },
);

router.post(
  "/import/json",
  requirePermission("import"),
  validate(z.object({ content: z.string().min(1).max(2_000_000), skipInvalid: z.boolean().default(false) })),
  (req, res) => {
    const rows = previewCountries(req.body.content, "json");
    if (!req.body.skipInvalid && rows.some((row) => row.errors.length)) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION", message: "The file has invalid rows." }, details: rows.filter((row) => row.errors.length) });
    }
    const created = importCountries(rows.filter((row) => row.errors.length === 0).map((row) => row.values), req.admin!.id);
    res.status(201).json({ success: true, data: { imported: created.length, records: created } });
  },
);

router.get("/audit-logs", requirePermission("audit:read"), (req, res) => {
  const page = listAudit(Number(req.query.page) || 1, Number(req.query.limit) || 50);
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get("/search-logs", requirePermission("analytics:read"), (req, res) => {
  const page = listSearchLogs(Number(req.query.page) || 1, Number(req.query.limit) || 50);
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get("/users", requirePermission("users:read"), (_req, res) => {
  res.json({ success: true, data: listAdmins() });
});

router.post(
  "/users",
  requirePermission("*"),
  validate(z.object({ fullName: z.string().trim().min(2).max(80), email: z.string().trim().email(), password: z.string().min(10).max(200), role: z.enum(["super_admin", "admin", "editor", "reviewer", "analyst"]) })),
  (req, res) => {
    const policy = passwordPolicyError(req.body.password);
    if (policy) return res.status(400).json({ success: false, error: { code: "VALIDATION", message: policy } });
    if (req.admin!.role !== "super_admin") {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only a super admin can create administrator accounts." } });
    }
    res.status(201).json({ success: true, data: createAdminUser(req.body, req.admin!.id) });
  },
);

router.get("/settings", requirePermission("records:read"), (_req, res) => {
  res.json({ success: true, data: loadStore().settings });
});

router.put(
  "/settings",
  requirePermission("settings:write"),
  validate(z.object({
    websiteName: z.string().trim().min(2).max(80).optional(),
    seoTitle: z.string().trim().max(120).optional(),
    seoDescription: z.string().trim().max(300).optional(),
    contactEmail: z.string().trim().email().optional(),
    maintenanceMode: z.boolean().optional(),
    socialLinks: z.object({ x: z.string().max(200), github: z.string().max(200) }).optional(),
  })),
  (req, res) => res.json({ success: true, data: updateSettings(req.body, req.admin!.id) }),
);

export default router;
