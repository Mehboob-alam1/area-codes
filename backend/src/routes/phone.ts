import { Router } from "express";
import { z } from "zod";
import { inspectPhone } from "../lib/phone";
import { validate } from "../middleware/validate";
import { getCountryDetail } from "../repositories/store";

const router = Router();
const phoneSchema = z.object({
  phoneNumber: z.string().trim().min(2).max(32),
  country: z.string().trim().length(2).optional(),
});

function respond(phoneNumber: string, country: string | undefined) {
  const result = inspectPhone(phoneNumber, country);
  if (!result.parsed) return result;
  const directory = result.countryIso ? getCountryDetail(result.countryIso, "public") : null;
  return { ...result, country: directory?.country.name || result.countryIso };
}

router.post("/parse", validate(phoneSchema), (req, res) => {
  res.json(respond(req.body.phoneNumber, req.body.country));
});

router.post("/validate", validate(phoneSchema), (req, res) => {
  const result = respond(req.body.phoneNumber, req.body.country);
  if (!result.parsed) return res.json(result);
  res.json({
    success: true,
    parsed: true,
    country: result.country,
    countryIso: result.countryIso,
    isPossible: result.isPossible,
    isValid: result.isValid,
    numberType: result.numberType,
    disclaimer: result.disclaimer,
  });
});

router.post("/format", validate(phoneSchema.extend({ format: z.enum(["INTERNATIONAL", "NATIONAL", "E164"]).default("INTERNATIONAL") })), (req, res) => {
  const result = respond(req.body.phoneNumber, req.body.country);
  if (!result.parsed) return res.json(result);
  const formatted = req.body.format === "NATIONAL" ? result.nationalFormat : req.body.format === "E164" ? result.e164 : result.internationalFormat;
  res.json({ success: true, parsed: true, format: req.body.format, formatted, country: result.country, disclaimer: result.disclaimer });
});

export default router;
