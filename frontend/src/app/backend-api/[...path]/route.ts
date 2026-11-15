import { directoryFetch } from "@/lib/directory-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const target = `/api/${path.join("/")}${incoming.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const response = await directoryFetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
    });
    const body = await response.arrayBuffer();
    const outgoing = new Headers();
    const type = response.headers.get("content-type");
    if (type) outgoing.set("content-type", type);
    return new Response(body, { status: response.status, headers: outgoing });
  } catch {
    return Response.json(
      { success: false, error: { code: "UNAVAILABLE", message: "The directory API is not running." } },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
