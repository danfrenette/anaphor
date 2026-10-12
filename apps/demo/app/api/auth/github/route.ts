import { NextResponse, type NextRequest } from "next/server";
import { githubConfigured, oauthStateCookie, safeTourPath } from "../../../../lib/tours/auth";
import { publicOrigin } from "../../../../lib/tours/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unavailable = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Sign-in unavailable</title></head><body><h1>Sign-in unavailable</h1><p>GitHub sign-in is not configured for this deployment.</p></body></html>";

export async function GET(request: NextRequest) {
  if (!githubConfigured()) {
    return new Response(unavailable, {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" },
    });
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response(unavailable, {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" },
    });
  }
  const returnTo = safeTourPath(request.nextUrl.searchParams.get("returnTo"));
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const secure = publicOrigin(request).startsWith("https://");
  const stateCookie = await oauthStateCookie({ nonce, returnTo }, secure);
  if (!stateCookie) {
    return new Response(unavailable, {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" },
    });
  }
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", new URL("/api/auth/github/callback", publicOrigin(request)).toString());
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("state", nonce);
  const response = NextResponse.redirect(authorize);
  response.cookies.set(stateCookie.name, stateCookie.value, stateCookie.options);
  return response;
}
