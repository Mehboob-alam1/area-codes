export type RecordStatus = "draft" | "published" | "unpublished";
export type VerificationStatus = "pending" | "verified" | "outdated" | "conflicting" | "rejected";
export type AdminRole = "super_admin" | "admin" | "editor" | "reviewer" | "analyst";

export interface Country {
  id: string;
  name: string;
  officialName: string;
  slug: string;
  aliases: string[];
  iso2: string;
  iso3: string;
  callingCode: string | null;
  callingCodes: string[];
  capital: string | null;
  continent: string | null;
  subregion: string | null;
  currencyCode: string | null;
  currencyName: string | null;
  currencySymbol: string | null;
  languages: string[];
  flagEmoji: string | null;
  flagUrl: string | null;
  timezones: string[];
  internationalPrefix: string | null;
  nationalPrefix: string | null;
  numberingNotes: string;
  description: string;
  sourceId: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Region {
  id: string;
  countryId: string;
  name: string;
  slug: string;
  regionType: string;
  description: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface City {
  id: string;
  countryId: string;
  regionId: string | null;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AreaCode {
  id: string;
  countryId: string;
  code: string;
  codeType: string;
  nationalPrefix: string | null;
  internationalFormat: string;
  dialingInstructions: string;
  notes: string;
  sourceId: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AreaCodeLocation {
  id: string;
  areaCodeId: string;
  countryId: string;
  regionId: string | null;
  cityId: string | null;
  createdAt: string;
}

export interface DataSource {
  id: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  license: string;
  lastCheckedAt: string | null;
  notes: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  authUserId: string | null;
  fullName: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  status: "active" | "disabled";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldData: unknown;
  newData: unknown;
  createdAt: string;
}

export interface SearchLog {
  id: string;
  searchQuery: string;
  searchType: string;
  resultCount: number;
  createdAt: string;
}

export interface StoreData {
  seedVersion: number;
  generatedAt: string;
  countries: Country[];
  regions: Region[];
  cities: City[];
  areaCodes: AreaCode[];
  areaCodeLocations: AreaCodeLocation[];
  dataSources: DataSource[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
  searchLogs: SearchLog[];
  newsletterSubscribers: { id: string; email: string; createdAt: string }[];
  contactMessages: { id: string; name: string; email: string; message: string; createdAt: string }[];
  settings: {
    websiteName: string;
    seoTitle: string;
    seoDescription: string;
    contactEmail: string;
    logoUrl: string;
    faviconUrl: string;
    socialLinks: { x: string; github: string };
    maintenanceMode: boolean;
    updatedAt: string;
  };
}

export interface PageQuery {
  page: number;
  limit: number;
  search?: string;
  continent?: string;
  letter?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: string;
  country?: string;
  region?: string;
  city?: string;
  code?: string;
  verification?: string;
  iso?: string;
  includeDeleted?: boolean;
}

export type AccessScope = "public" | "admin";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}
