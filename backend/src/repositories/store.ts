import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { env } from "../config/environment";
import { hashPassword } from "../lib/password";
import { compareValues, paginate, slugify, uniqueSlug } from "../lib/text";
import type {
  AccessScope,
  AreaCode,
  City,
  Country,
  DataSource,
  PageQuery,
  Region,
  StoreData,
  VerificationStatus,
} from "../types";

let memory: StoreData | null = null;

function persist(data: StoreData) {
  mkdirSync(path.dirname(env.dataFile), { recursive: true });
  const temporary = `${env.dataFile}.tmp`;
  writeFileSync(temporary, JSON.stringify(data));
  renameSync(temporary, env.dataFile);
}

export function loadStore() {
  if (memory) return memory;
  if (!existsSync(env.seedFile)) {
    throw new Error("The directory seed is missing. Run npm run seed from the project root.");
  }
  if (!existsSync(env.dataFile)) {
    mkdirSync(path.dirname(env.dataFile), { recursive: true });
    writeFileSync(env.dataFile, readFileSync(env.seedFile));
  }
  memory = JSON.parse(readFileSync(env.dataFile, "utf8")) as StoreData;
  if (memory.adminUsers.length === 0 && env.adminPassword) {
    memory.adminUsers.push({
      id: randomUUID(),
      authUserId: null,
      fullName: env.adminName,
      email: env.adminEmail.toLowerCase(),
      passwordHash: hashPassword(env.adminPassword),
      role: "super_admin",
      status: "active",
      createdAt: new Date().toISOString(),
    });
    persist(memory);
  }
  return memory;
}

export function transaction<T>(fn: (data: StoreData) => T) {
  const data = loadStore();
  const snapshot = structuredClone(data);
  try {
    const result = fn(data);
    memory = data;
    persist(data);
    return result;
  } catch (error) {
    memory = snapshot;
    persist(snapshot);
    throw error;
  }
}

function visible(record: { deletedAt: string | null; status: string }, scope: AccessScope) {
  if (record.deletedAt) return false;
  if (scope === "public") return record.status === "published";
  return true;
}

export function pushAudit(
  data: StoreData,
  entry: { adminId: string | null; action: string; tableName: string; recordId: string | null; oldData?: unknown; newData?: unknown },
) {
  const sanitize = (value: unknown) => {
    if (!value || typeof value !== "object") return value ?? null;
    const copy = structuredClone(value) as Record<string, unknown>;
    if ("passwordHash" in copy) copy.passwordHash = "[redacted]";
    if ("password" in copy) delete copy.password;
    return copy;
  };
  data.auditLogs.unshift({
    id: randomUUID(),
    adminId: entry.adminId,
    action: entry.action,
    tableName: entry.tableName,
    recordId: entry.recordId,
    oldData: sanitize(entry.oldData),
    newData: sanitize(entry.newData),
    createdAt: new Date().toISOString(),
  });
  if (data.auditLogs.length > 2000) data.auditLogs.length = 2000;
}

function countrySummary(country: Country) {
  return {
    id: country.id,
    name: country.name,
    officialName: country.officialName,
    slug: country.slug,
    iso2: country.iso2,
    iso3: country.iso3,
    callingCode: country.callingCode,
    callingCodes: country.callingCodes,
    capital: country.capital,
    continent: country.continent,
    currencyCode: country.currencyCode,
    currencyName: country.currencyName,
    languages: country.languages,
    flagEmoji: country.flagEmoji,
    flagUrl: country.flagUrl,
    internationalPrefix: country.internationalPrefix,
    nationalPrefix: country.nationalPrefix,
    status: country.status,
    updatedAt: country.updatedAt,
  };
}

function findCountry(data: StoreData, key: string) {
  const value = key.toLowerCase();
  return data.countries.find(
    (country) =>
      !country.deletedAt &&
      (country.slug === value ||
        country.iso2.toLowerCase() === value ||
        country.iso3.toLowerCase() === value ||
        country.aliases.includes(value) ||
        country.id === key),
  );
}

function sourceOf(data: StoreData, id: string | null) {
  return data.dataSources.find((source) => source.id === id) || null;
}

export function presentAreaCode(data: StoreData, area: AreaCode) {
  const country = data.countries.find((item) => item.id === area.countryId);
  const source = sourceOf(data, area.sourceId);
  const locations = data.areaCodeLocations
    .filter((location) => location.areaCodeId === area.id)
    .map((location) => {
      const region = data.regions.find((item) => item.id === location.regionId);
      const city = data.cities.find((item) => item.id === location.cityId);
      return {
        id: location.id,
        regionId: region?.id || null,
        regionName: region?.name || null,
        regionSlug: region?.slug || null,
        cityId: city?.id || null,
        cityName: city?.name || null,
        citySlug: city?.slug || null,
      };
    });
  return {
    id: area.id,
    code: area.code,
    codeType: area.codeType,
    nationalPrefix: area.nationalPrefix,
    internationalFormat: area.internationalFormat,
    dialingInstructions: area.dialingInstructions,
    notes: area.notes,
    verificationStatus: area.verificationStatus,
    verifiedAt: area.verifiedAt,
    status: area.status,
    updatedAt: area.updatedAt,
    countryId: area.countryId,
    countryName: country?.name || null,
    countrySlug: country?.slug || null,
    countryIso2: country?.iso2 || null,
    callingCode: country?.callingCode || null,
    sourceName: source?.sourceName || null,
    sourceUrl: source?.sourceUrl || null,
    locations,
  };
}

function matchesText(values: Array<string | null | undefined>, search: string) {
  const q = search.toLowerCase().replace(/\s+/g, "");
  return values.some((value) => value && value.toLowerCase().replace(/\s+/g, "").includes(q));
}

export function listCountries(query: PageQuery, scope: AccessScope) {
  const data = loadStore();
  let items = data.countries.filter((country) => (query.includeDeleted ? true : !country.deletedAt));
  if (scope === "public") items = items.filter((country) => country.status === "published");
  else if (query.status && query.status !== "all") items = items.filter((country) => country.status === query.status);
  if (query.continent) items = items.filter((country) => country.continent?.toLowerCase() === query.continent!.toLowerCase());
  if (query.letter) items = items.filter((country) => country.name.toLowerCase().startsWith(query.letter!.toLowerCase()));
  if (query.iso) {
    const wanted = new Set(query.iso.split(",").map((iso) => iso.trim().toUpperCase()));
    items = items.filter((country) => wanted.has(country.iso2));
  }
  if (query.search) {
    items = items.filter((country) =>
      matchesText(
        [country.name, country.officialName, country.iso2, country.iso3, country.capital, country.callingCode, ...country.callingCodes],
        query.search!,
      ),
    );
  }
  const sort = query.sort || "name";
  const order = query.order || "asc";
  items.sort((a, b) => {
    if (sort === "callingCode") return compareValues(a.callingCode, b.callingCode, order);
    if (sort === "updatedAt") return compareValues(a.updatedAt, b.updatedAt, order);
    return compareValues(a.name, b.name, order);
  });
  const page = paginate(items, query.page, query.limit);
  return { ...page, items: page.items.map(countrySummary) };
}

function countryFaqs(country: Country, areaCount: number) {
  const calling = country.callingCodes.length ? country.callingCodes.join(", ") : null;
  return [
    {
      question: calling ? `What is the calling code for ${country.name}?` : `Does ${country.name} have a calling code?`,
      answer: calling
        ? `${country.name} is listed with international calling code ${calling}.`
        : `No international calling code is recorded for ${country.name}.`,
    },
    {
      question: `How do I call ${country.name}?`,
      answer: calling
        ? `Dial your international exit prefix, then ${calling.replaceAll("+", "")}, then the national number. ${
            country.nationalPrefix
              ? `Omit trunk prefix ${country.nationalPrefix} when calling from abroad.`
              : "A trunk prefix is not recorded for this country."
          } ${country.internationalPrefix ? `Calls from ${country.name} commonly use exit prefix ${country.internationalPrefix}.` : "The exit prefix used inside this country is not recorded."}`
        : `An international format is not available because no calling code is recorded.`,
    },
    {
      question: `Does ${country.name} use geographic area codes?`,
      answer: areaCount
        ? `${areaCount} numbering ${areaCount === 1 ? "record is" : "records are"} on file. A code is shown only with its source, and unverified records stay labeled.`
        : `No geographic area codes are on file for ${country.name}. This directory does not invent one.`,
    },
  ];
}

export function getCountryDetail(key: string, scope: AccessScope) {
  const data = loadStore();
  const country = findCountry(data, key);
  if (!country || !visible(country, scope)) return null;
  const regions = data.regions.filter((region) => region.countryId === country.id && visible(region, scope));
  const cities = data.cities.filter((city) => city.countryId === country.id && visible(city, scope));
  const areaCodes = data.areaCodes
    .filter((area) => area.countryId === country.id && visible(area, scope) && (scope === "admin" || area.verificationStatus !== "rejected"))
    .map((area) => presentAreaCode(data, area))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const related = data.countries
    .filter((item) => item.id !== country.id && item.continent === country.continent && visible(item, "public"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 6)
    .map(countrySummary);
  const sourceIds = new Set([country.sourceId, ...data.areaCodes.filter((area) => area.countryId === country.id).map((area) => area.sourceId)].filter(Boolean));
  return {
    country: { ...country, deletedAt: undefined },
    regions,
    cities,
    areaCodes,
    related,
    faqs: countryFaqs(country, areaCodes.length),
    sources: data.dataSources.filter((source) => sourceIds.has(source.id)),
    coverage: {
      callingCode: Boolean(country.callingCode),
      internationalPrefix: Boolean(country.internationalPrefix),
      nationalPrefix: country.nationalPrefix !== null && country.nationalPrefix !== undefined,
      geographicCodes: areaCodes.length,
      unverifiedCodes: areaCodes.filter((area) => area.verificationStatus !== "verified").length,
      citiesWithoutCodes: cities.filter((city) => !areaCodes.some((area) => area.locations.some((location) => location.cityId === city.id))).length,
    },
  };
}

export function getRegionDetail(countryKey: string, regionSlug: string, scope: AccessScope) {
  const data = loadStore();
  const country = findCountry(data, countryKey);
  if (!country || !visible(country, scope)) return null;
  const region = data.regions.find((item) => item.countryId === country.id && item.slug === regionSlug && visible(item, scope));
  if (!region) return null;
  const cities = data.cities.filter((city) => city.regionId === region.id && visible(city, scope));
  const areaCodes = data.areaCodes
    .filter((area) => visible(area, scope) && data.areaCodeLocations.some((location) => location.areaCodeId === area.id && location.regionId === region.id))
    .map((area) => presentAreaCode(data, area));
  const related = data.regions
    .filter((item) => item.countryId === country.id && item.id !== region.id && visible(item, scope))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);
  return { country: countrySummary(country), region, cities, areaCodes, related };
}

export function getCityDetail(countryKey: string, citySlug: string, scope: AccessScope) {
  const data = loadStore();
  const country = findCountry(data, countryKey);
  if (!country || !visible(country, scope)) return null;
  const matches = data.cities.filter((city) => city.countryId === country.id && city.slug === citySlug && visible(city, scope));
  const city = matches[0];
  if (!city) return null;
  const region = data.regions.find((item) => item.id === city.regionId) || null;
  const areaCodes = data.areaCodes
    .filter((area) => visible(area, scope) && data.areaCodeLocations.some((location) => location.areaCodeId === area.id && location.cityId === city.id))
    .map((area) => presentAreaCode(data, area));
  const siblings = data.cities
    .filter((item) => item.regionId === city.regionId && item.id !== city.id && visible(item, scope))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { country: countrySummary(country), region, city, areaCodes, siblings, ambiguous: matches.length > 1 };
}

export function listRegions(query: PageQuery, scope: AccessScope) {
  const data = loadStore();
  let items = data.regions.filter((region) => visible(region, scope) || (scope === "admin" && query.includeDeleted));
  if (scope === "admin" && !query.includeDeleted) items = items.filter((region) => !region.deletedAt);
  if (query.country) {
    const country = findCountry(data, query.country);
    items = country ? items.filter((region) => region.countryId === country.id) : [];
  }
  if (query.search) items = items.filter((region) => matchesText([region.name, region.regionType], query.search!));
  items.sort((a, b) => compareValues(a.name, b.name, query.order || "asc"));
  const page = paginate(items, query.page, query.limit);
  return {
    ...page,
    items: page.items.map((region) => ({
      ...region,
      countryName: data.countries.find((country) => country.id === region.countryId)?.name || null,
      countrySlug: data.countries.find((country) => country.id === region.countryId)?.slug || null,
    })),
  };
}

export function listCities(query: PageQuery, scope: AccessScope) {
  const data = loadStore();
  let items = data.cities.filter((city) => (scope === "public" ? visible(city, scope) : query.includeDeleted || !city.deletedAt));
  if (scope === "admin" && query.status && query.status !== "all") items = items.filter((city) => city.status === query.status);
  if (query.country) {
    const country = findCountry(data, query.country);
    items = country ? items.filter((city) => city.countryId === country.id) : [];
  }
  if (query.region) items = items.filter((city) => data.regions.find((region) => region.id === city.regionId)?.slug === query.region);
  if (query.search) items = items.filter((city) => matchesText([city.name], query.search!));
  items.sort((a, b) => compareValues(a.name, b.name, query.order || "asc"));
  const page = paginate(items, query.page, query.limit);
  return {
    ...page,
    items: page.items.map((city) => {
      const country = data.countries.find((item) => item.id === city.countryId);
      const region = data.regions.find((item) => item.id === city.regionId);
      return { ...city, countryName: country?.name || null, countrySlug: country?.slug || null, regionName: region?.name || null, regionSlug: region?.slug || null };
    }),
  };
}

export function listAreaCodes(query: PageQuery, scope: AccessScope) {
  const data = loadStore();
  let items = data.areaCodes.filter((area) => (scope === "public" ? visible(area, "public") && area.verificationStatus !== "rejected" : query.includeDeleted || !area.deletedAt));
  if (query.country) {
    const country = findCountry(data, query.country);
    items = country ? items.filter((area) => area.countryId === country.id) : [];
  }
  if (query.region) {
    items = items.filter((area) =>
      data.areaCodeLocations.some((location) => location.areaCodeId === area.id && data.regions.find((region) => region.id === location.regionId)?.slug === query.region),
    );
  }
  if (query.city) {
    items = items.filter((area) =>
      data.areaCodeLocations.some((location) => location.areaCodeId === area.id && data.cities.find((city) => city.id === location.cityId)?.slug === query.city),
    );
  }
  if (query.code) items = items.filter((area) => area.code === query.code);
  if (query.verification) items = items.filter((area) => area.verificationStatus === query.verification);
  if (query.search) items = items.filter((area) => matchesText([area.code, area.notes, area.codeType], query.search!));
  const sort = query.sort || "code";
  items.sort((a, b) => {
    if (sort === "updatedAt") return compareValues(a.updatedAt, b.updatedAt, query.order || "desc");
    if (sort === "country") {
      const left = data.countries.find((country) => country.id === a.countryId)?.name || "";
      const right = data.countries.find((country) => country.id === b.countryId)?.name || "";
      return compareValues(left, right, query.order || "asc");
    }
    return compareValues(a.code, b.code, query.order || "asc");
  });
  const page = paginate(items, query.page, query.limit);
  return { ...page, items: page.items.map((area) => presentAreaCode(data, area)) };
}

export function getAreaCode(id: string, scope: AccessScope) {
  const data = loadStore();
  const area = data.areaCodes.find((item) => item.id === id);
  if (!area || (scope === "public" ? !visible(area, "public") || area.verificationStatus === "rejected" : false)) return null;
  return presentAreaCode(data, area);
}

export function listSources() {
  return loadStore().dataSources;
}

export function publicSettings() {
  const settings = loadStore().settings;
  return {
    websiteName: settings.websiteName,
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    contactEmail: settings.contactEmail,
    maintenanceMode: settings.maintenanceMode,
    socialLinks: settings.socialLinks,
  };
}

const popularIso = ["US", "GB", "PK", "IN", "CA", "AU", "AE", "DE", "FR", "CN", "JP", "BR"];

export function homeStats() {
  const data = loadStore();
  const publishedCountries = data.countries.filter((country) => visible(country, "public"));
  const continents = new Map<string, number>();
  for (const country of publishedCountries) {
    if (!country.continent) continue;
    continents.set(country.continent, (continents.get(country.continent) || 0) + 1);
  }
  const recent = [...data.areaCodes]
    .filter((area) => visible(area, "public") && area.verificationStatus !== "rejected")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)
    .map((area) => presentAreaCode(data, area));
  return {
    countries: publishedCountries.length,
    callingCodes: publishedCountries.filter((country) => country.callingCode).length,
    regions: data.regions.filter((region) => visible(region, "public")).length,
    cities: data.cities.filter((city) => visible(city, "public")).length,
    areaCodes: data.areaCodes.filter((area) => visible(area, "public")).length,
    continents: [...continents.entries()].map(([name, countries]) => ({ name, countries })).sort((a, b) => a.name.localeCompare(b.name)),
    popular: popularIso.map((iso) => publishedCountries.find((country) => country.iso2 === iso)).filter(Boolean).map((country) => countrySummary(country!)),
    recentAreaCodes: recent,
  };
}

export function dashboardStats() {
  const data = loadStore();
  const active = <T extends { deletedAt: string | null }>(items: T[]) => items.filter((item) => !item.deletedAt);
  const countries = active(data.countries);
  const areaCodes = active(data.areaCodes);
  const days = new Map<string, number>();
  for (const log of data.searchLogs) {
    const day = log.createdAt.slice(0, 10);
    days.set(day, (days.get(day) || 0) + 1);
  }
  return {
    countries: countries.length,
    regions: active(data.regions).length,
    cities: active(data.cities).length,
    areaCodes: areaCodes.length,
    published: [...countries, ...active(data.regions), ...active(data.cities), ...areaCodes].filter((item) => item.status === "published").length,
    drafts: [...countries, ...active(data.regions), ...active(data.cities), ...areaCodes].filter((item) => item.status === "draft").length,
    awaitingVerification: areaCodes.filter((area) => area.verificationStatus === "pending").length,
    recent: [...areaCodes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8).map((area) => presentAreaCode(data, area)),
    searchRequests: data.searchLogs.length,
    searchesByDay: [...days.entries()].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day)).slice(-14),
  };
}

export function addSearchLog(stored: string, searchType: string, resultCount: number) {
  transaction((data) => {
    data.searchLogs.unshift({ id: randomUUID(), searchQuery: stored, searchType, resultCount, createdAt: new Date().toISOString() });
    if (data.searchLogs.length > 5000) data.searchLogs.length = 5000;
  });
}

export function listAudit(page: number, limit: number) {
  const pageResult = paginate(loadStore().auditLogs, page, limit);
  return pageResult;
}

export function listSearchLogs(page: number, limit: number) {
  return paginate(loadStore().searchLogs, page, limit);
}

export function findAdminByEmail(email: string) {
  return loadStore().adminUsers.find((admin) => admin.email === email.toLowerCase()) || null;
}

export function findAdminById(id: string) {
  return loadStore().adminUsers.find((admin) => admin.id === id) || null;
}

export function publicAdmin(admin: StoreData["adminUsers"][number]) {
  return { id: admin.id, fullName: admin.fullName, email: admin.email, role: admin.role, status: admin.status, createdAt: admin.createdAt };
}

export function listAdmins() {
  return loadStore().adminUsers.map(publicAdmin);
}

function now() {
  return new Date().toISOString();
}

export function createCountry(input: Partial<Country> & { name: string; iso2: string; iso3: string }, adminId: string) {
  return transaction((data) => {
    if (data.countries.some((country) => !country.deletedAt && country.iso2.toLowerCase() === input.iso2.toLowerCase())) {
      throw Object.assign(new Error("A country with that ISO alpha-2 code already exists."), { status: 409 });
    }
    const country: Country = {
      id: randomUUID(),
      name: input.name.trim(),
      officialName: input.officialName?.trim() || input.name.trim(),
      slug: uniqueSlug(data.countries.filter((item) => !item.deletedAt).map((item) => item.slug), input.slug || input.name),
      aliases: input.aliases || [],
      iso2: input.iso2.toUpperCase(),
      iso3: input.iso3.toUpperCase(),
      callingCode: input.callingCode || null,
      callingCodes: input.callingCodes?.length ? input.callingCodes : input.callingCode ? [input.callingCode] : [],
      capital: input.capital || null,
      continent: input.continent || null,
      subregion: input.subregion || null,
      currencyCode: input.currencyCode || null,
      currencyName: input.currencyName || null,
      currencySymbol: input.currencySymbol || null,
      languages: input.languages || [],
      flagEmoji: input.flagEmoji || null,
      flagUrl: input.flagUrl || `https://flagcdn.com/w160/${input.iso2.toLowerCase()}.png`,
      timezones: input.timezones || [],
      internationalPrefix: input.internationalPrefix || null,
      nationalPrefix: input.nationalPrefix ?? null,
      numberingNotes: input.numberingNotes || "A verified national numbering-plan summary has not been added for this record yet.",
      description: input.description || "",
      sourceId: input.sourceId || null,
      status: input.status || "draft",
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null,
    };
    data.countries.push(country);
    pushAudit(data, { adminId, action: "create", tableName: "countries", recordId: country.id, newData: country });
    return country;
  });
}

export function updateCountry(id: string, input: Partial<Country>, adminId: string) {
  return transaction((data) => {
    const country = data.countries.find((item) => item.id === id && !item.deletedAt);
    if (!country) throw Object.assign(new Error("Country not found."), { status: 404 });
    const old = structuredClone(country);
    Object.assign(country, input, { id: country.id, updatedAt: now(), deletedAt: null });
    if (input.iso2) country.iso2 = input.iso2.toUpperCase();
    if (input.iso3) country.iso3 = input.iso3.toUpperCase();
    if (input.slug) country.slug = slugify(input.slug);
    pushAudit(data, { adminId, action: "update", tableName: "countries", recordId: id, oldData: old, newData: country });
    return country;
  });
}

export function softDelete(collection: "countries" | "regions" | "cities" | "areaCodes", id: string, adminId: string) {
  return transaction((data) => {
    const record = data[collection].find((item) => item.id === id && !item.deletedAt);
    if (!record) throw Object.assign(new Error("Record not found."), { status: 404 });
    const old = structuredClone(record);
    record.deletedAt = now();
    record.status = "unpublished";
    record.updatedAt = now();
    pushAudit(data, { adminId, action: "delete", tableName: collection, recordId: id, oldData: old, newData: record });
    return record;
  });
}

export function createRegion(input: { countryId: string; name: string; regionType: string; description?: string; status?: Country["status"] }, adminId: string) {
  return transaction((data) => {
    const country = data.countries.find((item) => item.id === input.countryId && !item.deletedAt);
    if (!country) throw Object.assign(new Error("Country not found."), { status: 404 });
    const region: Region = {
      id: randomUUID(),
      countryId: country.id,
      name: input.name.trim(),
      slug: uniqueSlug(data.regions.filter((item) => item.countryId === country.id && !item.deletedAt).map((item) => item.slug), input.name),
      regionType: slugify(input.regionType).replaceAll("-", "_") || "region",
      description: input.description || "",
      status: input.status || "draft",
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null,
    };
    data.regions.push(region);
    pushAudit(data, { adminId, action: "create", tableName: "regions", recordId: region.id, newData: region });
    return region;
  });
}

export function updateRegion(id: string, input: Partial<Region>, adminId: string) {
  return transaction((data) => {
    const region = data.regions.find((item) => item.id === id && !item.deletedAt);
    if (!region) throw Object.assign(new Error("Region not found."), { status: 404 });
    const old = structuredClone(region);
    if (input.name) region.name = input.name;
    if (input.regionType) region.regionType = input.regionType;
    if (input.description !== undefined) region.description = input.description;
    if (input.status) region.status = input.status;
    region.updatedAt = now();
    pushAudit(data, { adminId, action: "update", tableName: "regions", recordId: id, oldData: old, newData: region });
    return region;
  });
}

export function createCity(input: { countryId: string; regionId?: string | null; name: string; description?: string; status?: Country["status"] }, adminId: string) {
  return transaction((data) => {
    const country = data.countries.find((item) => item.id === input.countryId && !item.deletedAt);
    if (!country) throw Object.assign(new Error("Country not found."), { status: 404 });
    if (input.regionId && !data.regions.some((region) => region.id === input.regionId && region.countryId === country.id && !region.deletedAt)) {
      throw Object.assign(new Error("Region not found for that country."), { status: 404 });
    }
    const city: City = {
      id: randomUUID(),
      countryId: country.id,
      regionId: input.regionId || null,
      name: input.name.trim(),
      slug: uniqueSlug(
        data.cities.filter((item) => item.countryId === country.id && !item.deletedAt).map((item) => item.slug),
        input.name,
      ),
      latitude: null,
      longitude: null,
      description: input.description || "",
      status: input.status || "draft",
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null,
    };
    data.cities.push(city);
    pushAudit(data, { adminId, action: "create", tableName: "cities", recordId: city.id, newData: city });
    return city;
  });
}

export function updateCity(id: string, input: Partial<City>, adminId: string) {
  return transaction((data) => {
    const city = data.cities.find((item) => item.id === id && !item.deletedAt);
    if (!city) throw Object.assign(new Error("City not found."), { status: 404 });
    const old = structuredClone(city);
    if (input.name) city.name = input.name;
    if (input.description !== undefined) city.description = input.description;
    if (input.status) city.status = input.status;
    if (input.regionId !== undefined) city.regionId = input.regionId;
    city.updatedAt = now();
    pushAudit(data, { adminId, action: "update", tableName: "cities", recordId: id, oldData: old, newData: city });
    return city;
  });
}

function ensurePlace(data: StoreData, countryId: string, regionName?: string, cityName?: string, createMissing?: boolean) {
  let regionId: string | null = null;
  let cityId: string | null = null;
  if (regionName) {
    const slug = slugify(regionName);
    let region = data.regions.find((item) => item.countryId === countryId && item.slug === slug && !item.deletedAt);
    if (!region && createMissing) {
      region = {
        id: randomUUID(),
        countryId,
        name: regionName.trim(),
        slug,
        regionType: "region",
        description: "",
        status: "published",
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null,
      };
      data.regions.push(region);
    }
    if (!region) throw Object.assign(new Error(`Region "${regionName}" is not in the directory. Confirm creation to add it.`), { status: 400 });
    regionId = region.id;
  }
  if (cityName) {
    const slug = slugify(cityName);
    let city = data.cities.find((item) => item.countryId === countryId && item.slug === slug && !item.deletedAt);
    if (!city && createMissing) {
      city = {
        id: randomUUID(),
        countryId,
        regionId,
        name: cityName.trim(),
        slug: uniqueSlug(data.cities.filter((item) => item.countryId === countryId && !item.deletedAt).map((item) => item.slug), cityName),
        latitude: null,
        longitude: null,
        description: "",
        status: "published",
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null,
      };
      data.cities.push(city);
    }
    if (!city) throw Object.assign(new Error(`City "${cityName}" is not in the directory. Confirm creation to add it.`), { status: 400 });
    cityId = city.id;
    if (!regionId) regionId = city.regionId;
  }
  return { regionId, cityId };
}

export function createAreaCode(
  input: {
    countryId: string;
    code: string;
    codeType?: string;
    notes?: string;
    nationalPrefix?: string | null;
    dialingInstructions?: string;
    sourceUrl?: string;
    sourceName?: string;
    regionName?: string;
    cityName?: string;
    createMissingPlaces?: boolean;
    verificationStatus?: VerificationStatus;
    status?: Country["status"];
  },
  adminId: string,
) {
  return transaction((data) => {
    const country = data.countries.find((item) => item.id === input.countryId && !item.deletedAt);
    if (!country) throw Object.assign(new Error("Country not found."), { status: 404 });
    const code = input.code.trim();
    if (data.areaCodes.some((area) => area.countryId === country.id && area.code === code && !area.deletedAt)) {
      throw Object.assign(new Error("That code already exists for this country. Add another location to the existing record instead of creating a duplicate."), { status: 409 });
    }
    const place = ensurePlace(data, country.id, input.regionName, input.cityName, input.createMissingPlaces);
    let sourceId: string | null = null;
    if (input.sourceUrl || input.sourceName) {
      const source: DataSource = {
        id: randomUUID(),
        sourceName: input.sourceName || "Admin source",
        sourceUrl: input.sourceUrl || "",
        sourceType: "admin",
        license: "",
        lastCheckedAt: now(),
        notes: "",
        createdAt: now(),
      };
      data.dataSources.push(source);
      sourceId = source.id;
    }
    const area: AreaCode = {
      id: randomUUID(),
      countryId: country.id,
      code,
      codeType: input.codeType || "geographic",
      nationalPrefix: input.nationalPrefix ?? country.nationalPrefix,
      internationalFormat: `${country.callingCode || "+"} ${code} [subscriber number]`,
      dialingInstructions: input.dialingInstructions || "Dial the recorded code before the subscriber number. Do not invent a code when this field is empty.",
      notes: input.notes || "",
      sourceId,
      verificationStatus: input.verificationStatus || "pending",
      verifiedAt: input.verificationStatus === "verified" ? now() : null,
      status: input.status || "draft",
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null,
    };
    data.areaCodes.push(area);
    if (place.regionId || place.cityId || (!input.regionName && !input.cityName)) {
      data.areaCodeLocations.push({
        id: randomUUID(),
        areaCodeId: area.id,
        countryId: country.id,
        regionId: place.regionId,
        cityId: place.cityId,
        createdAt: now(),
      });
    }
    pushAudit(data, { adminId, action: "create", tableName: "area_codes", recordId: area.id, newData: area });
    return presentAreaCode(data, area);
  });
}

export function updateAreaCode(id: string, input: Partial<AreaCode> & { verificationStatus?: VerificationStatus }, adminId: string) {
  return transaction((data) => {
    const area = data.areaCodes.find((item) => item.id === id && !item.deletedAt);
    if (!area) throw Object.assign(new Error("Area code not found."), { status: 404 });
    const old = structuredClone(area);
    if (input.code) area.code = input.code.trim();
    if (input.codeType) area.codeType = input.codeType;
    if (input.notes !== undefined) area.notes = input.notes;
    if (input.dialingInstructions !== undefined) area.dialingInstructions = input.dialingInstructions;
    if (input.nationalPrefix !== undefined) area.nationalPrefix = input.nationalPrefix;
    if (input.status) area.status = input.status;
    if (input.verificationStatus) {
      area.verificationStatus = input.verificationStatus;
      area.verifiedAt = input.verificationStatus === "verified" ? now() : area.verifiedAt;
    }
    area.updatedAt = now();
    pushAudit(data, { adminId, action: "update", tableName: "area_codes", recordId: id, oldData: old, newData: area });
    return presentAreaCode(data, area);
  });
}

export function setVerification(id: string, status: VerificationStatus, adminId: string) {
  return updateAreaCode(id, { verificationStatus: status }, adminId);
}

export function updateSettings(input: Partial<StoreData["settings"]>, adminId: string) {
  return transaction((data) => {
    const old = structuredClone(data.settings);
    data.settings = { ...data.settings, ...input, updatedAt: now() };
    pushAudit(data, { adminId, action: "update", tableName: "settings", recordId: null, oldData: old, newData: data.settings });
    return publicSettings();
  });
}

export function addSubscriber(email: string) {
  return transaction((data) => {
    const existing = data.newsletterSubscribers.find((item) => item.email === email.toLowerCase());
    if (existing) return existing;
    const subscriber = { id: randomUUID(), email: email.toLowerCase(), createdAt: now() };
    data.newsletterSubscribers.push(subscriber);
    return subscriber;
  });
}

export function addContact(input: { name: string; email: string; message: string }) {
  return transaction((data) => {
    const message = { id: randomUUID(), name: input.name.trim(), email: input.email.toLowerCase(), message: input.message.trim(), createdAt: now() };
    data.contactMessages.push(message);
    return { id: message.id, createdAt: message.createdAt };
  });
}

export function createAdminUser(input: { fullName: string; email: string; password: string; role: StoreData["adminUsers"][number]["role"] }, adminId: string) {
  return transaction((data) => {
    if (data.adminUsers.some((admin) => admin.email === input.email.toLowerCase())) {
      throw Object.assign(new Error("An administrator with that email already exists."), { status: 409 });
    }
    const admin = {
      id: randomUUID(),
      authUserId: null,
      fullName: input.fullName.trim(),
      email: input.email.toLowerCase(),
      passwordHash: hashPassword(input.password),
      role: input.role,
      status: "active" as const,
      createdAt: now(),
    };
    data.adminUsers.push(admin);
    pushAudit(data, { adminId, action: "create", tableName: "admin_users", recordId: admin.id, newData: publicAdmin(admin) });
    return publicAdmin(admin);
  });
}

export function countriesToCsv() {
  const header = ["name", "official_name", "iso2", "iso3", "calling_code", "capital", "continent", "status"];
  const rows = loadStore().countries.filter((country) => !country.deletedAt).map((country) =>
    [country.name, country.officialName, country.iso2, country.iso3, country.callingCode || "", country.capital || "", country.continent || "", country.status]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function importCountries(
  rows: Array<{ name?: string; iso2?: string; iso3?: string; callingCode?: string; capital?: string; continent?: string; officialName?: string }>,
  adminId: string,
) {
  return transaction((data) => {
    const created: Country[] = [];
    for (const row of rows) {
      if (!row.name || !row.iso2 || !row.iso3) continue;
      if (data.countries.some((country) => !country.deletedAt && country.iso2.toLowerCase() === row.iso2!.toLowerCase())) continue;
      const country: Country = {
        id: randomUUID(),
        name: row.name,
        officialName: row.officialName || row.name,
        slug: uniqueSlug(data.countries.map((item) => item.slug), row.name),
        aliases: [],
        iso2: row.iso2.toUpperCase(),
        iso3: row.iso3.toUpperCase(),
        callingCode: row.callingCode || null,
        callingCodes: row.callingCode ? [row.callingCode] : [],
        capital: row.capital || null,
        continent: row.continent || null,
        subregion: null,
        currencyCode: null,
        currencyName: null,
        currencySymbol: null,
        languages: [],
        flagEmoji: null,
        flagUrl: `https://flagcdn.com/w160/${row.iso2.toLowerCase()}.png`,
        timezones: [],
        internationalPrefix: null,
        nationalPrefix: null,
        numberingNotes: "Imported without a numbering-plan summary.",
        description: "",
        sourceId: null,
        status: "draft",
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null,
      };
      data.countries.push(country);
      created.push(country);
    }
    pushAudit(data, { adminId, action: "import", tableName: "countries", recordId: null, newData: { count: created.length } });
    return created.map(countrySummary);
  });
}
