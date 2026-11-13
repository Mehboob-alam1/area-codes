import { Router } from "express";
import { z } from "zod";
import { searchDirectory } from "../lib/search";
import { redactSearchQuery } from "../lib/redact";
import { asyncRoute, validate } from "../middleware/validate";
import {
  addContact,
  addSearchLog,
  addSubscriber,
  getAreaCode,
  getCityDetail,
  getCountryDetail,
  getRegionDetail,
  homeStats,
  listAreaCodes,
  listCities,
  listCountries,
  listRegions,
  listSources,
  loadStore,
  publicSettings,
} from "../repositories/store";
import type { PageQuery } from "../types";

const router = Router();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(300).default(24),
  search: z.string().trim().max(80).optional(),
  continent: z.string().trim().max(40).optional(),
  letter: z.string().trim().regex(/^[a-z]$/i).optional(),
  sort: z.string().trim().max(40).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  status: z.string().trim().optional(),
  country: z.string().trim().optional(),
  region: z.string().trim().optional(),
  city: z.string().trim().optional(),
  code: z.string().trim().optional(),
  verification: z.string().trim().optional(),
  iso: z.string().trim().max(80).optional(),
});

function queryOf(value: unknown): PageQuery {
  return value as PageQuery;
}

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", service: "world-area-code-directory", dataProvider: "local-json", time: new Date().toISOString() } });
});

router.get("/settings", (_req, res) => {
  res.json({ success: true, data: publicSettings() });
});

router.get("/stats", (_req, res) => {
  res.json({ success: true, data: homeStats() });
});

router.get("/sources", (_req, res) => {
  res.json({ success: true, data: listSources() });
});

router.get("/countries", validate(listSchema, "query"), (req, res) => {
  const page = listCountries(queryOf(req.query), "public");
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get("/countries/code/:callingCode", (req, res) => {
  const wanted = req.params.callingCode.startsWith("+") ? req.params.callingCode : `+${req.params.callingCode}`;
  const page = listCountries({ page: 1, limit: 50, search: wanted }, "public");
  const exact = page.items.filter((country) => country.callingCode === wanted || country.callingCodes.includes(wanted));
  res.json({ success: true, data: exact });
});

router.get("/countries/iso/:iso2", (req, res) => {
  const detail = getCountryDetail(req.params.iso2, "public");
  if (!detail) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No published country uses that ISO code." } });
  res.json({ success: true, data: detail });
});

router.get("/countries/:slug/regions/:regionSlug", (req, res) => {
  const detail = getRegionDetail(req.params.slug, req.params.regionSlug, "public");
  if (!detail) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "That region is not published." } });
  res.json({ success: true, data: detail });
});

router.get("/countries/:slug/cities/:citySlug", (req, res) => {
  const detail = getCityDetail(req.params.slug, req.params.citySlug, "public");
  if (!detail) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "That city is not published." } });
  res.json({ success: true, data: detail });
});

router.get("/countries/:slug/regions", (req, res) => {
  const page = listRegions({ page: 1, limit: 200, country: req.params.slug }, "public");
  res.json({ success: true, data: page.items, meta: { total: page.total } });
});

router.get("/countries/:slug/cities", (req, res) => {
  const page = listCities({ page: 1, limit: 300, country: req.params.slug }, "public");
  res.json({ success: true, data: page.items, meta: { total: page.total } });
});

router.get("/countries/:slug", (req, res) => {
  const detail = getCountryDetail(req.params.slug, "public");
  if (!detail) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No published country is available at that address." } });
  res.json({ success: true, data: detail });
});

router.get("/regions", validate(listSchema, "query"), (req, res) => {
  const page = listRegions(queryOf(req.query), "public");
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get("/regions/:id/cities", (req, res) => {
  const data = loadStore();
  const region = data.regions.find((item) => item.id === req.params.id && !item.deletedAt && item.status === "published");
  if (!region) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Region not found." } });
  const country = data.countries.find((item) => item.id === region.countryId);
  const page = listCities({ page: 1, limit: 300, country: country?.slug, region: region.slug }, "public");
  res.json({ success: true, data: page.items });
});

router.get("/regions/:id/area-codes", (req, res) => {
  const data = loadStore();
  const region = data.regions.find((item) => item.id === req.params.id && !item.deletedAt);
  if (!region) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Region not found." } });
  const page = listAreaCodes({ page: 1, limit: 200, region: region.slug, country: region.countryId }, "public");
  res.json({ success: true, data: page.items });
});

router.get("/regions/:id", (req, res) => {
  const data = loadStore();
  const region = data.regions.find((item) => item.id === req.params.id && !item.deletedAt && item.status === "published");
  if (!region) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Region not found." } });
  const country = data.countries.find((item) => item.id === region.countryId);
  const detail = country ? getRegionDetail(country.slug, region.slug, "public") : null;
  res.json({ success: true, data: detail });
});

router.get("/cities/slug/:slug", (req, res) => {
  const page = listCities({ page: 1, limit: 50, search: req.params.slug }, "public");
  const exact = page.items.filter((city) => city.slug === req.params.slug);
  res.json({ success: true, data: exact });
});

router.get("/cities/:id/area-codes", (req, res) => {
  const data = loadStore();
  const city = data.cities.find((item) => item.id === req.params.id && !item.deletedAt && item.status === "published");
  if (!city) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "City not found." } });
  const page = listAreaCodes({ page: 1, limit: 100, city: city.slug, country: city.countryId }, "public");
  res.json({ success: true, data: page.items.filter((area) => area.locations.some((location) => location.cityId === city.id)) });
});

router.get("/cities/:id", (req, res) => {
  const data = loadStore();
  const city = data.cities.find((item) => item.id === req.params.id && !item.deletedAt && item.status === "published");
  if (!city) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "City not found." } });
  const country = data.countries.find((item) => item.id === city.countryId);
  const detail = country ? getCityDetail(country.slug, city.slug, "public") : null;
  res.json({ success: true, data: detail });
});

router.get("/cities", validate(listSchema, "query"), (req, res) => {
  const page = listCities(queryOf(req.query), "public");
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get("/area-codes/search", validate(listSchema, "query"), (req, res) => {
  const page = listAreaCodes(queryOf(req.query), "public");
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get("/area-codes/code/:code", (req, res) => {
  const page = listAreaCodes({ page: 1, limit: 100, code: req.params.code }, "public");
  res.json({ success: true, data: page.items, meta: { total: page.total } });
});

router.get("/area-codes/:id", (req, res) => {
  const area = getAreaCode(req.params.id, "public");
  if (!area) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Area-code record not found." } });
  res.json({ success: true, data: area });
});

router.get("/area-codes", validate(listSchema, "query"), (req, res) => {
  const page = listAreaCodes(queryOf(req.query), "public");
  res.json({ success: true, data: page.items, meta: { page: page.page, limit: page.limit, total: page.total, pages: page.pages } });
});

router.get(
  "/search",
  validate(z.object({ q: z.string().trim().min(2).max(80), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(20).default(8) }), "query"),
  (req, res) => {
    const query = req.query as unknown as { q: string; page: number; limit: number };
    const hits = searchDirectory(loadStore(), query.q);
    const start = (query.page - 1) * query.limit;
    const redacted = redactSearchQuery(query.q);
    try {
      addSearchLog(redacted.stored, redacted.searchType, hits.length);
    } catch (error) {
      console.error(error);
    }
    res.json({
      success: true,
      data: hits.slice(start, start + query.limit),
      meta: { page: query.page, limit: query.limit, total: hits.length, query: redacted.searchType === "phone" ? undefined : query.q },
    });
  },
);

router.post(
  "/newsletter",
  validate(z.object({ email: z.string().trim().email().max(160) })),
  asyncRoute((req, res) => {
    addSubscriber(req.body.email);
    res.status(201).json({ success: true, data: { subscribed: true } });
  }),
);

router.post(
  "/contact",
  validate(z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160), message: z.string().trim().min(10).max(4000) })),
  asyncRoute((req, res) => {
    const saved = addContact(req.body);
    res.status(201).json({ success: true, data: saved });
  }),
);

export default router;
