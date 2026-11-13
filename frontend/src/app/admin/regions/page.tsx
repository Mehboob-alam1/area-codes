"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/components/admin/client";
import type { CountrySummary, ListResponse } from "@/lib/types";

interface RegionRow { id: string; name: string; regionType: string; status: string; countryName: string | null }

export default function AdminRegionsPage() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const countries = useQuery({ queryKey: ["admin-country-options"], queryFn: () => adminFetch<ListResponse<CountrySummary>>("/countries?limit=300") });
  const regions = useQuery({ queryKey: ["admin-regions"], queryFn: () => adminFetch<ListResponse<RegionRow>>("/regions?limit=300") });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await adminFetch("/regions", { method: "POST", body: JSON.stringify({ countryId: form.get("countryId"), name: form.get("name"), regionType: form.get("regionType"), description: form.get("description"), status: form.get("status") }) });
      formElement.reset();
      setError("");
      client.invalidateQueries({ queryKey: ["admin-regions"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the region.");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Regions</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2">
        <select name="countryId" required className="h-11 rounded-xl border border-border bg-background px-3" aria-label="Country"><option value="">Country</option>{countries.data?.data.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select>
        <input name="name" required placeholder="Region name" className="h-11 rounded-xl border border-border bg-background px-3" />
        <input name="regionType" required placeholder="Type, such as state" className="h-11 rounded-xl border border-border bg-background px-3" />
        <select name="status" className="h-11 rounded-xl border border-border bg-background px-3" defaultValue="draft"><option>draft</option><option>published</option></select>
        <textarea name="description" placeholder="Description" className="rounded-xl border border-border bg-background px-3 py-2 md:col-span-2" />
        {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
        <button className="h-11 rounded-xl bg-primary text-sm font-semibold text-white md:col-span-2">Create region</button>
      </form>
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {regions.data?.data.map((region) => (
          <li key={region.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span><strong>{region.name}</strong> · {region.countryName} · {region.regionType}</span>
            <span className="flex items-center gap-3">{region.status}<button type="button" className="text-danger" onClick={async () => { await adminFetch(`/regions/${region.id}`, { method: "DELETE" }); client.invalidateQueries({ queryKey: ["admin-regions"] }); }}>Delete</button></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
