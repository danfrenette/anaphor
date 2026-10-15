import "server-only";
import { createHash } from "node:crypto";
import { get, put } from "@vercel/blob";
import { z } from "zod";
import { requireTourOwner } from "./auth";
import { tourDatabase } from "./database";
import { tourAsset, tourDocument } from "./document";
import { handlePrivate, privateHeaders, privateJson, validWriteOrigin } from "./publication";
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
          return privateJson({ error: "Hosted uploads support at most 4 MiB per asset. Compress this capture; the larger original remains available locally." }, 413);
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
    const blob = await get(stored.storage_key, { access: "private" });
    if (!blob || !blob.stream) return privateJson({ error: "Evidence asset is unavailable." }, 404);
    const bytes = new Uint8Array(await new Response(blob.stream).arrayBuffer());
    if (bytes.length !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256) return privateJson({ error: "Evidence asset failed integrity verification." }, 503);
    const response = mediaResponse(bytes, asset.mediaType, request);
    for (const [name,value] of Object.entries(privateHeaders)) response.headers.set(name,value);
    return response;
  });
}
