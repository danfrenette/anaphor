import { getTourAuth, tourOrigin } from "@/features/tours/auth";
async function handle(request: Request) {
  if (request.headers.get("host") !== new URL(tourOrigin()).host) return Response.json({ error: "Wrong origin." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  const response = await getTourAuth().handler(request);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}
export const GET = handle;
export const POST = handle;
