"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { clientApi } from "@/lib/api";

interface Hit {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  code: string | null;
}

const labels: Record<string, string> = { country: "Country", region: "Region", city: "City", area_code: "Area code", phone: "Number format" };

export function SearchBox({ large = false, autoFocus = false }: { large?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const stored = localStorage.getItem("wacd-recent");
    if (stored) setRecent(JSON.parse(stored) as string[]);
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  const enabled = debounced.length >= 2;
  const query = useQuery({
    queryKey: ["search", debounced],
    enabled,
    queryFn: async () => {
      const response = await fetch(clientApi(`/search?q=${encodeURIComponent(debounced)}&limit=8`));
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "Search failed.");
      return body.data as Hit[];
    },
  });

  const hits = query.data || [];

  function remember(term: string) {
    if (term.replace(/\D/g, "").length >= 8) return;
    const next = [term, ...recent.filter((item) => item !== term)].slice(0, 5);
    setRecent(next);
    localStorage.setItem("wacd-recent", JSON.stringify(next));
  }

  function choose(hit: Hit) {
    remember(value.trim());
    setOpen(false);
    router.push(hit.href);
  }

  function onKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Escape") setOpen(false);
    else if (event.key === "Enter" && open && hits[active]) {
      event.preventDefault();
      choose(hits[active]);
    }
  }

  return (
    <div ref={box} className="relative">
      <label htmlFor="global-search" className="sr-only">Search countries, cities or phone numbers</label>
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden />
      <input
        id="global-search"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Enter country, city, or phone number..."
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        className={`w-full rounded-2xl border border-border bg-surface pl-11 pr-4 shadow-sm outline-none placeholder:text-muted ${large ? "h-14 text-base" : "h-11 text-sm"}`}
      />
      {open ? (
        <div id={listId} role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          {value.trim().length === 1 ? <p className="px-4 py-3 text-sm text-muted">Enter at least 2 characters.</p> : null}
          {enabled && query.isFetching ? <p className="px-4 py-3 text-sm text-muted">Searching…</p> : null}
          {enabled && query.isError ? <p className="px-4 py-3 text-sm text-danger">Search is unavailable right now.</p> : null}
          {enabled && !query.isFetching && !query.isError && hits.length === 0 ? <p className="px-4 py-3 text-sm text-muted">No matching countries, cities or area codes are on file.</p> : null}
          {hits.map((hit, index) => (
            <button
              key={`${hit.type}-${hit.id}`}
              type="button"
              role="option"
              aria-selected={index === active}
              className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left ${index === active ? "bg-background" : "hover:bg-background"}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(hit)}
            >
              <span>
                <span className="block font-medium">{hit.title}</span>
                <span className="block text-sm text-muted">{hit.subtitle}</span>
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">{labels[hit.type] || hit.type}</span>
            </button>
          ))}
          {!enabled && recent.length ? (
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Recent searches</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((term) => (
                  <button key={term} type="button" className="rounded-full bg-background px-3 py-1 text-sm" onClick={() => { setValue(term); setDebounced(term); }}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
