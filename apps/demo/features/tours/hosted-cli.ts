import { readFile } from "node:fs/promises";
import axios, { type AxiosInstance } from "axios";
import { put } from "@vercel/blob/client";
import { z } from "zod";
import { publicationResult, tourDocument } from "./document";
import { validatePreparedBundle } from "./local-store";

export async function publishHostedTour(http: AxiosInstance, file: string, key: string, options: { id?: string; expectedRevision?: number } = {}) {
  if (options.id && !options.expectedRevision) throw new Error("Hosted updates require --expected-revision from the last hosted result.");
  const input: unknown = JSON.parse(await readFile(file, "utf8"));
  const raw = tourDocument.safeParse(input);
  const bundle = raw.success ? { document: raw.data, assets: new Map<string, Buffer>() } : await validatePreparedBundle(file);
  const assets = bundle.document.version === 2 ? bundle.document.assets : [];
  for (const asset of assets) {
    const bytes = bundle.assets.get(asset.id);
    if (!bytes) throw new Error(`Asset ${asset.id} requires a bundle files manifest. Publish the prepared local bundle.`);
    if (asset.bytes <= 4 * 1024 * 1024) {
      await http.put(`/api/tours/assets/${asset.sha256}`, bytes, { timeout: 60_000, headers: { "Content-Type": asset.mediaType }, maxBodyLength: 4 * 1024 * 1024 });
      continue;
    }
    const description = { mediaType: asset.mediaType, bytes: asset.bytes };
    const completion = `/api/tours/assets/${asset.sha256}/complete`;
    try { await http.post(completion, description, { timeout: 120_000 }); continue; }
    catch (error) { if (!axios.isAxiosError(error) || error.response?.status !== 404) throw error; }
    const grant = z.object({ pathname: z.string().min(1), token: z.string().min(1) }).parse((await http.post(`/api/tours/assets/${asset.sha256}/prepare`, description)).data);
    await put(grant.pathname, bytes, { access: "private", token: grant.token, contentType: asset.mediaType, multipart: true });
    await http.post(completion, description, { timeout: 120_000 });
  }
  const headers = { "Idempotency-Key": key };
  const result = options.id
    ? await http.patch(`/api/tours/${options.id}`, { document: bundle.document, expectedRevision: options.expectedRevision }, { headers })
    : await http.post("/api/tours", bundle.document, { headers });
  return publicationResult.parse(result.data);
}
