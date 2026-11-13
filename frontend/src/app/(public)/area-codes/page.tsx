import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, VerificationBadge } from "@/components/ui";
import { AreaCodeFilters } from "@/components/area-code-filters";
import { apiGet } from "@/lib/api";
import { firstParam } from "@/lib/utils";
import type { AreaCodeRecord, ListResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Area codes", description: "Search sourced telephone area codes by country, region, city or code." };

export default async function AreaCodesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "country", "region", "city", "code"]) {
    const value = firstParam(params[key]);
    if (value) query.set(key, value);
  }
  query.set("page", firstParam(params.page) || "1");
  query.set("limit", "20");
  query.set("sort", firstParam(params.sort) || "code");
  query.set("order", firstParam(params.order) || "asc");
  let response: ListResponse<AreaCodeRecord> | null = null;
  let error = "";
  try {
    response = await apiGet(`/area-codes?${query.toString()}`);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Area codes could not be loaded.";
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Area codes</h1>
      <p className="mt-3 max-w-2xl text-muted">The same digits can belong to different countries. Each row stays attached to its own country and source.</p>
      <Suspense fallback={null}><AreaCodeFilters /></Suspense>
      {error ? <p className="mt-6 text-danger">{error}</p> : null}
      {response && response.data.length === 0 ? <div className="mt-6"><EmptyState title="No area codes match" body="Try another code or country. Records are not created to fill an empty search." /></div> : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Places</th>
              <th className="px-4 py-3 font-medium">Review</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {response?.data.map((area) => (
              <tr key={area.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-base font-semibold">{area.code}</td>
                <td className="px-4 py-3">{area.countryName}</td>
                <td className="px-4 py-3">{area.locations.map((location) => location.cityName).filter(Boolean).join(", ") || "Country-level"}</td>
                <td className="px-4 py-3"><VerificationBadge status={area.verificationStatus} /></td>
                <td className="px-4 py-3"><Link className="font-medium text-primary" href={`/area-codes/${area.code}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {response?.meta && response.meta.pages > 1 ? (
        <div className="mt-6 flex justify-between text-sm">
          <Link className={Number(query.get("page")) <= 1 ? "pointer-events-none text-muted" : "text-primary"} href={pageHref(query, Number(query.get("page")) - 1)}>Previous</Link>
          <span className="text-muted">Page {response.meta.page} of {response.meta.pages}</span>
          <Link className={Number(query.get("page")) >= response.meta.pages ? "pointer-events-none text-muted" : "text-primary"} href={pageHref(query, Number(query.get("page")) + 1)}>Next</Link>
        </div>
      ) : null}
    </div>
  );
}

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/area-codes?${next.toString()}`;
}
