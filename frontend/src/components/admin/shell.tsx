"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, token } from "@/components/admin/client";

const links = [
  ["/admin", "Overview"],
  ["/admin/countries", "Countries"],
  ["/admin/regions", "Regions"],
  ["/admin/cities", "Cities"],
  ["/admin/area-codes", "Area codes"],
  ["/admin/imports", "Imports"],
  ["/admin/users", "Users"],
  ["/admin/analytics", "Analytics"],
  ["/admin/audit", "Audit log"],
  ["/admin/settings", "Settings"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    if (!token()) router.replace("/admin/login");
    else setReady(true);
  }, [pathname, router]);

  if (!ready) return <p className="p-8 text-sm text-muted">Checking session…</p>;
  if (pathname === "/admin/login") return <div className="min-h-screen bg-background">{children}</div>;

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-surface p-4 md:border-b-0 md:border-r">
        <p className="px-2 text-sm font-semibold">Directory admin</p>
        <nav className="mt-4 grid gap-1" aria-label="Admin">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`rounded-lg px-2 py-2 text-sm ${pathname === href ? "bg-background font-medium" : "text-muted hover:text-foreground"}`}>{label}</Link>
          ))}
        </nav>
        <button type="button" className="mt-6 px-2 text-sm text-muted" onClick={() => { clearToken(); router.replace("/admin/login"); }}>Sign out</button>
        <Link href="/" className="mt-3 block px-2 text-sm text-primary">View site</Link>
      </aside>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}
