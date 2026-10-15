import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const cli = resolve("apps/demo/features/tours/cli.ts");
const tsx = resolve("apps/demo/node_modules/tsx/dist/cli.mjs");
function command(...args: string[]) {
  return JSON.parse(execFileSync(process.execPath, [tsx, cli, "local", ...args, "--origin", "http://127.0.0.1:3018"], { encoding: "utf8", env: process.env }));
}

test("a local author imports managed evidence, reads slices and explicitly refreshes stale checks", async ({ page, request }, info) => {
  const scratch = await mkdtemp(join(tmpdir(), "anaphor-tour-bundle-"));
  const video = await readFile(resolve("e2e/fixtures/tour-example.webm"));
  const screenshot = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=", "base64");
  const receipt = Buffer.from("Observed: fictional saved draft returned after reload.\n");
  const hash = createHash("sha256").update(video).digest("hex");
  const pr = `https://github.com/example/fixture-${randomUUID()}/pull/1`;
  const document = {
    version: 2, title: "Reliable saved drafts", overview: "Keep draft text across reloads.",
    prs: [{ url: pr, base: "a".repeat(40), head: "b".repeat(40) }],
    sections: [{ id: "save", title: "Save and reopen", paragraphs: ["Persist the draft before closing its editor."],
      specs: [{ id: "save", label: "Saved draft criterion", url: "https://example.com/spec#save" }],
      evidenceIds: ["reload"] }],
    evidence: [{ id: "reload", criterion: "save", expected: "Saved draft survives reopening", observed: "Draft restored after reopening",
      action: "Save, close and reopen the editor", result: "pass", target: "Fictional browser fixture", context: "Fictional owner", testedAt: "2026-10-14T12:00:00Z",
      required: true, sources: [{ pr, head: "b".repeat(40) }], assetIds: ["recording", "screenshot", "receipt"] }],
    assets: [{ id: "recording", mediaType: "video/webm", sha256: hash, bytes: video.length,
      description: "A static gray test clip establishes video playback only.", caption: "Fictional test recording", provenance: "Generated fixture; not runtime verification" },
      { id: "screenshot", mediaType: "image/png", sha256: createHash("sha256").update(screenshot).digest("hex"), bytes: screenshot.length, description: "Fictional saved draft state", caption: "Static image fixture", provenance: "Generated fixture; not runtime verification" },
      { id: "receipt", mediaType: "text/plain", sha256: createHash("sha256").update(receipt).digest("hex"), bytes: receipt.length, description: "Fictional verification receipt", caption: "Test receipt", provenance: "Generated fixture; not runtime verification" }],
  };
  const file = join(scratch, "bundle.json");
  await writeFile(join(scratch, "recording.webm"), video);
  await writeFile(join(scratch, "screenshot.png"), screenshot);
  await writeFile(join(scratch, "receipt.txt"), receipt);
  await writeFile(file, JSON.stringify({ document, files: { recording: "recording.webm", screenshot: "screenshot.png", receipt: "receipt.txt" } }));
  const imported = command("import", "--file", file);
  await page.route("**/assets/screenshot", (route) => route.abort());
  await page.route("**/assets/receipt", (route) => route.fulfill({ status: 404 }));
  await page.goto(`/local-tour/${imported.id}`);
  await expect(page.getByRole("heading", { name: "Reliable saved drafts" })).toBeVisible();
  await expect(page.getByText("Local preview", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Sources and decisions for/ }).first().click();
  await expect(page.getByRole("link", { name: "Saved draft criterion", exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, globalThis.document.body.scrollHeight));
  await expect(page.getByText(/Required evidence asset screenshot is unavailable/)).toBeVisible();
  await expect(page.getByText(/Required evidence asset receipt is unavailable/)).toBeVisible();
  await page.unroute("**/assets/screenshot");
  await page.unroute("**/assets/receipt");
  await page.getByRole("button", { name: "Refresh tour" }).click();
  await expect(page.getByText(/Required evidence asset screenshot is unavailable/)).toHaveCount(0);
  await page.getByRole("button", { name: "Current checks and receipts" }).click();
  await expect(page.getByRole("img", { name: "Fictional saved draft state" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, globalThis.document.body.scrollHeight));
  await expect.poll(() => page.getByRole("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText(/Required evidence asset screenshot is unavailable/)).toHaveCount(0);
  await page.getByText("Execution details, source, and receipts", { exact: true }).first().click();
  await expect(page.getByRole("link", { name: "Open Test receipt" })).toBeVisible();
  await expect(page.getByText(/Required evidence asset receipt is unavailable/)).toHaveCount(0);
  await page.getByRole("button", { name: "Current checks and receipts" }).click();
  await page.getByRole("button", { name: /Sources and decisions for/ }).first().click();
  await page.getByRole("link", { name: "Saved draft criterion · pass · current", exact: true }).click();
  const execution = page.locator('[id="tour-evidence:reload"]');
  await expect(execution).toBeFocused();
  await expect.poll(async () => {
    const frame = await execution.boundingBox();
    return !!frame && frame.y >= 0 && frame.y <= 128;
  }).toBe(true);
  await page.getByRole("button", { name: "Contents and pull requests" }).click();
  await page.getByRole("link", { name: "Save and reopen", exact: true }).click();
  await expect.poll(() => page.locator("video").evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  await page.locator("video").evaluate((element: HTMLVideoElement) => element.play());
  await expect(page.locator("video")).toHaveJSProperty("paused", false);
  const assetUrl = `/api/local-tours/${imported.id}/revisions/1/assets/recording`;
  const partial = await request.get(assetUrl, { headers: { Range: "bytes=0-7" } });
  expect(partial.status()).toBe(206);
  expect((await partial.body()).length).toBe(8);
  expect(partial.headers()["cache-control"]).toContain("no-store");
  expect((await request.get(assetUrl, { headers: { Range: "bytes=999999999-" } })).status()).toBe(416);
  document.prs[0]!.head = "c".repeat(40);
  await writeFile(file, JSON.stringify({ document, files: { recording: "recording.webm", screenshot: "screenshot.png", receipt: "receipt.txt" } }));
  command("update", "--id", imported.id, "--expected-revision", "1", "--file", file);
  await expect(page.getByText("Tour revision 1")).toBeVisible();
  await page.getByRole("button", { name: "Refresh tour" }).click();
  await expect(page.getByText("Tour revision 2")).toBeVisible();
  await expect(page.getByText("save: stale evidence.", { exact: true })).toBeVisible();
  await rm(scratch, { recursive: true });
  await page.reload();
  await expect.poll(() => page.locator("video").evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  await page.getByRole("button", { name: /switch to dark/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Refresh tour" }).focus();
  await expect(page.getByRole("button", { name: "Refresh tour" })).toBeFocused();
  expect(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("local-tour.png"), fullPage: true });
  expect((await request.get(`/api/local-tours/${imported.id}`, { headers: { Origin: "https://outsider.example" } })).status()).toBe(404);
  expect((await request.get(`/api/local-tours/${imported.id}/revisions/2/assets/missing`)).status()).toBe(404);
});
