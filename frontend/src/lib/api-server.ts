import { ApiError } from "@/lib/api";
import { directoryFetch } from "@/lib/directory-server";

export { ApiError };

export async function apiGet<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await directoryFetch(`/api/v1${path}`);
  } catch {
    throw new ApiError(503, "The directory API is not running.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body?.error?.message || "The directory could not complete that request.");
  }
  return body as T;
}
