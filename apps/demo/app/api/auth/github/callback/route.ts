import { NextResponse, type NextRequest } from "next/server";
import { githubConfigured, oauthCookieName, readOauthState, safeEqual, safeTourPath, sessionCookie } from "../../../../../lib/tours/auth";
import { publicOrigin } from "../../../../../lib/tours/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const state = await readOauthState();
  const returned = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const returnTo = safeTourPath(state?.returnTo ?? null);
  const failed = () => {
    const destination = new URL(returnTo, publicOrigin(request));
    destination.searchParams.set("sign-in", "failed");
    const response = NextResponse.redirect(destination);
    response.cookies.delete({ name: oauthCookieName, path: "/" });
    return response;
  };
  if (!state || !returned || !safeEqual(state.nonce, returned) || !code || !githubConfigured()) return failed();

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return failed();
  const response = NextResponse.redirect(new URL(returnTo, publicOrigin(request)));
  response.cookies.delete({ name: oauthCookieName, path: "/" });
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: new URL("/api/auth/github/callback", publicOrigin(request)).toString(),
      }),
    });
    const tokenJson: unknown = await tokenResponse.json().catch(() => null);
    const accessToken = readString(tokenJson, "access_token");
    if (!accessToken) return failed();

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${accessToken}`,
        "user-agent": "anaphor-tours",
      },
    });
    const userJson: unknown = await userResponse.json().catch(() => null);
    const login = readString(userJson, "login");
    if (!login) return failed();
    const cookie = await sessionCookie(login, publicOrigin(request).startsWith("https://"));
    if (!cookie) return failed();
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("github sign-in failed", error instanceof Error ? error.name : "unknown");
    return failed();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, key: string): string | null {
  if (!isRecord(value) || !(key in value)) return null;
  const candidate = value[key];
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}
