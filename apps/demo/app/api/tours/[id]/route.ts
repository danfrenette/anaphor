import { getTour, updateTour } from "@/features/tours/publication";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return getTour(request, (await context.params).id);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return updateTour(request, (await params).id);
}
