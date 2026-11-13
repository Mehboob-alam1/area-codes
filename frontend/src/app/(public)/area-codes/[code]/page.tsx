import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CopyButton, EmptyState, VerificationBadge } from "@/components/ui";
import { apiGet } from "@/lib/api";
import type { AreaCodeRecord } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Area code ${code}`, description: `Countries and places that have sourced records for area code ${code}. The same code can exist in more than one country.` };
}

export default async function AreaCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const response = await apiGet<{ data: AreaCodeRecord[] }>(`/area-codes/code/${encodeURIComponent(code)}`);
  if (!response.data.length) notFound();
  const grouped = new Map<string, AreaCodeRecord[]>();
  for (const area of response.data) {
    const key = area.countryName || "Unknown country";
    grouped.set(key, [...(grouped.get(key) || []), area]);
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/area-codes", label: "Area codes" }, { label: code }]} />
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-5xl font-semibold">{code}</h1>
          <p className="mt-3 max-w-2xl text-muted">This code is on file in {grouped.size} {grouped.size === 1 ? "country" : "countries"}. A match in one country does not apply to another.</p>
        </div>
        <CopyButton value={code} label="Copy code" />
      </div>
      <div className="mt-8 space-y-6">
        {[...grouped.entries()].map(([country, records]) => (
          <section key={country} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-2xl font-semibold"><Link href={`/country/${records[0].countrySlug}`} className="text-primary">{country}</Link> <span className="font-mono text-base text-muted">{records[0].callingCode}</span></h2>
            {records.map((area) => (
              <div key={area.id} className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm uppercase tracking-wide text-muted">{area.codeType.replaceAll("_", " ")}</p>
                  <VerificationBadge status={area.verificationStatus} />
                </div>
                <p className="mt-2">{area.locations.map((location) => [location.cityName, location.regionName].filter(Boolean).join(", ")).filter(Boolean).join(" · ") || "No city is attached. This is a country-level numbering record."}</p>
                <p className="mt-2 font-mono text-sm">{area.internationalFormat}</p>
                <p className="mt-2 text-sm text-muted">{area.dialingInstructions}</p>
                <p className="mt-2 text-sm">Source: {area.sourceUrl ? <a className="text-primary" href={area.sourceUrl}>{area.sourceName}</a> : area.sourceName || "Not recorded"} · {area.verifiedAt ? `Verified ${area.verifiedAt.slice(0, 10)}` : "No review date"}</p>
              </div>
            ))}
          </section>
        ))}
      </div>
      {response.data.length === 0 ? <EmptyState title="No record" body="This code is not on file." /> : null}
    </div>
  );
}
