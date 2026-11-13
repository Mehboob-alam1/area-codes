"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { clientApi } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  message: z.string().trim().min(10, "Use at least 10 characters."),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [status, setStatus] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", message: "" } });

  async function onSubmit(values: FormValues) {
    setStatus("");
    const response = await fetch(clientApi("/contact"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await response.json();
    if (!response.ok) {
      setStatus(body?.error?.message || "Message could not be sent.");
      return;
    }
    setStatus("Message received. It is stored for the directory administrators.");
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-4 px-4 py-12">
      <h1 className="text-4xl font-semibold">Contact</h1>
      <p className="text-muted">Send a correction or a question about coverage. Do not include a full personal phone number unless you need it quoted back to you.</p>
      <label className="block text-sm font-medium">Name
        <input {...form.register("name")} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" />
      </label>
      {form.formState.errors.name ? <p className="text-sm text-danger">{form.formState.errors.name.message}</p> : null}
      <label className="block text-sm font-medium">Email
        <input type="email" {...form.register("email")} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" />
      </label>
      {form.formState.errors.email ? <p className="text-sm text-danger">{form.formState.errors.email.message}</p> : null}
      <label className="block text-sm font-medium">Message
        <textarea rows={6} {...form.register("message")} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
      </label>
      {form.formState.errors.message ? <p className="text-sm text-danger">{form.formState.errors.message.message}</p> : null}
      <button disabled={form.formState.isSubmitting} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">{form.formState.isSubmitting ? "Sending…" : "Send message"}</button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </form>
  );
}
