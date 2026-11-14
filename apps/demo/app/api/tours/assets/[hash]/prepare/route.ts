import { prepareHostedUpload } from "../../../../../../features/tours/hosted-assets";
export async function POST(request: Request, { params }: { params: Promise<{ hash: string }> }) {
  return prepareHostedUpload(request, (await params).hash);
}
