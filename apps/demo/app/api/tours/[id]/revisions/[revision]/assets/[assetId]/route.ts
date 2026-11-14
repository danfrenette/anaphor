import { readHostedAsset } from "../../../../../../../../features/tours/hosted-assets";
export async function GET(request: Request, { params }: { params: Promise<{ id: string; revision: string; assetId: string }> }) {
  const { id, revision, assetId } = await params;
  return readHostedAsset(request, id, assetId, revision);
}
export const HEAD = GET;
