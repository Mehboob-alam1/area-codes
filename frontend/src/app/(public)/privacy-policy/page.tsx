import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Privacy policy", description: "How the World Area Code Directory handles search queries, messages and administrator accounts." };

export default function PrivacyPage() {
  return (
    <Prose title="Privacy policy" lede="This directory is built to publish numbering information, not to collect telephone subscribers.">
      <h2>Searches</h2>
      <p>Short searches, such as a country name or an area code, may be stored so administrators can see what people look up. A query that contains eight or more digits is stored only as a hash. The full number is not written to the search log.</p>
      <h2>Phone lookup</h2>
      <p>A number you submit for formatting is used to produce the response and is not added to the analytics log. Do not submit numbers you are not comfortable sending to the server that runs the lookup.</p>
      <h2>Messages and newsletter</h2>
      <p>Contact messages and newsletter email addresses are stored so an administrator can read them. They are not sold. There is no separate mailing provider in this version.</p>
      <h2>Administrator accounts</h2>
      <p>Administrator passwords are stored as a salted hash. Session tokens are kept in the browser and expire.</p>
      <h2>Cookies</h2>
      <p>The public site stores the theme choice and recent non-phone searches in local storage. It does not set an advertising cookie.</p>
    </Prose>
  );
}
