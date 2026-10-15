// @vitest-environment node
import { createHash, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
const provider = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn() }));
vi.mock("@vercel/blob", () => provider);

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
  const headChanged = { ...next, prs: next.prs.map((pr) => ({ ...pr, head: "c".repeat(40) })) };
  expect((await updateTour(request(`/api/tours/${initial.id}`, { expectedRevision: 2, document: headChanged }, randomUUID(), true, "PATCH"), initial.id)).status).toBe(200);
  expect((await readHostedAsset(readRequest(), initial.id, "receipt", "2")).status).toBe(206);
});

});
