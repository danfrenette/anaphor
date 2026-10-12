import { getTour } from "@/features/tours/publication";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return getTour(request, (await context.params).id);
}
