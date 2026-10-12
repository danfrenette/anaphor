import { accessFor, currentPrincipal, isTourId } from "../../../../lib/tours/auth";
import { tourJson } from "../../../../lib/tours/http";
import { readTour } from "../../../../lib/tours/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = accessFor(await currentPrincipal());
  if (access === "unauthenticated") {
    return tourJson(401, { error: "unauthenticated", message: "Sign in or present an agent credential." });
  }
  if (access === "forbidden") {
    return tourJson(403, { error: "forbidden", message: "This account cannot read private tours." });
  }

  const { id } = await context.params;
  if (!isTourId(id)) return tourJson(404, { error: "not_found", message: "This tour is unavailable." });
  try {
    const document = await readTour(id.toLowerCase());
    if (!document) return tourJson(404, { error: "not_found", message: "This tour is unavailable." });
    return tourJson(200, document);
  } catch (error) {
    console.error("tour read failed", error instanceof Error ? error.name : "unknown");
    return tourJson(503, { error: "storage_unavailable", message: "Tour storage is unavailable." });
  }
}
