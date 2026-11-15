import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/flag";
import { Breadcrumbs, Card, CopyButton, EmptyState, VerificationBadge } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/api-server";
import type { AreaCodeRecord, CityRecord, CountryRecord, CountrySummary, Faq, RegionRecord } from "@/lib/types";

interface Detail {
  country: CountryRecord;
  regions: RegionRecord[];
  cities: CityRecord[];
  areaCodes: AreaCodeRecord[];
  related: CountrySummary[];
  faqs: Faq[];
  coverage: { callingCode: boolean; geographicCodes: number; unverifiedCodes: number; citiesWithoutCodes: number };
}

async function load(slug: string) {
  try {
    return await apiGet<{ success: boolean; data: Detail }>(`/countries/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const response = await load(slug);
  if (!response) return { title: "Country not found" };
  const country = response.data.country;
  const code = country.callingCode ? ` ${country.callingCode}` : "";
  return {
    title: `${country.name} Country Calling Code${code}`,
    description: country.callingCode
      ? `Find ${country.name}'s international calling code, telephone dialing information and sourced regional numbering details.`
      : `Telephone numbering information for ${country.name}. No calling code is recorded.`,
    alternates: { canonical: `/country/${country.slug}` },
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const response = await load(slug);
  if (!response) notFound();
  const { country, regions, cities, areaCodes, related, faqs, coverage } = response.data;
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Countries", item: "/countries" }, { "@type": "ListItem", position: 2, name: country.name }] };

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/countries", label: "Countries" }, { label: country.name }]} />
      <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-center gap-4">
          <Flag src={country.flagUrl} emoji={country.flagEmoji} name={country.name} />
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{country.name}</h1>
            <p className="text-muted">{country.officialName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-4xl font-semibold text-primary">{country.callingCode || "No code"}</p>
          {country.callingCode ? <CopyButton value={country.callingCode} label="Copy code" /> : null}
        </div>
      </div>
      <p className="mt-6 max-w-3xl text-muted">{country.description}</p>
      {!coverage.callingCode || coverage.citiesWithoutCodes > 0 ? (
        <p className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          {coverage.geographicCodes} numbering {coverage.geographicCodes === 1 ? "record is" : "records are"} on file
          {coverage.unverifiedCodes ? `, ${coverage.unverifiedCodes} still unverified` : ""}.
          {coverage.citiesWithoutCodes ? ` ${coverage.citiesWithoutCodes} ${coverage.citiesWithoutCodes === 1 ? "city has" : "cities have"} no area code on file.` : ""}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["ISO codes", `${country.iso2} / ${country.iso3}`],
          ["Capital", country.capital || "Not recorded"],
          ["Continent", country.continent || "Not recorded"],
          ["Currency", country.currencyCode ? `${country.currencyCode}${country.currencyName ? ` · ${country.currencyName}` : ""}` : "Not recorded"],
          ["Languages", country.languages.length ? country.languages.join(", ") : "Not recorded"],
          ["Time zones", country.timezones.length ? country.timezones.join(", ") : "Not recorded"],
          ["Exit prefix", country.internationalPrefix || "Not recorded"],
          ["Trunk prefix", country.nationalPrefix || "Not recorded"],
        ].map(([label, value]) => (
          <Card key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </Card>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">International dialing</h2>
        <p className="mt-3 max-w-3xl text-muted">{country.numberingNotes}</p>
        {country.callingCodes.length > 1 ? <p className="mt-2 text-sm text-muted">Calling codes on file: {country.callingCodes.join(", ")}</p> : null}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Geographic area codes</h2>
        {areaCodes.length === 0 ? (
          <div className="mt-4"><EmptyState title="No area codes on file" body={`${country.name} does not have a sourced geographic area code in this directory. A blank result is intentional.`} /></div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Places</th>
                  <th className="px-4 py-3 font-medium">International format</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                </tr>
              </thead>
              <tbody>
                {areaCodes.map((area) => (
                  <tr key={area.id} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold"><Link href={`/area-codes/${area.code}`} className="text-primary">{area.code}</Link></td>
                    <td className="px-4 py-3">{area.locations.map((location) => location.cityName || location.regionName || "Country plan").filter((value, index, list) => list.indexOf(value) === index).join(", ")}</td>
                    <td className="px-4 py-3 font-mono text-xs">{area.internationalFormat}</td>
                    <td className="px-4 py-3">{area.sourceUrl ? <a href={area.sourceUrl} className="text-primary" rel="noreferrer">{area.sourceName}</a> : area.sourceName || "Not recorded"}</td>
                    <td className="px-4 py-3"><VerificationBadge status={area.verificationStatus} /><p className="mt-1 text-xs text-muted">{area.verifiedAt ? `Verified ${area.verifiedAt.slice(0, 10)}` : "No review date"}</p></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Regions</h2>
          <ul className="mt-4 space-y-2">
            {regions.length === 0 ? <li className="text-sm text-muted">No regions are on file.</li> : regions.map((region) => (
              <li key={region.id}><Link href={`/country/${country.slug}/states/${region.slug}`} className="text-primary">{region.name}</Link> <span className="text-sm text-muted">· {region.regionType.replaceAll("_", " ")}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Cities</h2>
          <ul className="mt-4 space-y-2">
            {cities.length === 0 ? <li className="text-sm text-muted">No cities are on file.</li> : cities.map((city) => (
              <li key={city.id}><Link href={`/country/${country.slug}/city/${city.slug}`} className="text-primary">{city.name}</Link></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Questions</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-2xl border border-border bg-surface px-5 py-4">
              <summary className="cursor-pointer font-medium">{faq.question}</summary>
              <p className="mt-2 text-sm text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Related countries</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {related.map((item) => <Link key={item.id} href={`/country/${item.slug}`} className="rounded-full border border-border bg-surface px-4 py-2 text-sm">{item.name} {item.callingCode || ""}</Link>)}
          </div>
        </section>
      ) : null}
    </article>
  );
}
