"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/components/admin/client";

export default function NewCountryPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const callingCode = String(form.get("callingCode") || "").trim();
    try {
      const body = await adminFetch<{ data: { id: string } }>("/countries", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          officialName: form.get("officialName"),
          iso2: form.get("iso2"),
          iso3: form.get("iso3"),
          callingCode: callingCode || null,
          capital: form.get("capital") || null,
          continent: form.get("continent") || null,
          description: form.get("description") || "",
          numberingNotes: form.get("numberingNotes") || "",
          status: form.get("status"),
        }),
      });
      router.push(`/admin/countries/${body.data.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the country.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold">Add country</h1>
      {["name", "officialName", "iso2", "iso3", "callingCode", "capital", "continent"].map((name) => (
        <label key={name} className="block text-sm font-medium capitalize">{name}
          <input name={name} required={["name", "iso2", "iso3"].includes(name)} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" />
        </label>
      ))}
      <label className="block text-sm font-medium">Numbering notes<textarea name="numberingNotes" rows={4} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" /></label>
      <label className="block text-sm font-medium">Description<textarea name="description" rows={3} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" /></label>
      <label className="block text-sm font-medium">Status
        <select name="status" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" defaultValue="draft"><option>draft</option><option>published</option><option>unpublished</option></select>
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">Create country</button>
    </form>
  );
}
