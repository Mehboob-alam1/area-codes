import type { Metadata } from "next";
import { Prose } from "@/components/prose";
import { apiGet } from "@/lib/api";

export const metadata: Metadata = { title: "Data sources", description: "Sources used for country records, flags and geographic area codes." };

interface Source { id: string; sourceName: string; sourceUrl: string; sourceType: string; license: string; notes: string; }

export default async function DataSourcesPage() {
  let sources: Source[] = [];
  try {
    const response = await apiGet<{ data: Source[] }>("/sources");
    sources = response.data;
  } catch {
    sources = [];
  }
  return (
    <Prose title="Data sources" lede="The directory does not depend on one unofficial area-code API.">
      <p>Country metadata comes from the mledoze/countries dataset, the same public reference long used by REST Countries. REST Countries v3 is deprecated and the current hosted API uses its own access terms, so this project stores a normalized copy instead of calling that API on every page view.</p>
      <p>ITU-T E.164 is the numbering standard. The ITU national numbering plan index is the official place to review a country plan. Those sites are references, not a JSON feed of every city code.</p>
      <p>libphonenumber-js supplies phone parsing and validation. It is a library, not a hosted lookup of live numbers. Twilio Lookup is not enabled.</p>
      {sources.map((source) => (
        <section key={source.id}>
          <h2>{source.sourceName}</h2>
          <p>{source.notes}</p>
          {source.sourceUrl ? <p><a className="text-primary" href={source.sourceUrl}>{source.sourceUrl}</a></p> : null}
          <p>Type: {source.sourceType}. License: {source.license || "See the source."}</p>
        </section>
      ))}
    </Prose>
  );
}
