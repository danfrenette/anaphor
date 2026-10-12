export function tourJson(status: number, body: object) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

export async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; message: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { ok: false, message: "Content-Type must be application/json." };
  }
  const raw = await request.text();
  if (raw.length > 256_000) return { ok: false, message: "Tour documents must be at most 256000 characters of JSON." };
  try {
    const value: unknown = JSON.parse(raw);
    return { ok: true, value };
  } catch {
    return { ok: false, message: "The request body must be valid JSON." };
  }
}
