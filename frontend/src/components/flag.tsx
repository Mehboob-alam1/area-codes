"use client";

import { useState } from "react";

export function Flag({ src, emoji, name }: { src?: string | null; emoji?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="inline-grid h-8 w-12 place-items-center rounded-md bg-background text-xl" title={name} aria-hidden>{emoji || "🏳️"}</span>;
  }
  return <img src={src} alt="" width={64} height={48} onError={() => setFailed(true)} className="h-8 w-12 rounded-md object-cover shadow-sm" />;
}
