import type { Metadata } from "next";
import { CompareTool } from "@/components/compare-tool";

export const metadata: Metadata = { title: "Compare countries", description: "Compare calling codes, currencies, languages and dialing prefixes for up to four countries." };

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Compare countries</h1>
      <p className="mt-3 max-w-2xl text-muted">Comparison uses the same directory records as the country pages. Empty fields stay empty.</p>
      <div className="mt-8"><CompareTool /></div>
    </div>
  );
}
