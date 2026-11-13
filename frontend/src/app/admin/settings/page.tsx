"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/client";

interface Settings {
  websiteName: string;
  seoTitle: string;
  seoDescription: string;
  contactEmail: string;
  maintenanceMode: boolean;
  socialLinks: { x: string; github: string };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch<{ data: Settings }>("/settings").then((body) => setSettings(body.data)).catch((cause) => setMessage(cause.message));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    const form = new FormData(event.currentTarget);
    try {
      const body = await adminFetch<{ data: Settings }>("/settings", {
        method: "PUT",
        body: JSON.stringify({
          websiteName: form.get("websiteName"),
          seoTitle: form.get("seoTitle"),
          seoDescription: form.get("seoDescription"),
          contactEmail: form.get("contactEmail"),
          maintenanceMode: form.get("maintenanceMode") === "on",
          socialLinks: { x: String(form.get("x") || ""), github: String(form.get("github") || "") },
        }),
      });
      setSettings(body.data);
      setMessage("Settings saved.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Save failed.");
    }
  }

  if (!settings) return <p className="text-sm text-muted">{message || "Loading settings…"}</p>;
  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <label className="block text-sm font-medium">Website name<input name="websiteName" defaultValue={settings.websiteName} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" /></label>
      <label className="block text-sm font-medium">SEO title<input name="seoTitle" defaultValue={settings.seoTitle} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" /></label>
      <label className="block text-sm font-medium">SEO description<textarea name="seoDescription" defaultValue={settings.seoDescription} rows={3} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" /></label>
      <label className="block text-sm font-medium">Contact email<input name="contactEmail" type="email" defaultValue={settings.contactEmail} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" /></label>
      <label className="block text-sm font-medium">X link<input name="x" defaultValue={settings.socialLinks.x} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" /></label>
      <label className="block text-sm font-medium">GitHub link<input name="github" defaultValue={settings.socialLinks.github} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" /></label>
      <label className="flex items-center gap-2 text-sm"><input name="maintenanceMode" type="checkbox" defaultChecked={settings.maintenanceMode} /> Maintenance mode</label>
      {message ? <p className="text-sm">{message}</p> : null}
      <button className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">Save settings</button>
    </form>
  );
}
