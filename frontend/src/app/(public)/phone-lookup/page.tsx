import type { Metadata } from "next";
import { PhoneLookupForm } from "@/components/phone-lookup-form";

export const metadata: Metadata = {
  title: "Phone lookup",
  description: "Parse and validate international phone number formats. A valid format does not prove a number is assigned.",
};

export default function PhoneLookupPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Phone lookup</h1>
      <p className="mt-3 text-muted">Enter an international number, or choose a country and enter the national number. Results come from numbering metadata, not from a live carrier database.</p>
      <div className="mt-8"><PhoneLookupForm /></div>
    </div>
  );
}
