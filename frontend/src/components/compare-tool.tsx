"use client";

import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { clientApi } from "@/lib/api";
import type { CountryRecord, CountrySummary, ListResponse } from "@/lib/types";

export function CompareTool() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const countries = useQuery({
    queryKey: ["all-countries"],
    queryFn: async () => {
      const response = await fetch(clientApi("/countries?limit=300&sort=name"));
      const body = (await response.json()) as ListResponse<CountrySummary>;
      return body.data;
    },
  });
  const fuse = useMemo(() => new Fuse(countries.data || [], { keys: ["name", "iso2", "callingCode"], threshold: 0.3 }), [countries.data]);
  const matches = query.trim().length >= 2 ? fuse.search(query).slice(0, 8).map((item) => item.item) : [];
  const details = useQuery({
    queryKey: ["compare", selected],
    enabled: selected.length > 0,
    queryFn: async () => {
      const rows = await Promise.all(selected.map(async (slug) => {
        const response = await fetch(clientApi(`/countries/${slug}`));
        const body = await response.json();
        return body.data.country as CountryRecord;
      }));
      return rows;
    },
  });

  function add(slug: string) {
    setSelected((current) => current.includes(slug) || current.length >= 4 ? current : [...current, slug]);
    setQuery("");
  }

  const fields: { label: string; value: (country: CountryRecord) => string }[] = [
    { label: "Calling code", value: (country) => country.callingCodes.join(", ") || "Not recorded" },
    { label: "ISO code", value: (country) => `${country.iso2} / ${country.iso3}` },
    { label: "Capital", value: (country) => country.capital || "Not recorded" },
    { label: "Currency", value: (country) => country.currencyName ? `${country.currencyName} (${country.currencyCode})` : "Not recorded" },
    { label: "Language", value: (country) => country.languages.join(", ") || "Not recorded" },
    { label: "Exit prefix", value: (country) => country.internationalPrefix || "Not recorded" },
    { label: "Trunk prefix", value: (country) => country.nationalPrefix || "Not recorded" },
    { label: "Numbering notes", value: (country) => country.numberingNotes },
    { label: "Time zones", value: (country) => country.timezones.length ? country.timezones.join(", ") : "Not recorded" },
  ];

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor="compare-search">Add up to four countries</label>
      <input id="compare-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a country" className="mt-2 h-11 w-full max-w-lg rounded-xl border border-border bg-surface px-3" />
      {matches.length ? (
        <ul className="mt-2 max-w-lg overflow-hidden rounded-xl border border-border bg-surface">
          {matches.map((country) => (
            <li key={country.id}><button type="button" className="block w-full px-3 py-2 text-left hover:bg-background" onClick={() => add(country.slug)}>{country.name} · {country.callingCode || "no code"}</button></li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {selected.map((slug) => (
          <button key={slug} type="button" className="rounded-full border border-border px-3 py-1 text-sm" onClick={() => setSelected((current) => current.filter((item) => item !== slug))}>
            {countries.data?.find((country) => country.slug === slug)?.name || slug} · remove
          </button>
        ))}
      </div>
      {details.data && details.data.length ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Field</th>
                {details.data.map((country) => <th key={country.id} className="px-4 py-3 font-medium">{country.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.label} className="border-b border-border align-top last:border-0">
                  <th className="px-4 py-3 font-medium text-muted">{field.label}</th>
                  {details.data?.map((country) => <td key={country.id} className="px-4 py-3">{field.value(country)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
