import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { chmod, copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { fictionalIdentity, holdDeviceDecisions } from "../apps/demo/features/tours/test/identity";

const document = {
  version: 1,
  title: "Fictional private tour",
  overview: "A private overview of an independently implemented change.",
  prs: [{ url: "https://github.com/example/fictional/pull/12", base: "a".repeat(40), head: "b".repeat(40) }],
  sections: [{ id: "behavior", title: "Changed behavior", paragraphs: ["The complete published text is readable after reload."] }],
};

test("signed-out visitors cannot publish or retrieve private tour metadata", async ({ request }) => {
  const created = await request.post("/api/tours", { data: {}, headers: { "Idempotency-Key": "signed-out" } });
  expect(created.status()).toBe(401);
  const read = await request.get("/api/tours/00000000-0000-4000-8000-000000000000");
  expect(read.status()).toBe(401);
  expect(read.headers()["cache-control"]).toContain("no-store");
});

test("a complete agent publication is readable in the built owner browser, with safe retries", async ({ request, page, context }) => {
  const identity = await fictionalIdentity();
  const headers = { Authorization: `Bearer ${identity.token}`, "Idempotency-Key": randomUUID() };
  const response = await request.post("/api/tours", { data: document, headers });
  expect(response.status()).toBe(201);
  const result = await response.json();
  const retry = await request.post("/api/tours", { data: document, headers });
  expect(await retry.json()).toEqual(result);
  const conflict = await request.post("/api/tours", { data: { ...document, overview: "Changed content" }, headers });
  expect(conflict.status()).toBe(409);
  await context.addCookies([identity.cookie]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(result.url);
  await expect(page.getByRole("heading", { name: document.title })).toBeVisible();
  await page.getByRole("link", { name: "Changed behavior", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Changed behavior" })).toBeVisible();
  await page.reload();
  await expect(page.getByText(document.sections[0]!.paragraphs[0]!)).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh tour" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh tour" })).toBeEnabled();
  await page.getByRole("button", { name: "Refresh tour" }).focus();
  await expect(page.getByRole("button", { name: "Refresh tour" })).toBeFocused();
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("tour-light.png"), fullPage: true });
  await page.getByRole("button", { name: /switch to dark/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: test.info().outputPath("tour-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in to Anaphor" })).toBeVisible();
  await expect(page.getByText(document.overview)).toHaveCount(0);
  expect((await request.get(`/api/tours/${result.id}`, { headers })).status()).toBe(401);
  // A fast session denial must not hide stale content restored from router history.
  await page.route("**/api/tours/session", (route) => route.abort("failed"));
  await page.getByRole("link", { name: "Anaphor reference manual" }).click();
  await expect(page.getByRole("heading", { name: "Anaphor", level: 1, exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Sign in to Anaphor" })).toBeVisible();
  await expect(page.getByText(document.overview)).toHaveCount(0);
});

test("both explicitly allowlisted providers map to the owner; outsiders, expired sessions and another origin are denied", async ({ request }) => {
  for (const fixture of [
    { provider: "github", accountId: "fixture-github", status: 200 },
    { provider: "github", accountId: "outsider", status: 403 },
    { provider: "google", accountId: "fixture-google", age: 86_400_001, status: 401 },
    { provider: "google", accountId: "fixture-google", origin: "https://another.example", status: 403 },
  ]) {
    const identity = await fictionalIdentity(fixture);
    const result = await request.get("/api/tours/session", { headers: { Authorization: `Bearer ${identity.token}` } });
    expect(result.status()).toBe(fixture.status);
    if (fixture.status !== 200) {
      const write = await request.post("/api/tours", { data: document, headers: { Authorization: `Bearer ${identity.token}`, "Idempotency-Key": randomUUID() } });
      expect(write.status()).toBe(fixture.status);
    }
  }
});

test("invalid and unsupported documents return diagnostics without a readable partial publication", async ({ request }) => {
  const identity = await fictionalIdentity();
  const headers = { Authorization: `Bearer ${identity.token}`, "Idempotency-Key": randomUUID() };
  const invalid = await request.post("/api/tours", { headers, data: { ...document, version: 9 } });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["version"] })]));
  const valid = await request.post("/api/tours", { headers, data: document });
  expect(valid.status()).toBe(201);
  expect((await request.get(`/api/tours/${(await valid.json()).id}`, { headers })).status()).toBe(200);
});

test("a remote device waits for explicit owner approval and receives a revocable fixed-life credential", async ({ request, context, page }) => {
  const body = { client_id: "anaphor-cli:http://127.0.0.1:3105", scope: "tours:read tours:write" };
  const code = await request.post("/api/auth/device/code", { data: body });
  expect(code.status()).toBe(200);
  const grant = await code.json();
  const tokenBody = { client_id: body.client_id, device_code: grant.device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" };
  const pending = await request.post("/api/auth/device/token", { data: tokenBody });
  expect((await pending.json()).error).toBe("authorization_pending");
  expect((await request.post("/api/auth/device/approve", { data: { userCode: grant.user_code } })).status()).toBe(401);
  const identity = await fictionalIdentity();
  await context.addCookies([identity.cookie]);
  await page.goto(grant.verification_uri_complete);
  await page.getByRole("button", { name: "Review request" }).click();
  await expect(page.getByText(`Client: ${body.client_id}`, { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Approve device", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Device approved. Return to your CLI.");
  // Honor the protocol's required minimum polling interval, rather than browser timing.
  await new Promise((accept) => setTimeout(accept, grant.interval * 1000));
  const token = await request.post("/api/auth/device/token", { data: tokenBody });
  expect(token.status()).toBe(200);
  const credential = await token.json();
  expect(credential.expires_in).toBeLessThanOrEqual(86_400);
  expect(credential.scope).toBe(body.scope);
  const headers = { Authorization: `Bearer ${credential.access_token}` };
  const before = await request.get("/api/tours/session", { headers });
  expect(before.status()).toBe(200);
  const after = await request.get("/api/tours/session", { headers });
  expect((await after.json()).expiresAt).toBe((await before.json()).expiresAt);
  const renewalGrant = await (await request.post("/api/auth/device/code", { data: body })).json();
  expect((await request.post("/api/auth/device/approve", { headers, data: { userCode: renewalGrant.user_code } })).status()).toBe(403);
  expect((await request.post("/api/tours/logout", { headers, data: {} })).status()).toBe(200);
  expect((await request.get("/api/tours/session", { headers })).status()).toBe(401);
});

test("the actual remote CLI logs in with explicit approval, publishes, reuses its UUID and revokes its secure-store credential", async ({ page, context, request }) => {
  test.skip((test.info().project.use.viewport?.width ?? 1440) < 600, "The CLI seam is independent of browser viewport; approval UI has separate narrow coverage.");
  test.setTimeout(45_000);
  const scratch = await mkdtemp(join(tmpdir(), "anaphor-cli-fixture-"));
  const helper = join(scratch, "secure-store-fixture.mjs");
  const credentialFile = join(scratch, "fictional-credential.json");
  await copyFile(resolve("apps/demo/features/tours/test/secure-store-fixture.mjs"), helper);
  await chmod(helper, 0o700);
  let failureEnv: Record<string, string> = {};
  const run = (...args: string[]) => {
    const child = spawn(process.execPath, ["--import", resolve("apps/demo/node_modules/tsx/dist/loader.mjs"), resolve("apps/demo/features/tours/cli.ts"), ...args, "--origin", "http://127.0.0.1:3105"], { env: { ...process.env, ANAPHOR_SECURE_STORE: helper, ANAPHOR_TEST_CREDENTIAL_FILE: credentialFile, ...failureEnv }, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { error += chunk; });
    const done = new Promise<{ code: number | null; output: string; error: string }>((accept) => child.on("close", (code) => accept({ code, output, error })));
    return { child, done, output: () => output };
  };
  const login = run("login");
  let failedLogin: ReturnType<typeof run> | undefined;
  try {
    await expect.poll(() => login.output().match(/Open (http:\/\/\S+)/)?.[1]).toBeTruthy();
    const identity = await fictionalIdentity();
    await context.addCookies([identity.cookie]);
    await page.goto(login.output().match(/Open (http:\/\/\S+)/)![1]!);
    await page.getByRole("button", { name: "Review request" }).click();
    await page.getByRole("button", { name: "Approve device", exact: true }).click();
    const completed = await login.done;
    expect(completed.code, completed.error).toBe(0);
    expect(completed.output).toContain("Signed in to http://127.0.0.1:3105");
    const saved = JSON.parse(await readFile(credentialFile, "utf8"));
    expect(completed.output).not.toContain(saved.token);
    const prepared = join(scratch, "tour.json");
    await writeFile(prepared, JSON.stringify(document), { mode: 0o600 });
    const key = randomUUID();
    const publish = await run("publish", "--file", prepared, "--key", key).done;
    expect(publish.code, publish.error).toBe(0);
    const retry = await run("publish", "--file", prepared, "--key", key).done;
    expect(JSON.parse(retry.output)).toEqual(JSON.parse(publish.output));
    await writeFile(credentialFile, saved.token);
    const corrupt = await run("publish", "--file", prepared, "--key", key).done;
    expect(corrupt.code).toBe(1);
    expect(corrupt.error).toContain("Stored credentials are unavailable or invalid");
    expect(corrupt.error).not.toContain(saved.token);
    await writeFile(credentialFile, JSON.stringify({ ...saved, expiresAt: Date.now() - 1 }));
    const expired = await run("publish", "--file", prepared, "--key", key).done;
    expect(expired.code).toBe(1);
    expect(expired.error).toContain("Credentials expired");
    expect(await readFile(prepared, "utf8")).toBe(JSON.stringify(document));
    await writeFile(credentialFile, JSON.stringify(saved));
    // Substitute an unavailable transport boundary without changing the real app or its storage.
    const outage = createServer((incoming, response) => { incoming.resume(); response.writeHead(503, { "Content-Type": "application/json" }); response.end('{"error":"Fictional outage"}'); });
    await new Promise<void>((accept) => outage.listen(0, "127.0.0.1", accept));
    try {
      const address = outage.address();
      if (!address || typeof address === "string") throw new Error("Fixture proxy did not start.");
      failureEnv = { HTTP_PROXY: `http://127.0.0.1:${address.port}`, http_proxy: `http://127.0.0.1:${address.port}`, NO_PROXY: "", no_proxy: "" };
      const uncertain = await run("logout").done;
      expect(uncertain.code).toBe(1);
      expect(uncertain.error).toContain("Session revocation could not be confirmed");
      expect(await readFile(credentialFile).then((value) => value.length)).toBeGreaterThan(0);
      expect((await request.get("/api/tours/session", { headers: { Authorization: `Bearer ${saved.token}` } })).status()).toBe(200);
    } finally { await new Promise<void>((accept, reject) => outage.close((error) => error ? reject(error) : accept())); }
    failureEnv = { ANAPHOR_TEST_STORE_FAIL: "delete" };
    const cleanupFailure = await run("logout").done;
    expect(cleanupFailure.code).toBe(1);
    expect(cleanupFailure.error).toContain("Server session revoked, but secure-store cleanup failed");
    expect((await request.get("/api/tours/session", { headers: { Authorization: `Bearer ${saved.token}` } })).status()).toBe(401);
    failureEnv = {};
    const logout = await run("logout").done;
    expect(logout.code, logout.error).toBe(0);
    expect(logout.output).toContain("Signed out and removed");
    expect((await request.get("/api/tours/session", { headers: { Authorization: `Bearer ${saved.token}` } })).status()).toBe(401);
    expect(await readFile(credentialFile).catch(() => null)).toBeNull();
    failureEnv = { ANAPHOR_TEST_STORE_FAIL: "write" };
    failedLogin = run("login");
    await expect.poll(() => failedLogin?.output().match(/Open (http:\/\/\S+)/)?.[1]).toBeTruthy();
    await page.goto(failedLogin.output().match(/Open (http:\/\/\S+)/)![1]!);
    await page.getByRole("button", { name: "Review request" }).click();
    await page.getByRole("button", { name: "Approve device", exact: true }).click();
    const failedWrite = await failedLogin.done;
    expect(failedWrite.code).toBe(1);
    expect(failedWrite.error).toContain("Secure credential storage failed");
    expect(failedWrite.error).not.toContain("revocation could not be confirmed");
    expect(await readFile(credentialFile).catch(() => null)).toBeNull();
    const remaining = await request.get("/api/auth/list-sessions", { headers: { Cookie: `${identity.cookie.name}=${identity.cookie.value}` } });
    expect(remaining.status()).toBe(200);
    expect((await remaining.json()).length).toBe(1);
  } finally { login.child.kill(); failedLogin?.child.kill(); await rm(scratch, { recursive: true, force: true }); }
});

test("device denial and wrong-environment client/scope requests never issue a usable credential", async ({ request }) => {
  test.skip((test.info().project.use.viewport?.width ?? 1440) < 600, "Protocol-only checks run once; narrow device approval has its own browser test.");
  const body = { client_id: "anaphor-cli:http://127.0.0.1:3105", scope: "tours:read tours:write" };
  expect((await request.post("/api/auth/device/code", { data: { ...body, client_id: "anaphor-cli:https://another.example" } })).status()).toBe(400);
  expect((await request.post("/api/auth/device/code", { data: { ...body, scope: "admin" } })).status()).toBe(400);
  const grant = await (await request.post("/api/auth/device/code", { data: body })).json();
  const identity = await fictionalIdentity();
  const headers = { Cookie: `${identity.cookie.name}=${identity.cookie.value}` };
  expect((await request.get(`/api/auth/device?user_code=${grant.user_code}`, { headers })).status()).toBe(200);
  expect((await request.post("/api/auth/device/deny", { data: { userCode: grant.user_code }, headers: { ...headers, Origin: "http://127.0.0.1:3105" } })).status()).toBe(200);
  const denied = await request.post("/api/auth/device/token", { data: { client_id: body.client_id, device_code: grant.device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" } });
  expect((await denied.json()).error).toBe("access_denied");
});

test("the CLI reports missing secure storage before attempting remote login", () => {
  test.skip((test.info().project.use.viewport?.width ?? 1440) < 600, "CLI setup does not depend on viewport.");
  const result = spawnSync(process.execPath, ["--import", resolve("apps/demo/node_modules/tsx/dist/loader.mjs"), resolve("apps/demo/features/tours/cli.ts"), "login", "--origin", "http://127.0.0.1:9"], { env: { ...process.env, ANAPHOR_SECURE_STORE: resolve("test-results/missing-secure-store") }, encoding: "utf8" });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Secure credential storage is unavailable");
  expect(result.stdout).not.toContain("Open http");
});

test("expiry hides the private reader and sign-out failure keeps a working recovery action", async ({ request, page, context }) => {
  const identity = await fictionalIdentity({ age: 86_400_000 - 25_000 });
  const response = await request.post("/api/tours", { data: document, headers: { Authorization: `Bearer ${identity.token}`, "Idempotency-Key": randomUUID() } });
  expect(response.status()).toBe(201);
  const { url } = await response.json();
  await context.addCookies([identity.cookie]);
  await page.clock.install();
  await page.goto(url);
  await expect(page.getByRole("heading", { name: document.title })).toBeVisible();
  await page.clock.fastForward(26_000);
  await expect(page.getByRole("heading", { name: "Sign in to Anaphor" })).toBeVisible();
  await expect(page.getByText(document.overview)).toHaveCount(0);
  const fresh = await fictionalIdentity();
  await context.addCookies([fresh.cookie]);
  await page.clock.resume();
  await page.goto(url);
  await expect(page.getByRole("heading", { name: document.title })).toBeVisible();
  await page.route("**/api/tours/logout", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Fictional outage"}' }));
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry sign out" })).toBeVisible();
  await expect(page.getByText(document.overview)).toHaveCount(0);
  await page.unroute("**/api/tours/logout");
  await page.getByRole("button", { name: "Retry sign out" }).click();
  await expect(page.getByRole("button", { name: "Retry sign out" })).toHaveCount(0);
  expect((await request.get("/api/tours/session", { headers: { Authorization: `Bearer ${fresh.token}` } })).status()).toBe(401);
});


test("authored section IDs cannot collide with headings or the reader shell", async ({ request, page, context }) => {
  const identity = await fictionalIdentity();
  const sections = ["intro", "intro-title", "tour-content"].map((id, index) => ({ id, title: `Section ${index + 1}`, paragraphs: [`Content for section ${index + 1}.`] }));
  const response = await request.post("/api/tours", { data: { ...document, sections }, headers: { Authorization: `Bearer ${identity.token}`, "Idempotency-Key": randomUUID() } });
  expect(response.status()).toBe(201);
  await context.addCookies([identity.cookie]);
  await page.goto((await response.json()).url);
  for (const section of sections) {
    const link = page.getByRole("link", { name: section.title, exact: true });
    await link.click();
    const target = await link.getAttribute("href");
    if (!target) throw new Error("Section navigation requires a destination.");
    const destination = page.locator(`[id="${target.slice(1)}"]`);
    await expect(destination).toHaveCount(1);
    await expect(page.getByRole("region", { name: section.title, exact: true })).toHaveAttribute("id", target.slice(1));
    await expect(destination.getByRole("heading", { name: section.title })).toBeVisible();
  }
});

test("overlapping device decisions complete only once", async ({ request }) => {
  const client_id = "anaphor-cli:http://127.0.0.1:3105";
  const grant = await (await request.post("/api/auth/device/code", { data: { client_id, scope: "tours:read tours:write" } })).json();
  const identity = await fictionalIdentity();
  // A distinct fictional client address keeps this overlap independent of other tests' device-review rate limits.
  const headers = { Cookie: `${identity.cookie.name}=${identity.cookie.value}`, Origin: "http://127.0.0.1:3105", "X-Forwarded-For": "192.0.2.246" };
  expect((await request.get(`/api/auth/device?user_code=${grant.user_code}`, { headers })).status()).toBe(200);
  const barrier = await holdDeviceDecisions(grant.user_code);
  const decisions = Promise.all(["approve", "deny"].map((action) => request.post(`/api/auth/device/${action}`, { headers, data: { userCode: grant.user_code } })));
  try {
    await expect.poll(barrier.waiting, { timeout: 10_000 }).toBe(2);
  } finally { await barrier.release(); }
  const results = await decisions;
  expect(results.map((response) => response.status()).sort()).toEqual([200, 400]);
  const winner = results[0]!.status() === 200 ? "approved" : "denied";
  const review = await request.get(`/api/auth/device?user_code=${grant.user_code}`, { headers });
  expect((await review.json()).status).toBe(winner);
  const token = await request.post("/api/auth/device/token", { data: { client_id, device_code: grant.device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" } });
  expect(token.status()).toBe(winner === "approved" ? 200 : 400);
  if (winner === "denied") expect((await token.json()).error).toBe("access_denied");
});
