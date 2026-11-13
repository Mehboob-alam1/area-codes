"use client";

import { useState } from "react";
import { adminFetch } from "@/components/admin/client";

interface PreviewRow { line: number; values: { name: string; iso2: string }; errors: string[] }

export default function ImportsPage() {
  const [content, setContent] = useState("name,iso2,iso3,calling_code,capital,continent\nExample Land,EL,EXL,+999,Example City,Europe");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [message, setMessage] = useState("");

  async function run(path: string, extra?: object) {
    setMessage("");
    try {
      const body = await adminFetch<{ data: { rows?: PreviewRow[]; imported?: number; valid?: number; invalid?: number } }>(path, {
        method: "POST",
        body: JSON.stringify({ content, format: "csv", skipInvalid: false, ...extra }),
      });
      if (body.data.rows) setPreview(body.data.rows);
      if (typeof body.data.imported === "number") {
        setMessage(`Imported ${body.data.imported} draft countries.`);
        setPreview(null);
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Import failed.");
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold">Import countries</h1>
      <p className="mt-2 text-sm text-muted">Preview checks required fields and duplicate ISO codes. Nothing is written until you confirm. Invalid files are rejected unless you fix them. Imported countries stay in draft.</p>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={10} className="mt-4 w-full rounded-2xl border border-border bg-surface p-3 font-mono text-sm" />
      <div className="mt-4 flex gap-3">
        <button type="button" className="h-11 rounded-xl border border-border px-4 text-sm" onClick={() => run("/import/preview")}>Preview</button>
        <button type="button" className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white" onClick={() => run("/import/csv")}>Confirm import</button>
      </div>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
      {preview ? (
        <ul className="mt-4 space-y-2 text-sm">
          {preview.map((row) => (
            <li key={row.line} className="rounded-xl border border-border bg-surface px-3 py-2">
              Line {row.line}: {row.values.name || "(no name)"} {row.values.iso2} {row.errors.length ? <span className="text-danger">— {row.errors.join(", ")}</span> : <span className="text-success">— ready</span>}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
