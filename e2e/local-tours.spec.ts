import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const cli = resolve("apps/demo/features/tours/cli.ts");
const tsx = resolve("apps/demo/node_modules/tsx/dist/cli.mjs");
test.use({ video: "on" });

function command(...args: string[]) {
  return JSON.parse(execFileSync(process.execPath, [tsx, cli, "local", ...args, "--origin", "http://127.0.0.1:3018"], { encoding: "utf8", env: process.env }));
}

test("a local author imports managed evidence, reads slices and explicitly refreshes stale checks", async ({ page, request }, info) => {
  const browserErrors: string[] = [];
  page.on("pageerror", error => browserErrors.push(error.message));
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
      specs: [{ id: "t1", label: "T1: Saved draft criterion", url: "https://example.com/spec#t1" }],
      evidenceIds: ["reload"], review: {
        problem: "Keep a saved draft readable.", outcome: "Read the annotated save operation.", acceptance: ["Save before closing."],
        steps: [{ id: "write", title: "Write the draft", explanation: "Persist before closing.", criterionIds: ["t1"], evidenceIds: ["reload"],
          code: { before: null, after: { path: "save.ts", revision: "b".repeat(40), href: `https://github.com/example/fixture/blob/${"b".repeat(40)}/save.ts`,
            content: `const help = ${JSON.stringify("Long command help wraps before the important operation. ".repeat(60))};\nexport const saved = true;\n` },
            regions: [{ id: "save", label: "Save operation", side: "after", startLine: 2, endLine: 2 }],
            notes: [{ id: "why", label: "Keep the draft", side: "after", startLine: 2, endLine: 2, explanation: "Write the draft before closing." }] },
        }],
      } }],
    evidence: [{ id: "reload", criterion: "t1", expected: "Saved draft survives reopening", observed: "Draft restored after reopening",
      action: "Save, close and reopen the editor", result: "pass", target: `${info.project.name === "desktop-chromium" ? "Chromium" : "WebKit"} · fictional reader fixture`, context: "Fictional owner", testedAt: "2026-10-14T12:00:00Z",
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
  await expect(page.getByRole("navigation", { name: "Business cases" }).getByRole("link", { name: "Save and reopen" })).toHaveAttribute("href", "#tour-section:save");
  await page.screenshot({ path: info.outputPath("pr-review-light.png") });
  const receiptIcon = page.getByRole("button", { name: "Verification receipts for Save and reopen" });
  if (info.project.name === "desktop-chromium") await receiptIcon.hover();
  else await receiptIcon.click();
  await expect(page.getByRole("dialog")).toContainText("Recorded checks are available.");
  await expect(page.getByRole("dialog").getByText("Recorded checks are available. Inspect their result and source before merging.", { exact: true })).toHaveCSS("font-size", "14px");
  await expect(receiptIcon.locator("svg")).toHaveCSS("width", "20px");
  await page.keyboard.press("Escape");
  if (info.project.name === "mobile-webkit") {
    await page.getByRole("button", { name: "Choose business case" }).click();
    await page.getByRole("menuitem", { name: "01 · Save and reopen", exact: true }).click();
    await page.getByRole("button", { name: "Choose case subsection" }).click();
    await page.getByRole("menuitem", { name: "1. Write the draft", exact: true }).click();
    await expect.poll(async () => {
      const toolbar = await page.getByRole("navigation", { name: "Narrow tour navigation" }).boundingBox();
      const step = await page.locator('[id="tour-step:save:write"]').boundingBox();
      return !!toolbar && !!step && step.y >= toolbar.y + toolbar.height;
    }).toBe(true);
  } else {
    await page.getByRole("navigation", { name: "Tour navigation", exact: true }).getByRole("link", { name: "1. Write the draft" }).click();
  }
  const codeViewport = page.getByRole("region", { name: "Code changes: save.ts" });
  await page.getByRole("button", { name: "Save operation · After · L2", exact: true }).click();
  await expect.poll(() => codeViewport.evaluate(element => {
    const row = element.querySelector("diffs-container")?.shadowRoot?.querySelector("[data-line][data-selected-line]");
    if (!row) return false;
    const bounds = element.getBoundingClientRect();
    const target = row.getBoundingClientRect();
    return target.top >= bounds.top && target.bottom <= bounds.bottom + 1;
  })).toBe(true);
  await codeViewport.getByRole("button", { name: "1. Keep the draft", exact: true }).click();
  await expect(codeViewport.getByText("Write the draft before closing.", { exact: true })).toBeVisible();
  expect(await codeViewport.evaluate(element => {
    const row = element.querySelector("diffs-container")?.shadowRoot?.querySelector("[data-line][data-selected-line]");
    if (!row) return 0;
    if (getComputedStyle(row).boxShadow !== "none") return 0;
    const canvas = globalThis.document.createElement("canvas"); canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
      const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
        const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
    };
    const background = luminance(getComputedStyle(row).backgroundColor);
    const gutter = element.querySelector("diffs-container")?.shadowRoot?.querySelector("[data-column-number][data-selected-line]");
    const gutterInk = gutter ? luminance(getComputedStyle(gutter).color) : 0;
    const gutterBackground = gutter ? luminance(getComputedStyle(gutter).backgroundColor) : 0;
    const gutterRatio = gutter ? (Math.max(gutterInk, gutterBackground) + 0.05) / (Math.min(gutterInk, gutterBackground) + 0.05) : 0;
    return Math.min(gutterRatio, ...[row, ...row.querySelectorAll("span")].filter(node => node.textContent?.trim()).map(node => {
      const ink = luminance(getComputedStyle(node).color);
      return (Math.max(ink, background) + 0.05) / (Math.min(ink, background) + 0.05);
    }));
  })).toBeGreaterThanOrEqual(4.5);
  await codeViewport.screenshot({ path: info.outputPath("diff-light.png") });
  await page.getByRole("button", { name: "Full source and revisions" }).click();
  await expect(page.getByRole("link", { name: "After: save.ts", exact: true })).toHaveAttribute("href", /#L2$/);
  await page.getByRole("button", { name: "Full source and revisions" }).click();
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
  await page.getByRole("img", { name: "Fictional saved draft state", exact: true }).scrollIntoViewIfNeeded();
  await expect.poll(() => page.getByRole("img", { name: "Fictional saved draft state", exact: true }).evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const enlarge = page.getByRole("button", { name: "Enlarge Static image fixture" });
  await enlarge.scrollIntoViewIfNeeded();
  await expect(enlarge).toBeInViewport();
  await enlarge.click();
  const viewer = page.getByRole("dialog", { name: "Static image fixture" });
  await expect(viewer).toBeVisible();
  await viewer.getByRole("button", { name: "Actual size", exact: true }).click();
  await viewer.getByRole("button", { name: "Close media viewer" }).click();
  await expect(viewer).toHaveCount(0);
  await expect(enlarge).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, globalThis.document.body.scrollHeight));
  await expect.poll(() => page.getByRole("img", { name: "Fictional saved draft state", exact: true }).evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText(/Required evidence asset screenshot is unavailable/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Test receipt" })).toBeVisible();
  await expect(page.getByText(/Required evidence asset receipt is unavailable/)).toHaveCount(0);
  await page.getByRole("button", { name: "Current checks and receipts" }).click();
  await page.getByRole("button", { name: /Sources and decisions for/ }).first().click();
  await page.getByRole("button", { name: "Verification details for save and reopen" }).click();
  const details = page.getByRole("region", { name: "Evidence for Save and reopen" });
  await expect(details.getByRole("link", { name: "Spec requirement T1" })).toBeVisible();
  const browserName = info.project.name === "desktop-chromium" ? "Chromium" : "WebKit";
  await details.getByRole("button", { name: `${browserName} environment` }).click();
  await expect(page.getByRole("dialog")).toContainText(`${browserName} · fictional reader fixture`);
  await page.keyboard.press("Escape");
  await details.screenshot({ path: info.outputPath("flat-verification.png") });
  await page.getByRole("region", { name: "Evidence for Save and reopen" }).getByRole("link", { name: "Original record and source history", exact: true }).click();
  const execution = page.locator('[id="tour-evidence:reload"]');
  await expect(execution).toBeFocused();
  await expect.poll(async () => {
    const frame = await execution.boundingBox();
    return !!frame && frame.y >= 0 && frame.y <= (info.project.name === "mobile-webkit" ? 192 : 128);
  }).toBe(true);
  await page.getByRole("navigation", { name: "Business cases", exact: true }).getByRole("link", { name: "Save and reopen", exact: true }).click();
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
  Object.assign(document.sections[0]!.review, { verification: { purpose: "The reader must keep the saved evidence available.", method: "The test imported a tour, reopened it, and refreshed its revision.", conclusion: "The reader kept the evidence. The changed source makes the earlier check historical." } });
  await writeFile(file, JSON.stringify({ document, files: { recording: "recording.webm", screenshot: "screenshot.png", receipt: "receipt.txt" } }));
  command("update", "--id", imported.id, "--expected-revision", "1", "--file", file);
  await expect(page.getByText("Tour revision 1")).toBeVisible();
  await page.getByRole("button", { name: "Refresh tour" }).click();
  await expect(page.getByText("Tour revision 2")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Merge concerns" }).getByText("Saved draft criterion (spec requirement T1): stale evidence.", { exact: true })).toBeVisible();
  await rm(scratch, { recursive: true });
  await page.reload();
  await expect.poll(() => page.locator("video").evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  const verification = page.getByRole("region", { name: "Evidence for Save and reopen" });
  await verification.scrollIntoViewIfNeeded();
  await expect(verification.getByText("The reader must keep the saved evidence available.")).toBeVisible();
  await expect(verification.getByText("The test imported a tour, reopened it, and refreshed its revision.")).toBeVisible();
  await expect(verification.getByText("The reader kept the evidence. The changed source makes the earlier check historical.")).toBeVisible();
  await page.screenshot({ path: info.outputPath("verification-light.png") });
  if (info.project.name === "mobile-webkit") {
    await page.getByRole("button", { name: "Choose business case" }).click();
    await page.getByRole("menuitem", { name: "Merge assessment", exact: true }).click();
    await expect.poll(async () => {
      const toolbar = await page.getByRole("navigation", { name: "Narrow tour navigation" }).boundingBox();
      const assessment = await page.getByRole("complementary", { name: "Merge concerns", exact: true }).boundingBox();
      return !!toolbar && !!assessment && assessment.y >= toolbar.y + toolbar.height;
    }).toBe(true);
  }
  await page.getByRole("button", { name: /switch to dark/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Refresh tour" }).focus();
  await expect(page.getByRole("button", { name: "Refresh tour" })).toBeFocused();
  expect(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("local-tour.png"), fullPage: true });
  expect((await request.get(`/api/local-tours/${imported.id}`, { headers: { Origin: "https://outsider.example" } })).status()).toBe(404);
  expect((await request.get(`/api/local-tours/${imported.id}/revisions/2/assets/missing`)).status()).toBe(404);
  expect(browserErrors).toEqual([]);
});
