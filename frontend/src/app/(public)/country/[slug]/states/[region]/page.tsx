import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, EmptyState, VerificationBadge } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/api";
import type { AreaCodeRecord, CityRecord, CountrySummary } from "@/lib/types";

interface Detail {
  country: CountrySummary;
  region: { name: string; slug: string; regionType: string; description: string };
  cities: CityRecord[];
  areaCodes: AreaCodeRecord[];
  related: { id: string; name: string; slug: string }[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; region: string }> }): Promise<Metadata> {
  const { slug, region } = await params;
  try {
    const response = await apiGet<{ data: Detail }>(`/countries/${slug}/regions/${region}`);
    return { title: `${response.data.region.name}, ${response.data.country.name}`, description: `Telephone regions and sourced area codes for ${response.data.region.name}.` };
  } catch {
    return { title: "Region" };
  }
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string; region: string }> }) {
  const { slug, region } = await params;
  let detail: Detail;
  try {
    const response = await apiGet<{ data: Detail }>(`/countries/${slug}/regions/${region}`);
    detail = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: `/country/${detail.country.slug}`, label: detail.country.name }, { label: detail.region.name }]} />
      <h1 className="mt-6 text-4xl font-semibold">{detail.region.name}</h1>
      <p className="mt-2 text-muted">{detail.country.name} · {detail.region.regionType.replaceAll("_", " ")}</p>
      {detail.region.description ? <p className="mt-4 max-w-3xl">{detail.region.description}</p> : null}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Cities</h2>
        <ul className="mt-3 space-y-2">
          {detail.cities.map((city) => <li key={city.id}><Link className="text-primary" href={`/country/${detail.country.slug}/city/${city.slug}`}>{city.name}</Link></li>)}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Area codes used in this region</h2>
        {detail.areaCodes.length === 0 ? <div className="mt-4"><EmptyState title="No area codes on file" body="This region page does not invent a telephone code." /></div> : (
          <ul className="mt-4 space-y-3">
            {detail.areaCodes.map((area) => (
              <li key={area.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/area-codes/${area.code}`} className="font-mono text-xl font-semibold text-primary">{area.code}</Link>
                  <VerificationBadge status={area.verificationStatus} />
                </div>
                <p className="mt-2 text-sm text-muted">{area.notes || area.dialingInstructions}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      {detail.related.length ? (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Related regions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.related.map((item) => <Link key={item.id} href={`/country/${detail.country.slug}/states/${item.slug}`} className="rounded-full border border-border px-3 py-1 text-sm">{item.name}</Link>)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
