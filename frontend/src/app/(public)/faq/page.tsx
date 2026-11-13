import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "FAQ", description: "Answers about calling codes, area codes and phone number checks." };

const faqs = [
  ["What is a country calling code?", "It is the international prefix assigned to a country or a shared numbering plan, such as +1, +44 or +92. Several countries can share one calling code."],
  ["What is an area code?", "It is a geographic or regional prefix inside a national plan. Not every country uses one, and a code is often shared by many cities."],
  ["Why are some codes marked unverified?", "The source is recorded, but a reviewer has not signed the record off. The page shows that state instead of calling the code verified."],
  ["Can I look up who owns a number?", "No. The phone tool formats and checks numbering patterns only."],
  ["Where do country facts come from?", "Names, ISO codes, capitals, continents, currencies, languages and calling-code fields come from the mledoze/countries reference dataset. Flags are loaded by ISO code from flagcdn."],
];

export default function FaqPage() {
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
  return (
    <Prose title="Frequently asked questions">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {faqs.map(([question, answer]) => (
        <details key={question} className="rounded-2xl border border-border bg-surface px-5 py-4 text-foreground">
          <summary className="cursor-pointer font-medium">{question}</summary>
          <p className="mt-2 text-sm text-muted">{answer}</p>
        </details>
      ))}
    </Prose>
  );
}
