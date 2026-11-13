"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { clientApi } from "@/lib/api";
import type { CountrySummary, ListResponse } from "@/lib/types";

interface PhoneResult {
  success: boolean;
  parsed: boolean;
  message?: string;
  country?: string;
  countryIso?: string | null;
  countryCallingCode?: string;
  internationalFormat?: string;
  nationalFormat?: string;
  isPossible?: boolean;
  isValid?: boolean;
  numberType?: string | null;
  disclaimer?: string;
}

export function PhoneLookupForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const countries = useQuery({
    queryKey: ["country-options"],
    queryFn: async () => {
      const response = await fetch(clientApi("/countries?limit=300&sort=name"));
      const body = (await response.json()) as ListResponse<CountrySummary>;
      return body.data;
    },
  });
  const lookup = useMutation({
    mutationFn: async () => {
      const response = await fetch(clientApi("/phone/parse"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, country: country || undefined }),
      });
      const body = (await response.json()) as PhoneResult;
      if (!response.ok) throw new Error("The number could not be checked.");
      return body;
    },
  });
  const options = useMemo(() => countries.data || [], [countries.data]);

  return (
    <div>
      <form className="grid gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); lookup.mutate(); }}>
        <label className="block text-sm font-medium md:col-span-1">Country
          <select value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3">
            <option value="">Detect from the number</option>
            {options.map((item) => <option key={item.id} value={item.iso2}>{item.name} ({item.callingCode || item.iso2})</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium md:col-span-2">Phone number
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required placeholder="+92 300 1234567" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 font-mono" />
        </label>
        <button type="submit" disabled={lookup.isPending} className="h-11 rounded-xl bg-primary text-sm font-semibold text-white md:col-span-3 disabled:opacity-60">{lookup.isPending ? "Checking…" : "Check number"}</button>
      </form>
      {lookup.isError ? <p className="mt-4 text-danger">The lookup service did not respond.</p> : null}
      {lookup.data ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          {!lookup.data.parsed ? <p>{lookup.data.message}</p> : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-sm text-muted">Country</dt><dd className="font-medium">{lookup.data.country}</dd></div>
              <div><dt className="text-sm text-muted">Calling code</dt><dd className="font-mono">{lookup.data.countryCallingCode}</dd></div>
              <div><dt className="text-sm text-muted">International</dt><dd className="font-mono">{lookup.data.internationalFormat}</dd></div>
              <div><dt className="text-sm text-muted">National</dt><dd className="font-mono">{lookup.data.nationalFormat}</dd></div>
              <div><dt className="text-sm text-muted">Possible</dt><dd>{lookup.data.isPossible ? "Yes" : "No"}</dd></div>
              <div><dt className="text-sm text-muted">Valid pattern</dt><dd>{lookup.data.isValid ? "Yes" : "No"}</dd></div>
              <div><dt className="text-sm text-muted">Number type</dt><dd>{lookup.data.numberType || "Not identified"}</dd></div>
            </dl>
          )}
          {lookup.data.disclaimer ? <p className="mt-4 text-sm text-muted">{lookup.data.disclaimer}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
