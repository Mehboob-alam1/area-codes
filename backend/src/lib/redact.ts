import { createHash } from "crypto";

export function redactSearchQuery(query: string) {
  const digits = query.replace(/\D/g, "");
  if (digits.length >= 8) {
    const hash = createHash("sha256").update(query).digest("hex").slice(0, 12);
    return { stored: `redacted:phone:${hash}`, searchType: "phone" };
  }
  const compact = query.trim().replace(/\s+/g, " ").slice(0, 160);
  const searchType = compact.startsWith("+") || /^\d{2,4}$/.test(compact.replace(/\s/g, "")) ? "code" : "text";
  return { stored: compact, searchType };
}
