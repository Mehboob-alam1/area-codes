"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/components/admin/client";
import { VerificationBadge } from "@/components/ui";
import type { AreaCodeRecord, CountrySummary, ListResponse } from "@/lib/types";

export default function AdminAreaCodesPage() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const countries = useQuery({ queryKey: ["admin-country-options"], queryFn: () => adminFetch<ListResponse<CountrySummary>>("/countries?limit=300") });
  const codes = useQuery({ queryKey: ["admin-codes"], queryFn: () => adminFetch<ListResponse<AreaCodeRecord>>("/area-codes?limit=100&sort=updatedAt&order=desc") });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await adminFetch("/area-codes", {
        method: "POST",
        body: JSON.stringify({
          countryId: form.get("countryId"),
          code: form.get("code"),
          codeType: form.get("codeType"),
          regionName: form.get("regionName") || undefined,
          cityName: form.get("cityName") || undefined,
          notes: form.get("notes"),
          sourceName: form.get("sourceName"),
          sourceUrl: form.get("sourceUrl"),
          createMissingPlaces: form.get("createMissingPlaces") === "on",
          status: form.get("status"),
          verificationStatus: "pending",
        }),
      });
      formElement.reset();
      setError("");
      client.invalidateQueries({ queryKey: ["admin-codes"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the area code.");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Area codes</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">New records start unverified. Leave the city blank when the code is not tied to one place. Confirm creation only when the place should be added.</p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2">
        <select name="countryId" required className="h-11 rounded-xl border border-border bg-background px-3" aria-label="Country"><option value="">Country</option>{countries.data?.data.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select>
        <input name="code" required placeholder="Code" className="h-11 rounded-xl border border-border bg-background px-3 font-mono" />
        <select name="codeType" className="h-11 rounded-xl border border-border bg-background px-3" defaultValue="geographic"><option value="geographic">geographic</option><option value="nanp">nanp</option><option value="mobile">mobile</option><option value="national_destination">national destination</option></select>
        <select name="status" className="h-11 rounded-xl border border-border bg-background px-3" defaultValue="draft"><option>draft</option><option>published</option></select>
        <input name="regionName" placeholder="Region name, if any" className="h-11 rounded-xl border border-border bg-background px-3" />
        <input name="cityName" placeholder="City name, if any" className="h-11 rounded-xl border border-border bg-background px-3" />
        <input name="sourceName" placeholder="Source name" className="h-11 rounded-xl border border-border bg-background px-3" />
        <input name="sourceUrl" placeholder="Source URL" className="h-11 rounded-xl border border-border bg-background px-3" />
        <textarea name="notes" placeholder="Notes" className="rounded-xl border border-border bg-background px-3 py-2 md:col-span-2" />
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="createMissingPlaces" type="checkbox" /> Create the region and city if they are not already in the directory</label>
        {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
        <button className="h-11 rounded-xl bg-primary text-sm font-semibold text-white md:col-span-2">Add area code</button>
      </form>
      <ul className="mt-6 space-y-2">
        {codes.data?.data.map((area) => (
          <li key={area.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <span className="font-mono text-base font-semibold">{area.code}</span>
            <span>{area.countryName}</span>
            <VerificationBadge status={area.verificationStatus} />
            <span className="flex gap-3">
              <button type="button" className="text-primary" onClick={async () => { await adminFetch(`/area-codes/${area.id}/verify`, { method: "POST" }); client.invalidateQueries({ queryKey: ["admin-codes"] }); }}>Verify</button>
              <button type="button" className="text-danger" onClick={async () => { await adminFetch(`/area-codes/${area.id}`, { method: "DELETE" }); client.invalidateQueries({ queryKey: ["admin-codes"] }); }}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
