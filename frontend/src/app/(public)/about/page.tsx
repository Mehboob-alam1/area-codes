import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "About", description: "What the World Area Code Directory covers and what it does not claim." };

export default function AboutPage() {
  return (
    <Prose title="About" lede="A public directory for international calling codes and sourced regional numbering records.">
      <p>World Area Code Directory separates country calling codes, national destination codes, geographic area codes and subscriber numbers. Those are different parts of a telephone number, and the directory stores them separately.</p>
      <p>Country profiles are built from a reference dataset of names, ISO codes, capitals, continents, currencies, languages and calling-code fields. Geographic codes are added only from a curated catalog with a source attached. A city can exist in the directory with no area code.</p>
      <p>The project is an information site. It is not a carrier, a numbering administrator or a lookup service that can tell you who owns a telephone number.</p>
    </Prose>
  );
}
