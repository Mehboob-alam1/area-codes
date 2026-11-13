"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function AreaCodeFilters() {
  const router = useRouter();
  const params = useSearchParams();
  function submit(form: FormData) {
    const next = new URLSearchParams();
    for (const key of ["search", "country", "code"]) {
      const value = String(form.get(key) || "").trim();
      if (value) next.set(key, value);
    }
    router.push(`/area-codes?${next.toString()}`);
  }
  return (
    <form action={(form) => submit(form)} className="mt-6 grid gap-3 md:grid-cols-4">
      <input name="search" defaultValue={params.get("search") || ""} aria-label="Search notes or code" placeholder="Search" className="h-11 rounded-xl border border-border bg-surface px-3" />
      <input name="country" defaultValue={params.get("country") || ""} aria-label="Country" placeholder="Country, such as PK" className="h-11 rounded-xl border border-border bg-surface px-3" />
      <input name="code" defaultValue={params.get("code") || ""} aria-label="Area code" placeholder="Code" className="h-11 rounded-xl border border-border bg-surface px-3" />
      <button className="h-11 rounded-xl bg-primary text-sm font-semibold text-white" type="submit">Apply filters</button>
    </form>
  );
}
