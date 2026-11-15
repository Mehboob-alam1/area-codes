import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api-server";
import type { CountrySummary, ListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RegionRow { slug: string; countrySlug: string | null }
interface CityRow { slug: string; countrySlug: string | null }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticRoutes = ["", "/countries", "/area-codes", "/phone-lookup", "/compare", "/about", "/contact", "/privacy-policy", "/terms-and-conditions", "/disclaimer", "/faq", "/data-sources", "/methodology"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));
  try {
    const [countries, regions, cities] = await Promise.all([
      apiGet<ListResponse<CountrySummary>>("/countries?limit=300"),
      apiGet<ListResponse<RegionRow>>("/regions?limit=300"),
      apiGet<ListResponse<CityRow>>("/cities?limit=300"),
    ]);
    return [
      ...staticRoutes,
      ...countries.data.map((country) => ({ url: `${base}/country/${country.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...regions.data.filter((region) => region.countrySlug).map((region) => ({ url: `${base}/country/${region.countrySlug}/states/${region.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
      ...cities.data.filter((city) => city.countrySlug).map((city) => ({ url: `${base}/country/${city.countrySlug}/city/${city.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ];
  } catch {
    return staticRoutes;
  }
}
