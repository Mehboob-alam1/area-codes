import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function verificationLabel(status: string) {
  if (status === "verified") return "Verified";
  if (status === "pending") return "Unverified";
  if (status === "outdated") return "Outdated";
  if (status === "conflicting") return "Conflicting";
  if (status === "rejected") return "Rejected";
  return status;
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}
