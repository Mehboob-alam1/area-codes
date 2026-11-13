import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Terms and conditions", description: "Terms for using the World Area Code Directory." };

export default function TermsPage() {
  return (
    <Prose title="Terms and conditions">
      <p>The directory is provided as general information. Numbering plans change, and a record can be incomplete, unverified or out of date. Check the national numbering plan or your carrier before you rely on a code for an important call.</p>
      <p>You may not use the site to harass a person, to scrape personal telephone numbers, or to present a formatted number as proof of identity, ownership or location.</p>
      <p>Administrator tools are limited to authorized accounts. Attempting to bypass those controls is not allowed.</p>
      <p>The names of standards bodies and data sources are used to identify references. The project is not endorsed by those organizations.</p>
    </Prose>
  );
}
