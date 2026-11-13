"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/components/admin/client";

interface Audit { id: string; action: string; tableName: string; createdAt: string; adminId: string | null }

export default function AuditPage() {
  const query = useQuery({ queryKey: ["audit"], queryFn: () => adminFetch<{ data: Audit[] }>("/audit-logs?limit=100") });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Audit log</h1>
      {query.isError ? <p className="mt-4 text-sm text-danger">Your role cannot read the audit log.</p> : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface text-sm">
        {query.data?.data.map((entry) => (
          <li key={entry.id} className="grid gap-1 px-4 py-3 md:grid-cols-4">
            <span className="font-medium">{entry.action}</span>
            <span>{entry.tableName}</span>
            <span className="text-muted">{entry.createdAt.replace("T", " ").slice(0, 19)}</span>
            <span className="truncate text-muted">{entry.adminId || "system"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
