import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Flag } from "@/components/flag";
import { EmptyState } from "@/components/ui";
import { CountryFilters } from "@/components/country-filters";
import { apiGet } from "@/lib/api-server";
import { firstParam } from "@/lib/utils";
import type { CountrySummary, ListResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "All countries",
  description: "Browse country calling codes, ISO codes and capitals from the directory database.",
};

export default async function CountriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const search = firstParam(params.search);
  const continent = firstParam(params.continent);
  const letter = firstParam(params.letter);
  const sort = firstParam(params.sort) || "name";
  const order = firstParam(params.order) || "asc";
  const page = firstParam(params.page) || "1";
  if (search) query.set("search", search);
  if (continent) query.set("continent", continent);
  if (letter) query.set("letter", letter);
  query.set("sort", sort === "callingCode" ? "callingCode" : "name");
  query.set("order", order === "desc" ? "desc" : "asc");
  query.set("page", page);
  query.set("limit", "24");

  let response: ListResponse<CountrySummary> | null = null;
  let error = "";
  try {
    response = await apiGet<ListResponse<CountrySummary>>(`/countries?${query.toString()}`);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Countries could not be loaded.";
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">All countries</h1>
      <p className="mt-3 max-w-2xl text-muted">Every country record is loaded from the directory. Calling codes are reference data. City codes are a separate dataset.</p>
      <Suspense fallback={null}>
        <CountryFilters letters={letters} />
      </Suspense>
      {error ? <p className="mt-6 text-danger">{error}</p> : null}
      {response && response.data.length === 0 ? <div className="mt-6"><EmptyState title="No countries match" body="Try another name, continent or letter. The directory does not fill gaps with sample rows." /></div> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {response?.data.map((country) => (
          <article key={country.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Flag src={country.flagUrl} emoji={country.flagEmoji} name={country.name} />
              <span className="font-mono text-lg font-semibold">{country.callingCode || "—"}</span>
            </div>
            <h2 className="mt-4 font-semibold">{country.name}</h2>
            <p className="text-sm text-muted">{country.iso2} / {country.iso3}</p>
            <Link href={`/country/${country.slug}`} className="mt-4 inline-flex text-sm font-medium text-primary">View details</Link>
          </article>
        ))}
      </div>
      {response && response.meta && response.meta.pages > 1 ? (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pagination">
          <PageLink page={Math.max(1, Number(page) - 1)} params={query} disabled={Number(page) <= 1} label="Previous" />
          <span className="text-muted">Page {response.meta.page} of {response.meta.pages}</span>
          <PageLink page={Number(page) + 1} params={query} disabled={Number(page) >= response.meta.pages} label="Next" />
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({ page, params, disabled, label }: { page: number; params: URLSearchParams; disabled: boolean; label: string }) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  if (disabled) return <span className="text-muted">{label}</span>;
  return <Link href={`/countries?${next.toString()}`} className="font-medium text-primary">{label}</Link>;
}
