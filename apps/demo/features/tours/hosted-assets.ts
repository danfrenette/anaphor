import "server-only";
import { createHash } from "node:crypto";
import { get, head, put } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { z } from "zod";
import { requireTourOwner } from "./auth";
import { tourDatabase } from "./database";
import { tourAsset, tourDocument } from "./document";
import { handlePrivate, privateHeaders, privateJson, validWriteOrigin, boundedBody } from "./publication";
import { validateAssetBytes } from "./bundle-validation";
import { mediaResponse } from "./media-response";

export const maxHostedAssetBytes = 4 * 1024 * 1024;
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);

export function uploadHostedAsset(request: Request, hash: string) {
  return handlePrivate(async () => {
    const { owner } = await requireTourOwner(request.headers);
    if (!validWriteOrigin(request)) return privateJson({ error: "Wrong origin." }, 403);
    const mediaType = tourAsset.shape.mediaType.safeParse(request.headers.get("content-type"));
    if (!hashSchema.safeParse(hash).success || !mediaType.success) return privateJson({ error: "Supply a SHA-256 asset ID and a supported Content-Type." }, 422);
    const reader = request.body?.getReader();
    if (!reader) return privateJson({ error: "Supply asset bytes." }, 422);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxHostedAssetBytes) {
          await reader.cancel();
          return privateJson({ error: "Server-proxied uploads support at most 4 MiB. Use the tour publish CLI for direct private uploads up to 100 MiB." }, 413);
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = Buffer.concat(chunks);
    if (!size || createHash("sha256").update(bytes).digest("hex") !== hash) return privateJson({ error: "Asset bytes do not match the supplied SHA-256." }, 422);
    try { validateAssetBytes({ id: "upload", sha256: hash, bytes: size, mediaType: mediaType.data, description: "Upload", caption: "Upload", provenance: "Upload" }, bytes); }
    catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Invalid media bytes." }, 422); }
    const previous = (await tourDatabase().query("SELECT bytes, media_type FROM anaphor_tour_asset WHERE owner=$1 AND sha256=$2", [owner,hash])).rows[0];
    if (previous) return Number(previous.bytes) === size && previous.media_type === mediaType.data ? privateJson({ sha256: hash }, 201) : privateJson({ error: "This asset hash already has different metadata." }, 409);
    const saved = await put(`tours/${owner}/${hash}`, bytes, { access: "private", contentType: mediaType.data, addRandomSuffix: true });
    await tourDatabase().query("INSERT INTO anaphor_tour_asset (owner,sha256,bytes,media_type,storage_key) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING", [owner,hash,size,mediaType.data,saved.pathname]);
    return privateJson({ sha256: hash }, 201);
  });
}

export function readHostedAsset(request: Request, id: string, assetId: string, revision: string) {
  return handlePrivate(async () => {
    const { owner } = await requireTourOwner(request.headers);
    if (!z.uuid().safeParse(id).success || !/^[1-9][0-9]*$/.test(revision)) return privateJson({ error: "Asset not found." }, 404);
    const row = (await tourDatabase().query(`SELECT r.document FROM anaphor_tour_revision r
      JOIN anaphor_tour t ON t.id=r.tour_id WHERE t.id=$1 AND t.owner=$2 AND r.revision=$3`, [id,owner,revision])).rows[0];
    const document = row ? tourDocument.parse(row.document) : null;
    const asset = document?.version === 2 ? document.assets.find((entry) => entry.id === assetId) : null;
    if (!asset) return privateJson({ error: "Asset not found." }, 404);
    const stored = (await tourDatabase().query("SELECT storage_key FROM anaphor_tour_asset WHERE owner=$1 AND sha256=$2", [owner,asset.sha256])).rows[0];
    if (!stored) return privateJson({ error: "Evidence asset is unavailable." }, 404);
    if (request.method === "HEAD") {
      const metadata = await head(stored.storage_key);
      if (metadata.size !== asset.bytes || metadata.contentType !== asset.mediaType) return privateJson({ error: "Evidence asset metadata does not match its registration." }, 503);
      return new Response(null, { headers: { ...privateHeaders, "Content-Type": asset.mediaType, "Content-Length": String(asset.bytes), "Accept-Ranges": "bytes" } });
    }
    const blob = await get(stored.storage_key, { access: "private" });
    if (!blob || !blob.stream) return privateJson({ error: "Evidence asset is unavailable." }, 404);
    const bytes = await boundedMediaBytes(blob.stream, asset.bytes);
    if (bytes.length !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256) return privateJson({ error: "Evidence asset failed integrity verification." }, 503);
    const response = mediaResponse(bytes, asset.mediaType, request);
    for (const [name,value] of Object.entries(privateHeaders)) response.headers.set(name,value);
    return response;
  });
}

const uploadDescription = tourAsset.pick({ mediaType: true, bytes: true });

export function prepareHostedUpload(request: Request, hash: string) {
  return handlePrivate(async () => {
    const { owner } = await requireTourOwner(request.headers);
    if (!validWriteOrigin(request)) return privateJson({ error: "Wrong origin." }, 403);
    const body = await boundedBody(request);
    const input = body === null ? null : uploadDescription.safeParse(JSON.parse(body));
    if (!hashSchema.safeParse(hash).success || !input?.success) return privateJson({ error: "Supply the SHA-256, supported mediaType and bytes (maximum 100 MiB)." }, 422);
    const pathname = `tours/${owner}/${hash}`;
    const token = await generateClientTokenFromReadWriteToken({ pathname, allowedContentTypes: [input.data.mediaType], maximumSizeInBytes: input.data.bytes,
      validUntil: Date.now() + 10 * 60 * 1000, addRandomSuffix: false, allowOverwrite: false });
    return privateJson({ pathname, token });
  });
}

export function completeHostedUpload(request: Request, hash: string) {
  return handlePrivate(async () => {
    const { owner } = await requireTourOwner(request.headers);
    if (!validWriteOrigin(request)) return privateJson({ error: "Wrong origin." }, 403);
    const body = await boundedBody(request);
    const input = body === null ? null : uploadDescription.safeParse(JSON.parse(body));
    if (!hashSchema.safeParse(hash).success || !input?.success) return privateJson({ error: "Supply the SHA-256, supported mediaType and bytes (maximum 100 MiB)." }, 422);
    const previous = (await tourDatabase().query("SELECT bytes, media_type FROM anaphor_tour_asset WHERE owner=$1 AND sha256=$2", [owner,hash])).rows[0];
    if (previous) return Number(previous.bytes) === input.data.bytes && previous.media_type === input.data.mediaType ? privateJson({ sha256: hash }, 201) : privateJson({ error: "This asset hash already has different metadata." }, 409);
    const pathname = `tours/${owner}/${hash}`;
    const blob = await get(pathname, { access: "private", useCache: false });
    if (!blob?.stream) return privateJson({ error: "Upload is not available yet. Retain the bundle and retry completion." }, 404);
    try {
      const bytes = await boundedMediaBytes(blob.stream, input.data.bytes);
      validateAssetBytes({ id: "upload", sha256: hash, ...input.data, description: "Upload", caption: "Upload", provenance: "Upload" }, bytes);
    } catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Uploaded media failed verification." }, 422); }
    await tourDatabase().query("INSERT INTO anaphor_tour_asset (owner,sha256,bytes,media_type,storage_key) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING", [owner,hash,input.data.bytes,input.data.mediaType,pathname]);
    return privateJson({ sha256: hash }, 201);
  });
}

async function boundedMediaBytes(stream: ReadableStream<Uint8Array>, maximum: number) {
  const reader = stream.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks);
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); throw new Error("Uploaded media exceeds its declared byte count."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
}
