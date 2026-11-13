import Link from "next/link";
import { ClientCopy } from "@/components/copy-button";
import { cn, verificationLabel } from "@/lib/utils";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const tones = {
    neutral: "bg-background text-muted",
    success: "bg-emerald-50 text-success dark:bg-emerald-950",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-warning",
    danger: "bg-red-50 text-danger dark:bg-red-950",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function VerificationBadge({ status }: { status: string }) {
  const tone = status === "verified" ? "success" : status === "outdated" || status === "conflicting" ? "warning" : "neutral";
  return <Badge tone={tone}>{verificationLabel(status)}</Badge>;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-border bg-surface p-5 shadow-sm", className)}>{children}</div>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{body}</p>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? <Link href={item.href} className="hover:text-foreground">{item.label}</Link> : <span className="text-foreground">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  return <ClientCopy value={value} label={label} />;
}
