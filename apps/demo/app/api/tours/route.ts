import { accessFor, configuredSecrets, currentPrincipal } from "../../../lib/tours/auth";
import { validateTour } from "../../../lib/tours/document";
import { readJson, tourJson } from "../../../lib/tours/http";
import { createTour, tourUrl } from "../../../lib/tours/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = accessFor(await currentPrincipal());
  if (access === "unauthenticated") {
    return tourJson(401, { error: "unauthenticated", message: "Sign in or present an agent credential." });
  }
  if (access === "forbidden") {
    return tourJson(403, { error: "forbidden", message: "This account cannot publish private tours." });
  }

  const body = await readJson(request);
  if (!body.ok) {
    return tourJson(422, {
      error: "invalid_tour",
      message: "The tour document is invalid.",
      diagnostics: [{ path: "", message: body.message }],
    });
  }
  const validated = validateTour(body.value, configuredSecrets());
  if (!validated.ok) {
    return tourJson(422, {
      error: "invalid_tour",
      message: "The tour document is invalid.",
      diagnostics: validated.diagnostics,
    });
  }

  try {
    const id = await createTour(validated.document);
    const url = tourUrl(request, id);
    return tourJson(201, { id, url });
  } catch (error) {
    console.error("tour publish failed", error instanceof Error ? error.name : "unknown");
    return tourJson(503, { error: "storage_unavailable", message: "Tour storage is unavailable." });
  }
}
