"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch, token } from "@/components/admin/client";
import type { CountrySummary, ListResponse } from "@/lib/types";

export default function AdminCountriesPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin-countries"], queryFn: () => adminFetch<ListResponse<CountrySummary>>("/countries?limit=300") });

  async function remove(id: string, name: string) {
    if (!window.confirm(`Unpublish and hide ${name}? The record is kept in the audit history.`)) return;
    await adminFetch(`/countries/${id}`, { method: "DELETE" });
    client.invalidateQueries({ queryKey: ["admin-countries"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Countries</h1>
        <div className="flex gap-3 text-sm">
          <button type="button" className="rounded-lg border border-border px-3 py-2" onClick={async () => { const response = await fetch("/backend-api/v1/admin/countries/export", { headers: { Authorization: `Bearer ${token()}` } }); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "countries.csv"; link.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
          <Link className="rounded-lg bg-primary px-3 py-2 font-semibold text-white" href="/admin/countries/new">Add country</Link>
        </div>
      </div>
      {query.isError ? <p className="mt-4 text-danger">{query.error instanceof Error ? query.error.message : "Could not load countries."}</p> : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-muted"><tr><th className="px-4 py-3">Country</th><th className="px-4 py-3">ISO</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {query.data?.data.map((country) => (
              <tr key={country.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{country.name}</td>
                <td className="px-4 py-3">{country.iso2}</td>
                <td className="px-4 py-3 font-mono">{country.callingCode || "—"}</td>
                <td className="px-4 py-3">{country.status}</td>
                <td className="px-4 py-3"><Link className="text-primary" href={`/admin/countries/${country.id}`}>Edit</Link> <button type="button" className="ml-3 text-danger" onClick={() => remove(country.id, country.name)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
