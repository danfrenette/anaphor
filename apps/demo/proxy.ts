import { NextResponse } from "next/server";

export function proxy() {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/tour/:path*", "/api/tours/:path*", "/api/auth/:path*"],
};
