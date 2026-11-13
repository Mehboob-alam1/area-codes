import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, EmptyState, VerificationBadge } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/api";
import type { AreaCodeRecord, CityRecord, CountrySummary, RegionRecord } from "@/lib/types";

interface Detail {
  country: CountrySummary;
  region: RegionRecord | null;
  city: CityRecord;
  areaCodes: AreaCodeRecord[];
  siblings: CityRecord[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; city: string }> }): Promise<Metadata> {
  const { slug, city } = await params;
  try {
    const response = await apiGet<{ data: Detail }>(`/countries/${slug}/cities/${city}`);
    const codes = response.data.areaCodes.map((area) => area.code);
    return {
      title: codes.length ? `${response.data.city.name} area code ${codes.join(", ")}` : `${response.data.city.name} telephone information`,
      description: codes.length
        ? `Sourced area codes for ${response.data.city.name}, ${response.data.country.name}.`
        : `No area code is on file for ${response.data.city.name}. The page does not guess one.`,
    };
  } catch {
    return { title: "City" };
  }
}

export default async function CityPage({ params }: { params: Promise<{ slug: string; city: string }> }) {
  const { slug, city } = await params;
  let detail: Detail;
  try {
    const response = await apiGet<{ data: Detail }>(`/countries/${slug}/cities/${city}`);
    detail = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: `/country/${detail.country.slug}`, label: detail.country.name }, ...(detail.region ? [{ href: `/country/${detail.country.slug}/states/${detail.region.slug}`, label: detail.region.name }] : []), { label: detail.city.name }]} />
      <h1 className="mt-6 text-4xl font-semibold">{detail.city.name}</h1>
      <p className="mt-2 text-muted">{[detail.region?.name, detail.country.name].filter(Boolean).join(", ")} · Calling code {detail.country.callingCode || "not recorded"}</p>
      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Area codes</h2>
        {detail.areaCodes.length === 0 ? (
          <div className="mt-4"><EmptyState title="No area code is on file" body={`Nothing has been verified for ${detail.city.name}. This page will not display an invented code.`} /></div>
        ) : (
          <div className="mt-4 grid gap-4">
            {detail.areaCodes.map((area) => (
              <article key={area.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/area-codes/${area.code}`} className="font-mono text-3xl font-semibold text-primary">{area.code}</Link>
                  <VerificationBadge status={area.verificationStatus} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted">International format</dt><dd className="font-mono">{area.internationalFormat}</dd></div>
                  <div><dt className="text-muted">Local dialing</dt><dd>{area.nationalPrefix ? `Trunk prefix ${area.nationalPrefix}, then ${area.code}, then the subscriber number.` : "A trunk prefix is not recorded."}</dd></div>
                  <div><dt className="text-muted">Source</dt><dd>{area.sourceUrl ? <a className="text-primary" href={area.sourceUrl}>{area.sourceName}</a> : area.sourceName || "Not recorded"}</dd></div>
                  <div><dt className="text-muted">Last verified</dt><dd>{area.verifiedAt ? area.verifiedAt.slice(0, 10) : "No review date is logged."}</dd></div>
                </dl>
                {area.notes ? <p className="mt-3 text-sm text-muted">{area.notes}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
      {detail.siblings.length ? (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Other cities in this region</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.siblings.map((item) => <Link key={item.id} className="rounded-full border border-border px-3 py-1 text-sm" href={`/country/${detail.country.slug}/city/${item.slug}`}>{item.name}</Link>)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
