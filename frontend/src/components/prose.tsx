export function Prose({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      {lede ? <p className="mt-4 text-lg text-muted">{lede}</p> : null}
      <div className="mt-8 space-y-4 text-muted [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </article>
  );
}
