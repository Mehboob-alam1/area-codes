"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Moon, Phone, Sun, X } from "lucide-react";

const links = [
  { href: "/countries", label: "Countries" },
  { href: "/area-codes", label: "Area codes" },
  { href: "/phone-lookup", label: "Phone lookup" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
            <Phone size={18} aria-hidden />
          </span>
          <span className="hidden sm:inline">World Area Code Directory</span>
          <span className="sm:hidden">Area Codes</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname.startsWith(link.href) ? "bg-background text-foreground" : "text-muted hover:text-foreground"}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={toggleTheme} className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-border lg:ml-2" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
          <Sun size={16} className="hidden dark:block" />
          <Moon size={16} className="dark:hidden" />
        </button>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open ? (
        <nav className="border-t border-border px-4 py-3 lg:hidden" aria-label="Mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-sm font-medium">
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
