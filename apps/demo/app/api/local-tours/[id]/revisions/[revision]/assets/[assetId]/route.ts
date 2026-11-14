import { localPreviewAllowed } from "@/features/tours/local-access";
import { readLocalAsset } from "@/features/tours/local-store";
import { mediaResponse } from "@/features/tours/media-response";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; revision: string; assetId: string }> }) {
  if (!localPreviewAllowed(request.headers)) return new Response(null, { status: 404 });
  const { id, revision, assetId } = await params;
  if (!/^[1-9][0-9]*$/.test(revision)) return new Response(null, { status: 404 });
  const result = await readLocalAsset(id, Number(revision), assetId).catch(() => null);
  if (!result) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return mediaResponse(result.bytes, result.asset.mediaType, request);
}
export const HEAD = GET;
