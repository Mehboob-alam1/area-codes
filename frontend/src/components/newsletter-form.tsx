"use client";

import { useState } from "react";
import { clientApi } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(clientApi("/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "Subscription failed.");
      setMessage("You are on the list.");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Subscription failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="newsletter-email">Email</label>
      <input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-11 flex-1 rounded-xl border border-border bg-background px-3" />
      <button type="submit" disabled={pending} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Subscribe"}</button>
      {message ? <p className="self-center text-sm text-muted">{message}</p> : null}
    </form>
  );
}
