import { NextResponse, type NextRequest } from "next/server";
import { ownerLogin, safeTourPath, sessionCookie, testIdentityEnabled } from "../../../../lib/tours/auth";
import { tourJson } from "../../../../lib/tours/http";
import { publicOrigin } from "../../../../lib/tours/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!testIdentityEnabled()) return tourJson(404, { error: "not_found", message: "Not found." });
  const login = request.nextUrl.searchParams.get("login");
  if (!login || (login !== ownerLogin() && login !== "other")) {
    return tourJson(400, { error: "invalid_login", message: "Choose Dan or another test account." });
  }
  const returnTo = safeTourPath(request.nextUrl.searchParams.get("returnTo"));
  const cookie = await sessionCookie(login, publicOrigin(request).startsWith("https://"));
  if (!cookie) return tourJson(503, { error: "session_unavailable", message: "Session signing is not configured." });
  const response = NextResponse.redirect(new URL(returnTo, publicOrigin(request)));
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
