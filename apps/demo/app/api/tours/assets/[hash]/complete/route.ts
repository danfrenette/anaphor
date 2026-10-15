import { completeHostedUpload } from "../../../../../../features/tours/hosted-assets";
export async function POST(request: Request, { params }: { params: Promise<{ hash: string }> }) {
  return completeHostedUpload(request, (await params).hash);
}
