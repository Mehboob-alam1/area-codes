"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/client";
import type { CountryRecord } from "@/lib/types";

export default function EditCountryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [country, setCountry] = useState<CountryRecord | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    adminFetch<{ data: { country: CountryRecord } }>(`/countries/${params.id}`).then((body) => setCountry(body.data.country)).catch((cause) => setError(cause.message));
  }, [params.id]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!country) return;
    const form = new FormData(event.currentTarget);
    const callingCode = String(form.get("callingCode") || "").trim();
    try {
      await adminFetch(`/countries/${country.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.get("name"),
          officialName: form.get("officialName"),
          iso2: form.get("iso2"),
          iso3: form.get("iso3"),
          callingCode: callingCode || null,
          capital: String(form.get("capital") || "") || null,
          continent: String(form.get("continent") || "") || null,
          internationalPrefix: String(form.get("internationalPrefix") || "") || null,
          nationalPrefix: String(form.get("nationalPrefix") || "") || null,
          numberingNotes: form.get("numberingNotes"),
          description: form.get("description"),
          status: form.get("status"),
          languages: String(form.get("languages") || "").split(",").map((item) => item.trim()).filter(Boolean),
        }),
      });
      setSaved("Saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed.");
    }
  }

  if (!country) return <p className="text-sm text-muted">{error || "Loading country…"}</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">Edit {country.name}</h1>
      <Field name="name" label="Name" defaultValue={country.name} />
      <Field name="officialName" label="Official name" defaultValue={country.officialName} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="iso2" label="ISO alpha-2" defaultValue={country.iso2} />
        <Field name="iso3" label="ISO alpha-3" defaultValue={country.iso3} />
        <Field name="callingCode" label="Calling code" defaultValue={country.callingCode || ""} />
        <Field name="capital" label="Capital" defaultValue={country.capital || ""} />
        <Field name="continent" label="Continent" defaultValue={country.continent || ""} />
        <Field name="internationalPrefix" label="Exit prefix" defaultValue={country.internationalPrefix || ""} />
        <Field name="nationalPrefix" label="Trunk prefix" defaultValue={country.nationalPrefix || ""} />
      </div>
      <label className="block text-sm font-medium">Languages, comma separated<textarea name="languages" defaultValue={country.languages.join(", ")} rows={2} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" /></label>
      <label className="block text-sm font-medium">Numbering notes<textarea name="numberingNotes" defaultValue={country.numberingNotes} rows={4} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" /></label>
      <label className="block text-sm font-medium">Description<textarea name="description" defaultValue={country.description} rows={3} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" /></label>
      <label className="block text-sm font-medium">Status
        <select name="status" defaultValue={country.status} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3"><option>draft</option><option>published</option><option>unpublished</option></select>
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-success">{saved}</p> : null}
      <div className="flex gap-3">
        <button className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">Save changes</button>
        <button type="button" className="h-11 rounded-xl border border-border px-5 text-sm" onClick={() => router.push("/admin/countries")}>Back</button>
      </div>
    </form>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block text-sm font-medium">{label}
      <input name={name} defaultValue={defaultValue} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" />
    </label>
  );
}
