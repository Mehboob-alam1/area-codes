import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Disclaimer", description: "Limits of the telephone numbering information published here." };

export default function DisclaimerPage() {
  return (
    <Prose title="Disclaimer">
      <p>A country calling code identifies a numbering plan. It does not identify a person, a handset or a current location.</p>
      <p>An area code on this site is a directory record with a source. Many records are still awaiting review. An empty city page means the code is not on file. It does not mean the city has no telephone service.</p>
      <p>Phone lookup checks a number against published numbering patterns. A possible or valid pattern is not proof that the number is assigned, active, reachable or owned by anyone.</p>
      <p>Shared codes are common. The same digits can belong to different countries, and one code can cover more than one city. Read the country attached to the record before you dial.</p>
    </Prose>
  );
}
