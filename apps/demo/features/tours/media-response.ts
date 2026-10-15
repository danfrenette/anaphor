export function mediaResponse(bytes: Uint8Array, mediaType: string, request: Request): Response {
  const headers = new Headers({
    "Content-Type": mediaType,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  });
  const range = request.headers.get("range");
  let start = 0;
  let end = bytes.length - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return unsatisfied(headers, bytes.length);
    if (!match[1]) start = Math.max(0, bytes.length - Number(match[2]));
    else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(end, Number(match[2]));
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.length) return unsatisfied(headers, bytes.length);
    headers.set("Content-Range", `bytes ${start}-${end}/${bytes.length}`);
  }
  headers.set("Content-Length", String(end - start + 1));
  return new Response(request.method === "HEAD" ? null : new Uint8Array(bytes.subarray(start, end + 1)), { status: range ? 206 : 200, headers });
}

function unsatisfied(headers: Headers, size: number) {
  headers.set("Content-Range", `bytes */${size}`);
  return new Response(null, { status: 416, headers });
}
