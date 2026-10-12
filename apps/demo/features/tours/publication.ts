import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { tourDatabase } from "./database";
import { maxDocumentBytes, tourDocument, storedTour } from "./document";
import { getTourAuth, PrivateAccessError, requireTourOwner, tourOrigin } from "./auth";

const privateHeaders = { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Vary": "Cookie, Authorization" };
export function privateJson(body: unknown, status = 200) { return Response.json(body, { status, headers: privateHeaders }); }

export async function readTour(id: string, owner: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const result = await tourDatabase().query('SELECT id, revision, document FROM anaphor_tour WHERE id = $1 AND owner = $2', [id, owner]);
  const row = result.rows[0];
  return row ? storedTour.parse({ ...row, url: `${tourOrigin()}/tour/${row.id}` }) : null;
}

async function handlePrivate(action: () => Promise<Response>) {
  try { return await action(); } catch (error) {
    if (error instanceof PrivateAccessError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: "Supply a JSON document." }, 422);
    console.error("Private tour request failed", error instanceof Error ? error.name : "UnknownError");
    return privateJson({ error: "Private tours are temporarily unavailable. Preserve your document and retry after recovery." }, 503);
  }
}

export function createTour(request: Request) {
  return handlePrivate(async () => {
    const { owner } = await requireTourOwner(request.headers);
    if (request.headers.get("host") !== new URL(tourOrigin()).host
      || (request.headers.get("origin") && request.headers.get("origin") !== tourOrigin())) return privateJson({ error: "Wrong origin." }, 403);
    if (!request.headers.has("authorization") && request.headers.get("origin") !== tourOrigin()) return privateJson({ error: "Origin is required." }, 403);
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[a-zA-Z0-9_-]{8,200}$/.test(key)) return privateJson({ error: "Supply an Idempotency-Key of 8–200 letters, digits, underscores or hyphens." }, 422);
    const body = await boundedBody(request);
    if (body === null) return privateJson({ error: "Document exceeds 1 MiB. Shorten the content before publication." }, 413);
    const validated = tourDocument.safeParse(JSON.parse(body));
    if (!validated.success) return privateJson({ error: "Invalid tour document.", diagnostics: validated.error.issues }, 422);
    const document = JSON.stringify(validated.data);
    const hash = createHash("sha256").update(document).digest("hex");
    const result = await tourDatabase().query<{ id: string; revision: number }>(`
      INSERT INTO anaphor_tour (id, owner, operation_key, content_hash, document)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (owner, operation_key) DO UPDATE SET operation_key = EXCLUDED.operation_key
      WHERE anaphor_tour.content_hash = EXCLUDED.content_hash
      RETURNING id, revision`, [randomUUID(), owner, key, hash, document]);
    const row = result.rows[0];
    if (!row) return privateJson({ error: "This idempotency key already belongs to different content. Inspect the original operation." }, 409);
    return privateJson({ ...row, url: `${tourOrigin()}/tour/${row.id}` }, 201);
  });
}

async function boundedBody(request: Request) {
  if (Number(request.headers.get("content-length")) > maxDocumentBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > maxDocumentBytes) { await reader.cancel(); return null; }
      text += decoder.decode(value, { stream: true });
    }
  } finally { reader.releaseLock(); }
}

export function revokePrivateSession(request: Request) {
  return handlePrivate(async () => {
    if (request.headers.get("host") !== new URL(tourOrigin()).host
      || (!request.headers.has("authorization") && request.headers.get("origin") !== tourOrigin())) return privateJson({ error: "Wrong origin." }, 403);
    const auth = getTourAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      if (session.session.origin !== tourOrigin()) return privateJson({ error: "Wrong credential origin." }, 403);
      await auth.api.revokeSession({ headers: request.headers, body: { token: session.session.token } });
      if (await auth.api.getSession({ headers: request.headers })) throw new Error("Session revocation could not be confirmed.");
    }
    const cookies = await auth.api.signOut({ headers: request.headers, asResponse: true });
    const response = privateJson({ revoked: true });
    for (const cookie of cookies.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
    return response;
  });
}

export function getTour(request: Request, id: string) {
  return handlePrivate(async () => {
    const { owner } = await requireTourOwner(request.headers);
    const tour = await readTour(id, owner);
    return tour ? privateJson(tour) : privateJson({ error: "Tour not found." }, 404);
  });
}

export function getPrivateSession(request: Request) {
  return handlePrivate(async () => privateJson(await requireTourOwner(request.headers)));
}
