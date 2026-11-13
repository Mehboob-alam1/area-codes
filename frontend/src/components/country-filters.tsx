"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CountryFilters({ letters }: { letters: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const continents = ["Africa", "Americas", "Antarctica", "Asia", "Europe", "Oceania"];

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/countries?${next.toString()}`);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <input defaultValue={params.get("search") || ""} placeholder="Search by country name" aria-label="Search by country name" className="h-11 flex-1 rounded-xl border border-border bg-surface px-3" onKeyDown={(event) => { if (event.key === "Enter") update("search", (event.target as HTMLInputElement).value); }} />
        <select aria-label="Continent" value={params.get("continent") || ""} onChange={(event) => update("continent", event.target.value)} className="h-11 rounded-xl border border-border bg-surface px-3">
          <option value="">All continents</option>
          {continents.map((continent) => <option key={continent}>{continent}</option>)}
        </select>
        <select aria-label="Sort" value={`${params.get("sort") || "name"}:${params.get("order") || "asc"}`} onChange={(event) => { const [sort, order] = event.target.value.split(":"); const next = new URLSearchParams(params.toString()); next.set("sort", sort || "name"); next.set("order", order || "asc"); next.delete("page"); router.push(`/countries?${next.toString()}`); }} className="h-11 rounded-xl border border-border bg-surface px-3">
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="callingCode:asc">Calling code</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-1" aria-label="Alphabetical filter">
        <button type="button" onClick={() => update("letter", "")} className={`h-8 rounded-lg px-2 text-xs font-medium ${!params.get("letter") ? "bg-primary text-white" : "bg-surface text-muted"}`}>All</button>
        {letters.map((letter) => (
          <button key={letter} type="button" onClick={() => update("letter", letter)} className={`h-8 w-8 rounded-lg text-xs font-medium ${params.get("letter") === letter ? "bg-primary text-white" : "bg-surface text-muted"}`}>{letter}</button>
        ))}
      </div>
    </div>
  );
}
