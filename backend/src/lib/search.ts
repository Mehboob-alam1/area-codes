import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { StoreData } from "../types";

export interface SearchHit {
  type: "country" | "region" | "city" | "area_code" | "phone";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  code: string | null;
  score: number;
}

function textScore(query: string, value: string | null | undefined, weight: number) {
  if (!value) return 0;
  const q = query.toLowerCase();
  const v = value.toLowerCase();
  if (v === q) return 100 * weight;
  if (v.startsWith(q)) return 75 * weight;
  if (v.includes(q)) return 45 * weight;
  return 0;
}

function callingScore(query: string, callingCode: string | null) {
  if (!callingCode) return 0;
  const compact = query.replace(/\s/g, "");
  if (compact === callingCode) return 140;
  if (compact === callingCode.slice(1)) return 120;
  return 0;
}

export function searchDirectory(data: StoreData, rawQuery: string) {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  const digits = query.replace(/\D/g, "");
  const hits: SearchHit[] = [];

  if (digits.length >= 8) {
    const phone = parsePhoneNumberFromString(query);
    if (phone?.country) {
      const country = data.countries.find((item) => item.iso2 === phone.country && item.status === "published" && !item.deletedAt);
      if (country) {
        hits.push({
          type: "phone",
          id: country.id,
          title: country.name,
          subtitle: "Number format recognized. Open phone lookup for the formatted result. The full number is not stored.",
          href: "/phone-lookup",
          code: country.callingCode,
          score: 200,
        });
      }
    }
    return hits;
  }

  const numeric = /^\+?\d{2,4}$/.test(query.replace(/\s/g, ""));

  for (const country of data.countries) {
    if (country.deletedAt || country.status !== "published") continue;
    const score = Math.max(
      textScore(query, country.name, 1.2),
      textScore(query, country.officialName, 0.8),
      textScore(query, country.capital, 0.7),
      query.toLowerCase() === country.iso2.toLowerCase() ? 160 : 0,
      query.toLowerCase() === country.iso3.toLowerCase() ? 150 : 0,
      callingScore(query, country.callingCode),
      ...country.callingCodes.map((code) => callingScore(query, code)),
      ...country.aliases.map((alias) => (alias === query.toLowerCase() ? 150 : 0)),
    );
    if (score > 0) {
      hits.push({
        type: "country",
        id: country.id,
        title: country.name,
        subtitle: [country.callingCode, country.continent, country.iso2].filter(Boolean).join(" · "),
        href: `/country/${country.slug}`,
        code: country.callingCode,
        score,
      });
    }
  }

  for (const region of data.regions) {
    if (region.deletedAt || region.status !== "published") continue;
    const country = data.countries.find((item) => item.id === region.countryId);
    if (!country || country.deletedAt || country.status !== "published") continue;
    const score = textScore(query, region.name, 1);
    if (score > 0 && !numeric) {
      hits.push({
        type: "region",
        id: region.id,
        title: region.name,
        subtitle: `${country.name} · ${region.regionType.replaceAll("_", " ")}`,
        href: `/country/${country.slug}/states/${region.slug}`,
        code: null,
        score,
      });
    }
  }

  for (const city of data.cities) {
    if (city.deletedAt || city.status !== "published") continue;
    const country = data.countries.find((item) => item.id === city.countryId);
    if (!country || country.deletedAt || country.status !== "published") continue;
    const region = data.regions.find((item) => item.id === city.regionId);
    const score = textScore(query, city.name, 1.15);
    if (score > 0 && !numeric) {
      hits.push({
        type: "city",
        id: city.id,
        title: city.name,
        subtitle: [region?.name, country.name].filter(Boolean).join(", "),
        href: `/country/${country.slug}/city/${city.slug}`,
        code: null,
        score,
      });
    }
  }

  for (const area of data.areaCodes) {
    if (area.deletedAt || area.status !== "published" || area.verificationStatus === "rejected") continue;
    const compact = query.replace(/^\+/, "");
    const exact = area.code === compact;
    const prefix = compact.length >= 3 && area.code.startsWith(compact) && area.code !== compact;
    if (!exact && !prefix) continue;
    const country = data.countries.find((item) => item.id === area.countryId);
    if (!country || country.deletedAt || country.status !== "published") continue;
    const location = data.areaCodeLocations.find((item) => item.areaCodeId === area.id && item.cityId);
    const city = location ? data.cities.find((item) => item.id === location.cityId) : undefined;
    hits.push({
      type: "area_code",
      id: area.id,
      title: area.code,
      subtitle: [city?.name, country.name].filter(Boolean).join(", ") || country.name,
      href: `/area-codes/${encodeURIComponent(area.code)}`,
      code: area.code,
      score: exact ? 130 : 70,
    });
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
