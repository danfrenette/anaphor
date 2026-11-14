import { uploadHostedAsset } from "../../../../../features/tours/hosted-assets";
export async function PUT(request: Request, { params }: { params: Promise<{ hash: string }> }) {
  return uploadHostedAsset(request, (await params).hash);
}
