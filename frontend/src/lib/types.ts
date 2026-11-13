export interface CountrySummary {
  id: string;
  name: string;
  officialName?: string;
  slug: string;
  iso2: string;
  iso3: string;
  callingCode: string | null;
  callingCodes: string[];
  capital: string | null;
  continent: string | null;
  currencyCode?: string | null;
  currencyName?: string | null;
  languages?: string[];
  flagEmoji: string | null;
  flagUrl: string | null;
  internationalPrefix?: string | null;
  nationalPrefix?: string | null;
  status?: string;
}

export interface AreaLocation {
  id: string;
  regionId: string | null;
  regionName: string | null;
  regionSlug: string | null;
  cityId: string | null;
  cityName: string | null;
  citySlug: string | null;
}

export interface AreaCodeRecord {
  id: string;
  code: string;
  codeType: string;
  nationalPrefix: string | null;
  internationalFormat: string;
  dialingInstructions: string;
  notes: string;
  verificationStatus: string;
  verifiedAt: string | null;
  status: string;
  updatedAt: string;
  countryId: string;
  countryName: string | null;
  countrySlug: string | null;
  countryIso2: string | null;
  callingCode: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  locations: AreaLocation[];
}

export interface CountryRecord extends CountrySummary {
  officialName: string;
  subregion: string | null;
  currencySymbol: string | null;
  languages: string[];
  timezones: string[];
  numberingNotes: string;
  description: string;
  internationalPrefix: string | null;
  nationalPrefix: string | null;
}

export interface RegionRecord {
  id: string;
  name: string;
  slug: string;
  regionType: string;
  description: string;
  status: string;
}

export interface CityRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  regionId: string | null;
  status: string;
}

export interface Faq { question: string; answer: string; }

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta?: { page: number; limit: number; total: number; pages: number };
}
