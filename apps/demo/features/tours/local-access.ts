import "server-only";

export function localPreviewAllowed(headers: Headers) {
  if (process.env.ANAPHOR_LOCAL_PREVIEW !== "1" || process.env.NODE_ENV !== "development" || process.env.VERCEL) return false;
  const host = headers.get("host");
  if (!host || !/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host)) return false;
  const origin = headers.get("origin");
  if (origin && origin !== `http://${host}`) return false;
  const forwarded = headers.get("x-forwarded-host");
  if (forwarded && forwarded !== host) return false;
  const site = headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}
