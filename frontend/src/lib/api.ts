export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = process.env.API_INTERNAL_URL || "http://127.0.0.1:5000";
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1${path}`, { cache: "no-store" });
  } catch {
    throw new ApiError(503, "The directory API is not running.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body?.error?.message || "The directory could not complete that request.");
  }
  return body as T;
}

export function clientApi(path: string) {
  return `/backend-api/v1${path}`;
}
