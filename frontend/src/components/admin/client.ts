"use client";

export function token() {
  return typeof window === "undefined" ? "" : localStorage.getItem("wacd_token") || "";
}

export function setToken(value: string) {
  localStorage.setItem("wacd_token", value);
  localStorage.setItem("wacd_admin", "");
}

export function clearToken() {
  localStorage.removeItem("wacd_token");
}

export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/backend-api/v1/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (response.status === 401 && path !== "/auth/login") {
    clearToken();
    window.location.href = "/admin/login";
    throw new Error("Sign in to continue.");
  }
  if (!response.ok) throw new Error(body?.error?.message || "Request failed.");
  return body as T;
}
