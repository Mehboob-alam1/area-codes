"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminFetch } from "@/components/admin/client";
import { VerificationBadge } from "@/components/ui";
import type { AreaCodeRecord } from "@/lib/types";

interface Dashboard {
  countries: number;
  regions: number;
  cities: number;
  areaCodes: number;
  published: number;
  drafts: number;
  awaitingVerification: number;
  recent: AreaCodeRecord[];
  searchRequests: number;
  searchesByDay: { day: string; count: number }[];
  apiRequests: { sinceProcessStart: number };
}

export default function AdminHomePage() {
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => adminFetch<{ data: Dashboard }>("/dashboard") });
  const data = query.data?.data;
  if (query.isLoading) return <p className="text-sm text-muted">Loading overview…</p>;
  if (query.isError) return <p className="text-danger">{query.error instanceof Error ? query.error.message : "Overview unavailable."}</p>;
  if (!data) return null;
  const cards = [
    ["Countries", data.countries],
    ["Regions", data.regions],
    ["Cities", data.cities],
    ["Area codes", data.areaCodes],
    ["Published records", data.published],
    ["Drafts", data.drafts],
    ["Awaiting verification", data.awaitingVerification],
    ["Search requests", data.searchRequests],
  ];
  return (
    <div>
      <h1 className="text-3xl font-semibold">Overview</h1>
      <p className="mt-2 text-sm text-muted">API requests since this server process started: {data.apiRequests.sinceProcessStart}.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 h-64 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Searches by day</h2>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data.searchesByDay}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563EB" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="mt-8 text-xl font-semibold">Recent area-code records</h2>
      <ul className="mt-3 space-y-2">
        {data.recent.map((area) => (
          <li key={area.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <span className="font-mono font-semibold">{area.code}</span>
            <span>{area.countryName}</span>
            <VerificationBadge status={area.verificationStatus} />
          </li>
        ))}
      </ul>
    </div>
  );
}
