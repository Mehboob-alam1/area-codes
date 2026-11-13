import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { Flag } from "@/components/flag";
import { Card, VerificationBadge } from "@/components/ui";
import { apiGet } from "@/lib/api";
import type { AreaCodeRecord, CountrySummary } from "@/lib/types";
import { NewsletterForm } from "@/components/newsletter-form";

interface Stats {
  countries: number;
  callingCodes: number;
  regions: number;
  cities: number;
  areaCodes: number;
  continents: { name: string; countries: number }[];
  popular: CountrySummary[];
  recentAreaCodes: AreaCodeRecord[];
}

const steps = [
  { title: "Exit prefix", body: "The prefix that reaches an international line depends on the country and sometimes the carrier. It is not the same as the country calling code." },
  { title: "Country calling code", body: "Dial the destination country code, such as 92 for Pakistan or 44 for the United Kingdom, without the plus sign." },
  { title: "National number", body: "Then dial the area code, if that country uses one, and the subscriber number. Drop the national trunk prefix on an international call." },
];

const faqs = [
  { q: "Is a country calling code the same as an area code?", a: "No. A country calling code identifies the country in the international plan, such as +92. An area code identifies a region inside a national plan, and many countries do not use one." },
  { q: "Why is a city page missing an area code?", a: "The directory leaves the field blank when no sourced record exists. It does not guess a code from the city name." },
  { q: "Does a valid phone format mean the number is active?", a: "No. Format checks use numbering metadata. They do not show whether a number is assigned, working, or owned by a particular person." },
];

export default async function HomePage() {
  let stats: Stats | null = null;
  let error = "";
  try {
    const response = await apiGet<{ success: boolean; data: Stats }>("/stats");
    stats = response.data;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "The directory is unavailable.";
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "World Area Code Directory",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/countries?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium text-primary">Worldwide telephone numbering</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">Find Any Country&apos;s Telephone Area Code</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">Explore international calling codes, city area codes, regional dialing prefixes and telephone numbering information worldwide.</p>
          <div className="mt-8 max-w-2xl"><SearchBox large /></div>
          <p className="mt-4 max-w-2xl text-sm text-muted">Country calling codes come from a reference dataset. A city or regional code appears only when a sourced record is on file. Missing codes stay blank.</p>
        </div>
      </section>

      {error ? <p className="mx-auto max-w-6xl px-4 py-8 text-danger">{error}</p> : null}

      {stats ? (
        <>
          <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Countries", stats.countries],
              ["Calling codes", stats.callingCodes],
              ["Regions and cities", stats.regions + stats.cities],
              ["Area-code records", stats.areaCodes],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
              </Card>
            ))}
          </section>

          <section className="mx-auto max-w-6xl px-4 py-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold">Popular country calling codes</h2>
              <Link href="/countries" className="text-sm font-medium text-primary">All countries</Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.popular.map((country) => (
                <Link key={country.id} href={`/country/${country.slug}`} className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary">
                  <div className="flex items-center justify-between">
                    <Flag src={country.flagUrl} emoji={country.flagEmoji} name={country.name} />
                    <span className="font-mono text-xl font-semibold text-primary">{country.callingCode || "—"}</span>
                  </div>
                  <p className="mt-4 font-semibold">{country.name}</p>
                  <p className="text-sm text-muted">{country.iso2} · {country.capital || "Capital not recorded"}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-6">
            <h2 className="text-2xl font-semibold">Browse by continent</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.continents.map((continent) => (
                <Link key={continent.name} href={`/countries?continent=${encodeURIComponent(continent.name)}`} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 hover:border-primary">
                  <span className="font-medium">{continent.name}</span>
                  <span className="text-sm text-muted">{continent.countries} countries</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-6">
            <h2 className="text-2xl font-semibold">Recently updated area codes</h2>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAreaCodes.map((area) => (
                    <tr key={area.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono font-semibold"><Link href={`/area-codes/${area.code}`} className="text-primary">{area.code}</Link></td>
                      <td className="px-4 py-3">{area.locations.map((location) => location.cityName).filter(Boolean).join(", ") || "Country-level record"}</td>
                      <td className="px-4 py-3">{area.countryName}</td>
                      <td className="px-4 py-3"><VerificationBadge status={area.verificationStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.title}>
            <p className="font-mono text-sm text-primary">0{index + 1}</p>
            <h2 className="mt-3 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-muted">{step.body}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <Card className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Check a phone number format</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">Parse, format and validate a number against numbering metadata. The result does not identify the subscriber.</p>
          </div>
          <Link href="/phone-lookup" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">Open phone lookup</Link>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="rounded-2xl border border-border bg-surface px-5 py-4">
              <summary className="cursor-pointer font-medium">{faq.q}</summary>
              <p className="mt-2 text-sm text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Card>
          <h2 className="text-2xl font-semibold">Newsletter</h2>
          <p className="mt-2 text-sm text-muted">Occasional notes about directory coverage. No phone numbers are collected.</p>
          <NewsletterForm />
        </Card>
      </section>
    </>
  );
}
