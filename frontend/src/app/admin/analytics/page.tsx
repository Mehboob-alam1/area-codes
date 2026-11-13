"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminFetch } from "@/components/admin/client";

export default function AnalyticsPage() {
  const query = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => adminFetch<{ data: { searchesByDay: { day: string; count: number }[]; searchRequests: number; apiRequests: { sinceProcessStart: number; byDay: { day: string; count: number }[] } } }>("/dashboard"),
  });
  const logs = useQuery({ queryKey: ["search-logs"], queryFn: () => adminFetch<{ data: { searchQuery: string; searchType: string; resultCount: number; createdAt: string }[] }>("/search-logs?limit=20") });
  const data = query.data?.data;
  if (!data) return <p className="text-sm text-muted">{query.isError ? "Analytics are limited to roles that can read them." : "Loading analytics…"}</p>;
  return (
    <div>
      <h1 className="text-3xl font-semibold">Analytics</h1>
      <p className="mt-2 text-sm text-muted">{data.searchRequests} stored searches. {data.apiRequests.sinceProcessStart} API requests since the process started. Phone-like searches are stored as hashes.</p>
      <div className="mt-6 h-64 rounded-2xl border border-border bg-surface p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.searchesByDay}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563EB" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="mt-8 text-xl font-semibold">Recent stored searches</h2>
      <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface text-sm">
        {logs.data?.data.map((log) => (
          <li key={log.createdAt + log.searchQuery} className="flex justify-between px-4 py-3"><span>{log.searchQuery}</span><span className="text-muted">{log.searchType} · {log.resultCount} results</span></li>
        ))}
      </ul>
    </div>
  );
}
