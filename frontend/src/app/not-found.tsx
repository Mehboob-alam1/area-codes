import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold">That page is not in the directory</h1>
      <p className="mt-3 text-muted">The address may be unpublished, or the record was never created. The site does not substitute a similar code.</p>
      <Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Back to search</Link>
    </main>
  );
}
