// @vitest-environment node
import { createHash, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
const provider = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn(), head: vi.fn(), token: vi.fn() }));
vi.mock("@vercel/blob", () => provider);
vi.mock("@vercel/blob/client", () => ({ generateClientTokenFromReadWriteToken: provider.token }));

const origin = "http://127.0.0.1:3105";
const document = {
  version: 1, title: "Hosted continuation", overview: "Preserve one review URL.",
  prs: [{ url: "https://github.com/example/demo/pull/1", base: "a".repeat(40), head: "b".repeat(40) }],
  sections: [{ id: "change", title: "Change", paragraphs: ["Atomic updates preserve the prior revision."] }],
};
describe.runIf(Boolean(process.env.TOUR_TEST_DATABASE_URL))("hosted HTTP publication with isolated Postgres", () => {
let token: string;
beforeAll(async () => {
  if (!process.env.TOUR_TEST_DATABASE_URL) throw new Error("Supply disposable TOUR_TEST_DATABASE_URL for hosted HTTP acceptance.");
  Object.assign(process.env, {
    DATABASE_URL: process.env.TOUR_TEST_DATABASE_URL, BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: "fictional-local-test-secret-at-least-32-chars",
    ANAPHOR_GOOGLE_OWNER_ID: "fixture-google", ANAPHOR_GITHUB_OWNER_ID: "fixture-github",
  });
  token = (await (await import("./test/identity")).fictionalIdentity()).token;
});
function request(path: string, body?: unknown, key = randomUUID(), auth = true, method = "POST") {
  return new Request(`${origin}${path}`, { method,
    headers: { host: "127.0.0.1:3105", ...(auth ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", "Idempotency-Key": key },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("authenticated updates keep one identity and unchanged retries return their original revision", async () => {
  const { createTour, updateTour, getTour } = await import("./publication");
  const created = await createTour(request("/api/tours", document));
  expect(created.status).toBe(201);
  const initial = await created.json();
  const key = randomUUID();
  const body = { document: { ...document, overview: "Updated value" }, expectedRevision: 1 };
  const update = await updateTour(request(`/api/tours/${initial.id}`, body, key, true, "PATCH"), initial.id);
  expect(update.status).toBe(200);
  expect(await update.json()).toEqual({ ...initial, revision: 2 });
  const retry = await updateTour(request(`/api/tours/${initial.id}`, body, key, true, "PATCH"), initial.id);
  expect(await retry.json()).toEqual({ ...initial, revision: 2 });
  expect((await updateTour(request(`/api/tours/${initial.id}`, { ...body, document }, key, true, "PATCH"), initial.id)).status).toBe(409);
  expect((await updateTour(request(`/api/tours/${initial.id}`, body, randomUUID(), true, "PATCH"), initial.id)).status).toBe(409);
  const read = await getTour(request(`/api/tours/${initial.id}`, undefined, randomUUID(), true, "GET"), initial.id);
  expect((await read.json()).document.overview).toBe("Updated value");
  expect((await updateTour(request(`/api/tours/${initial.id}`, body, randomUUID(), false, "PATCH"), initial.id)).status).toBe(401);
});

test("private immutable uploads validate hashes and reject unauthorized access", async () => {
  const { uploadHostedAsset } = await import("./hosted-assets");
  const bytes = Buffer.from(`fictional evidence-${randomUUID()}`);
  const hash = createHash("sha256").update(bytes).digest("hex");
  provider.put.mockResolvedValue({ pathname: `tours/dan/${hash}` });
  const upload = (authenticated = true, digest = hash) => uploadHostedAsset(new Request(`${origin}/api/tours/assets/${digest}`, {
    method: "PUT", headers: { host: "127.0.0.1:3105", ...(authenticated ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "text/plain" }, body: bytes,
  }), digest);
  expect((await upload(false)).status).toBe(401);
  expect((await upload(true, "a".repeat(64))).status).toBe(422);
  expect((await upload()).status).toBe(201);
  expect(provider.put).toHaveBeenCalledWith(expect.any(String), expect.any(Uint8Array), expect.objectContaining({ access: "private" }));
});

test("publication waits for private media, preserves old revisions after upload failure and pins ranged reads", async () => {
  const { createTour, updateTour, getTour } = await import("./publication");
  const { uploadHostedAsset, readHostedAsset } = await import("./hosted-assets");
  const bytes = Buffer.from(`receipt-${randomUUID()}`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const asset = { id: "receipt", mediaType: "text/plain", sha256, bytes: bytes.length, description: "Observed check", caption: "Check output", provenance: "Executed fictional HTTP test" };
  const next = { ...document, version: 2, sections: document.sections.map((section) => ({ ...section, specs: [], sources: [], decisions: [], evidenceIds: [] })), assets: [asset], evidence: [] };
  const created = await createTour(request("/api/tours", document));
  const initial = await created.json();
  const updateBody = { expectedRevision: 1, document: next };
  expect((await updateTour(request(`/api/tours/${initial.id}`, updateBody, randomUUID(), true, "PATCH"), initial.id)).status).toBe(422);
  provider.put.mockRejectedValueOnce(new Error("Fictional unavailable provider"));
  const uploadRequest = () => new Request(`${origin}/api/tours/assets/${sha256}`, { method: "PUT", headers: { host: "127.0.0.1:3105", Authorization: `Bearer ${token}`, "Content-Type": "text/plain" }, body: bytes });
  expect((await uploadHostedAsset(uploadRequest(), sha256)).status).toBe(503);
  const afterFailure = await getTour(request(`/api/tours/${initial.id}`, undefined, randomUUID(), true, "GET"), initial.id);
  expect((await afterFailure.json()).revision).toBe(1);
  provider.put.mockResolvedValue({ pathname: `private/${sha256}` });
  expect((await uploadHostedAsset(uploadRequest(), sha256)).status).toBe(201);
  expect((await updateTour(request(`/api/tours/${initial.id}`, updateBody, randomUUID(), true, "PATCH"), initial.id)).status).toBe(200);
  provider.get.mockImplementation(async () => ({ stream: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }) }));
  const readRequest = () => new Request(`${origin}/api/tours/${initial.id}/assets/receipt?revision=2`, { headers: { host: "127.0.0.1:3105", Authorization: `Bearer ${token}`, Range: "bytes=1-4" } });
  const media = await readHostedAsset(readRequest(), initial.id, "receipt", "2");
  expect(media.status).toBe(206);
  expect(await media.text()).toBe(bytes.subarray(1,5).toString());
  expect(media.headers.get("cache-control")).toContain("no-store");
  expect((await readHostedAsset(new Request(readRequest().url), initial.id, "receipt", "2")).status).toBe(401);
  expect((await readHostedAsset(readRequest(), initial.id, "receipt", "1")).status).toBe(404);
  provider.head.mockResolvedValue({ size: bytes.length, contentType: "text/plain" });
  provider.get.mockClear();
  const probe = await readHostedAsset(new Request(readRequest().url, { method: "HEAD", headers: { host: "127.0.0.1:3105", Authorization: `Bearer ${token}` } }), initial.id, "receipt", "2");
  expect(probe.status).toBe(200);
  expect(probe.headers.get("content-length")).toBe(String(bytes.length));
  expect(probe.headers.get("content-type")).toBe("text/plain");
  expect(await probe.text()).toBe("");
  expect(provider.get).not.toHaveBeenCalled();
  const headChanged = { ...next, prs: next.prs.map((pr) => ({ ...pr, head: "c".repeat(40) })) };
  expect((await updateTour(request(`/api/tours/${initial.id}`, { expectedRevision: 2, document: headChanged }, randomUUID(), true, "PATCH"), initial.id)).status).toBe(200);
  expect((await readHostedAsset(readRequest(), initial.id, "receipt", "2")).status).toBe(206);
});

test("a pre-migration creation key retains its original response after a later update", async () => {
  const { tourDatabase } = await import("./database");
  const { createTour, updateTour } = await import("./publication");
  const id = randomUUID(); const key = randomUUID();
  // Seed the original version 1 persistence boundary, before operation history existed.
  const original = JSON.stringify(document);
  await tourDatabase().query("INSERT INTO anaphor_tour (id,owner,operation_key,content_hash,document) VALUES ($1,$2,$3,$4,$5::jsonb)",
    [id,"dan",key,createHash("sha256").update(original).digest("hex"),original]);
  const result = { id, revision: 1, url: `${origin}/tour/${id}` };
  const firstRetry = await createTour(request("/api/tours", document, key));
  expect(firstRetry.status).toBe(201); expect(await firstRetry.json()).toEqual(result);
  const updated = { ...document, overview: "The new mutable document must not redefine the original operation." };
  expect((await updateTour(request(`/api/tours/${id}`, { document: updated, expectedRevision: 1 }, key, true, "PATCH"), id)).status).toBe(409);
  expect((await updateTour(request(`/api/tours/${id}`, { document: updated, expectedRevision: 1 }, randomUUID(), true, "PATCH"), id)).status).toBe(200);
  const retry = await createTour(request("/api/tours", document, key));
  expect(retry.status).toBe(201); expect(await retry.json()).toEqual(result);
  expect((await createTour(request("/api/tours", updated, key))).status).toBe(409);
});

test("large private uploads use scoped short-lived grants and verify completion before publication", async () => {
  const { prepareHostedUpload, completeHostedUpload } = await import("./hosted-assets");
  const bytes = Buffer.from(`capture-${randomUUID()}`.padEnd(4 * 1024 * 1024 + 1, "x"));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const description = { mediaType: "text/plain", bytes: bytes.length };
  provider.token.mockResolvedValue("fictional-scoped-upload-token");
  const path = `/api/tours/assets/${hash}`;
  expect((await prepareHostedUpload(request(`${path}/prepare`, description, randomUUID(), false), hash)).status).toBe(401);
  const grant = await prepareHostedUpload(request(`${path}/prepare`, description), hash);
  expect(grant.status).toBe(200);
  expect(await grant.json()).toEqual({ pathname: `tours/dan/${hash}`, token: "fictional-scoped-upload-token" });
  const options = provider.token.mock.calls.at(-1)![0];
  expect(options).toMatchObject({ pathname: `tours/dan/${hash}`, allowedContentTypes: ["text/plain"], maximumSizeInBytes: bytes.length, addRandomSuffix: false, allowOverwrite: false });
  expect(options.validUntil).toBeGreaterThan(Date.now());
  expect(options.validUntil).toBeLessThanOrEqual(Date.now() + 600_000);
  provider.get.mockResolvedValueOnce(null);
  expect((await completeHostedUpload(request(`${path}/complete`, description), hash)).status).toBe(404);
  const stream = (value: Buffer) => new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(value); controller.close(); } });
  provider.get.mockResolvedValueOnce({ stream: stream(Buffer.from("corrupt")) });
  expect((await completeHostedUpload(request(`${path}/complete`, description), hash)).status).toBe(422);
  provider.get.mockResolvedValueOnce({ stream: stream(bytes) });
  expect((await completeHostedUpload(request(`${path}/complete`, description), hash)).status).toBe(201);
  expect((await completeHostedUpload(request(`${path}/complete`, description), hash)).status).toBe(201);
  expect((await prepareHostedUpload(request(`${path}/prepare`, { ...description, bytes: 100 * 1024 * 1024 + 1 }), hash)).status).toBe(422);
});

});
