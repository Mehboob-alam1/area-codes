"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch, setToken } from "@/components/admin/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const body = await adminFetch<{ data: { token: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      setToken(body.data.token);
      router.replace("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-24 max-w-md rounded-2xl border border-border bg-surface p-6">
      <h1 className="text-2xl font-semibold">Administrator sign in</h1>
      <p className="mt-2 text-sm text-muted">Local development creates a super admin from the API environment on first boot.</p>
      <label className="mt-5 block text-sm font-medium">Email<input name="email" type="email" required className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
      <label className="mt-3 block text-sm font-medium">Password<input name="password" type="password" required className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <button disabled={pending} className="mt-5 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
