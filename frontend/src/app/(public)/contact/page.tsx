import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Contact the World Area Code Directory." };

export default function ContactPage() {
  return <ContactForm />;
}
