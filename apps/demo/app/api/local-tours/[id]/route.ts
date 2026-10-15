import { localPreviewAllowed } from "@/features/tours/local-access";
import { readLocalTour } from "@/features/tours/local-store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!localPreviewAllowed(request.headers)) return new Response(null, { status: 404 });
  const { id } = await params;
  const tour = await readLocalTour(id).catch(() => null);
  return Response.json(tour ?? { error: "Local tour not found. Import it into the configured workspace." }, {
    status: tour ? 200 : 404, headers: { "Cache-Control": "private, no-store" },
  });
}
