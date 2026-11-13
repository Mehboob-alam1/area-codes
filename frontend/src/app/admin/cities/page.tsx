"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/components/admin/client";
import type { CountrySummary, ListResponse } from "@/lib/types";

interface CityRow { id: string; name: string; status: string; countryName: string | null; regionName: string | null }
interface RegionRow { id: string; name: string; countryId?: string }

export default function AdminCitiesPage() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [countryId, setCountryId] = useState("");
  const countries = useQuery({ queryKey: ["admin-country-options"], queryFn: () => adminFetch<ListResponse<CountrySummary>>("/countries?limit=300") });
  const regions = useQuery({ queryKey: ["admin-regions", countryId], enabled: Boolean(countryId), queryFn: () => adminFetch<ListResponse<RegionRow>>(`/regions?limit=300&country=${countryId}`) });
  const cities = useQuery({ queryKey: ["admin-cities"], queryFn: () => adminFetch<ListResponse<CityRow>>("/cities?limit=300") });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await adminFetch("/cities", { method: "POST", body: JSON.stringify({ countryId: form.get("countryId"), regionId: form.get("regionId") || null, name: form.get("name"), description: form.get("description"), status: form.get("status") }) });
      formElement.reset();
      setError("");
      client.invalidateQueries({ queryKey: ["admin-cities"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the city.");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Cities</h1>
      <p className="mt-2 text-sm text-muted">Creating a city does not create an area code.</p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2">
        <select name="countryId" required value={countryId} onChange={(event) => setCountryId(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3" aria-label="Country"><option value="">Country</option>{countries.data?.data.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select>
        <select name="regionId" className="h-11 rounded-xl border border-border bg-background px-3" aria-label="Region"><option value="">No region</option>{regions.data?.data.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select>
        <input name="name" required placeholder="City name" className="h-11 rounded-xl border border-border bg-background px-3" />
        <select name="status" className="h-11 rounded-xl border border-border bg-background px-3" defaultValue="draft"><option>draft</option><option>published</option></select>
        <textarea name="description" placeholder="Description" className="rounded-xl border border-border bg-background px-3 py-2 md:col-span-2" />
        {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
        <button className="h-11 rounded-xl bg-primary text-sm font-semibold text-white md:col-span-2">Create city</button>
      </form>
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {cities.data?.data.map((city) => (
          <li key={city.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span><strong>{city.name}</strong> · {[city.regionName, city.countryName].filter(Boolean).join(", ")}</span>
            <button type="button" className="text-danger" onClick={async () => { await adminFetch(`/cities/${city.id}`, { method: "DELETE" }); client.invalidateQueries({ queryKey: ["admin-cities"] }); }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
