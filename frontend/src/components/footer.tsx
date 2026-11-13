import Link from "next/link";

const columns = [
  {
    title: "Directory",
    links: [
      ["/countries", "All countries"],
      ["/area-codes", "Area codes"],
      ["/phone-lookup", "Phone lookup"],
      ["/compare", "Compare countries"],
    ],
  },
  {
    title: "Reference",
    links: [
      ["/data-sources", "Data sources"],
      ["/methodology", "Methodology"],
      ["/faq", "FAQ"],
      ["/about", "About"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["/privacy-policy", "Privacy"],
      ["/terms-and-conditions", "Terms"],
      ["/disclaimer", "Disclaimer"],
      ["/contact", "Contact"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-semibold">World Area Code Directory</p>
          <p className="mt-2 text-sm text-muted">Calling codes and regional numbering records, shown only when a source is on file.</p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {column.links.map(([href, label]) => (
                <li key={href}><Link href={href} className="hover:text-foreground">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">Not affiliated with the ITU, national regulators or any carrier.</div>
    </footer>
  );
}
