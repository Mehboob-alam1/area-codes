import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Methodology", description: "How numbering records are collected, labeled and published." };

export default function MethodologyPage() {
  return (
    <Prose title="Methodology" lede="Publish a record only when it has a source, and say when it has not been reviewed.">
      <h2>What is stored separately</h2>
      <p>Country calling codes, regions, cities and area codes are different records. An area code can point at more than one city. A city can have several codes. A city can also have none.</p>
      <h2>Verification states</h2>
      <ul>
        <li>Unverified: a source is on file and the record is waiting for review.</li>
        <li>Verified: a reviewer marked the record checked and the review date is stored.</li>
        <li>Outdated or conflicting: the record stays visible with that label until it is corrected.</li>
        <li>Rejected: the record is hidden from the public site.</li>
      </ul>
      <h2>What this version does not do</h2>
      <p>It does not scrape every national numbering plan. It does not treat a mobile prefix as a city code. It does not invent a code so a page looks complete. Curated geographic codes are published with an unverified label until a reviewer confirms them against the current national source.</p>
      <h2>Changes</h2>
      <p>Administrator creates, edits, deletions, imports, verification changes and sign-ins are written to an audit log. Deletion hides a record instead of erasing it.</p>
    </Prose>
  );
}
