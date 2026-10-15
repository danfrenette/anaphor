import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { tourDatabase } from "./database";
import { maxDocumentBytes, tourDocument, storedTour } from "./document";
import { validateTourUpdate } from "./bundle-validation";
import { getTourAuth, PrivateAccessError, requireTourOwner, tourOrigin } from "./auth";

export const privateHeaders = { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Vary": "Cookie, Authorization" };
export function privateJson(body: unknown, status = 200) { return Response.json(body, { status, headers: privateHeaders }); }

export async function readTour(id: string, owner: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const result = await tourDatabase().query('SELECT id, revision, document FROM anaphor_tour WHERE id = $1 AND owner = $2', [id, owner]);
  const row = result.rows[0];
  return row ? storedTour.parse({ ...row, url: `${tourOrigin()}/tour/${row.id}` }) : null;
}

export async function handlePrivate(action: () => Promise<Response>) {
  try { return await action(); } catch (error) {
    if (error instanceof PrivateAccessError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: "Supply a JSON document." }, 422);
    console.error("Private tour request failed", error instanceof Error ? error.name : "UnknownError");
    return privateJson({ error: "Private tours are temporarily unavailable. Preserve your document and retry after recovery." }, 503);
  }
}

export function validWriteOrigin(request: Request) {
  return request.headers.get("host") === new URL(tourOrigin()).host
    && (!request.headers.get("origin") || request.headers.get("origin") === tourOrigin())
    && (request.headers.has("authorization") || request.headers.get("origin") === tourOrigin());
}

export function createTour(request: Request) { return publishTour(request); }
export function updateTour(request: Request, id: string) { return publishTour(request, id); }

function publishTour(request: Request, id?: string) {
  return handlePrivate(async () => {
    const { owner } = await requireTourOwner(request.headers);
    if (!validWriteOrigin(request)) return privateJson({ error: "Wrong origin." }, 403);
    if (id && !z.uuid().safeParse(id).success) return privateJson({ error: "Tour not found." }, 404);
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[a-zA-Z0-9_-]{8,200}$/.test(key)) return privateJson({ error: "Supply an Idempotency-Key of 8–200 letters, digits, underscores or hyphens." }, 422);
    const body = await boundedBody(request);
    if (body === null) return privateJson({ error: "Document exceeds 1 MiB. Shorten the content before publication." }, 413);
    const input: unknown = JSON.parse(body);
    const envelope = id ? z.object({ document: tourDocument, expectedRevision: z.number().int().positive() }).strict().safeParse(input) : null;
    const validated = id ? envelope : tourDocument.safeParse(input);
    if (!validated?.success) return privateJson({ error: "Invalid tour document.", diagnostics: validated?.error.issues }, 422);
    const next = id ? envelope!.data!.document : tourDocument.parse(input);
    const expectedRevision = id ? envelope!.data!.expectedRevision : null;
    const document = JSON.stringify(next);
    const hash = createHash("sha256").update(JSON.stringify({ id: id ?? null, expectedRevision, document: next })).digest("hex");
    const client = await tourDatabase().connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`${owner}:${key}`]);
      const operation = (await client.query("SELECT content_hash, result FROM anaphor_tour_operation WHERE owner=$1 AND operation_key=$2", [owner, key])).rows[0];
      if (operation) {
        await client.query("ROLLBACK");
        return operation.content_hash === hash ? privateJson(operation.result, id ? 200 : 201) : privateJson({ error: "This idempotency key already belongs to different content. Inspect the original operation." }, 409);
      }
      let revision = 1;
      let tourId = id;
      if (id) {
        const legacyKey = (await client.query("SELECT id FROM anaphor_tour WHERE owner=$1 AND operation_key=$2", [owner,key])).rows[0];
        if (legacyKey) { await client.query("ROLLBACK"); return privateJson({ error: "This operation key belongs to the original creation. Use a new key for an update." }, 409); }
        const previous = (await client.query("SELECT revision, document FROM anaphor_tour WHERE id=$1 AND owner=$2 FOR UPDATE", [id, owner])).rows[0];
        if (!previous) { await client.query("ROLLBACK"); return privateJson({ error: "Tour not found." }, 404); }
        if (previous.revision !== expectedRevision) { await client.query("ROLLBACK"); return privateJson({ error: "Tour revision changed. Read the latest revision before updating.", revision: previous.revision }, 409); }
        try { validateTourUpdate(tourDocument.parse(previous.document), next); }
        catch (error) { await client.query("ROLLBACK"); return privateJson({ error: error instanceof Error ? error.message : "Invalid tour history." }, 422); }
        revision = previous.revision + 1;
        await client.query("INSERT INTO anaphor_tour_revision (tour_id, revision, document) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [id, previous.revision, previous.document]);
      }
      for (const asset of next.version === 2 ? next.assets : []) {
        const registered = (await client.query("SELECT bytes, media_type FROM anaphor_tour_asset WHERE owner=$1 AND sha256=$2", [owner, asset.sha256])).rows[0];
        if (!registered || Number(registered.bytes) !== asset.bytes || registered.media_type !== asset.mediaType) {
          await client.query("ROLLBACK");
          return privateJson({ error: `Upload verified asset ${asset.id} before publishing this document.` }, 422);
        }
      }
      if (id) {
        await client.query("UPDATE anaphor_tour SET document=$3::jsonb, revision=$4 WHERE id=$1 AND owner=$2", [id, owner, document, revision]);
      } else {
        // Preserve keys created by the original version 1 publication contract.
        const legacy = (await client.query("SELECT id, content_hash FROM anaphor_tour WHERE owner=$1 AND operation_key=$2", [owner, key])).rows[0];
        if (legacy) {
          await client.query("ROLLBACK");
          return createHash("sha256").update(document).digest("hex") === legacy.content_hash ? privateJson({ id: legacy.id, revision: 1, url: `${tourOrigin()}/tour/${legacy.id}` }, 201) : privateJson({ error: "This operation key belongs to another publication." }, 409);
        }
        tourId = randomUUID();
        await client.query("INSERT INTO anaphor_tour (id,owner,operation_key,content_hash,document) VALUES ($1,$2,$3,$4,$5::jsonb)", [tourId,owner,key,hash,document]);
      }
      const result = { id: tourId, revision, url: `${tourOrigin()}/tour/${tourId}` };
      await client.query("INSERT INTO anaphor_tour_revision (tour_id,revision,document) VALUES ($1,$2,$3::jsonb)", [tourId,revision,document]);
      await client.query("INSERT INTO anaphor_tour_operation (owner,operation_key,content_hash,result) VALUES ($1,$2,$3,$4::jsonb)", [owner,key,hash,JSON.stringify(result)]);
      await client.query("COMMIT");
      return privateJson(result, id ? 200 : 201);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  });
}

export async function boundedBody(request: Request) {
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
