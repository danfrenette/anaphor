import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium, expect } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const installer = path.join(root, "node_modules/shadcn/dist/index.js");
const temporary = await mkdtemp(path.join(tmpdir(), "anaphor-registry-"));
const registryDirectory = path.join(temporary, "registry");

const commandLog = path.join(temporary, "commands.log");

// Command output goes to the log; a failure prints its tail so the run stays readable.
async function run(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], timeout: 180_000 });
  const log = createWriteStream(commandLog, { flags: "a" });
  const output = [];
  log.write(`\n$ ${command} ${args.join(" ")}\n`);
  for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => { output.push(chunk); log.write(chunk); });
  const [code, signal] = await once(child, "close");
  log.end();
  await once(log, "finish");
  if (code !== 0) console.error(Buffer.concat(output).toString().split("\n").slice(-40).join("\n"));
  assert.equal(code, 0, `${command} ${args.join(" ")} failed (${signal ?? code}); full output in ${commandLog}`);
}

async function prepareRegistry() {
  await run(process.execPath, [installer, "build", "registry.json", "--output", registryDirectory], root);
  const manifest = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
  const names = new Set(manifest.items.map(item => item.name));
  for (const name of names) {
    const file = path.join(registryDirectory, `${name}.json`);
    const item = JSON.parse(await readFile(file, "utf8"));
    // Only transport changes: dependencies must resolve to this checkout, not GitHub.
    item.registryDependencies = (item.registryDependencies ?? []).map(dependency => {
      const prefix = "danfrenette/anaphor/";
      assert.ok(dependency.startsWith(prefix), `Review external registry dependency: ${dependency}`);
      const target = dependency.slice(prefix.length);
      assert.ok(names.has(target), `Unknown registry dependency: ${dependency}`);
      return path.join(registryDirectory, `${target}.json`);
    });
    await writeFile(file, JSON.stringify(item));
  }
}

async function serve(directory) {
  const assets = new Map();
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
  for (const file of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (!file.isFile()) continue;
    const absolute = path.join(file.parentPath, file.name);
    assets.set(`/${path.relative(directory, absolute).split(path.sep).join("/")}`, {
      content: await readFile(absolute), type: types[path.extname(file.name)] ?? "application/octet-stream",
    });
  }
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const asset = assets.get(pathname === "/" ? "/index.html" : pathname);
    response.writeHead(asset ? 200 : 404, { "Content-Type": asset?.type ?? "text/plain" });
    response.end(asset?.content ?? "Not found");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

async function checkBrowser(browser, directory, item, fontDelivery = "embedded") {
  const { server, url } = await serve(path.join(directory, "dist"));
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  const fontRequests = [];
  page.on("request", request => { if (request.resourceType() === "font" && request.url().startsWith("http")) fontRequests.push(request.url()); });
  if (item === "font-delivery") await page.addInitScript(() => {
    window.fontLayoutShift = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.fontLayoutShift += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", request => errors.push(request.url()));
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url);
    let layoutShift;
    if (item === "font-delivery") {
      await expect(page.locator("[data-font-sample]")).toHaveCount(4);
      layoutShift = await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        return window.fontLayoutShift;
      });
    }
    await expect(page.getByRole("main")).toHaveCSS("padding-top", "24px");
    await expect(page.getByRole("main")).toHaveCSS("max-width", "1536px");
    await expect(page.getByRole("main")).toHaveCSS("padding-inline-start", "48px");
    await expect(page.getByTestId("editorial-layout")).toHaveCSS("max-width", "1120px");
    await page.setViewportSize({ width: 320, height: 800 });
    await expect(page.getByRole("main")).toHaveCSS("padding-inline-start", "24px");
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => document.documentElement.style.setProperty("--container-workspace", "80rem"));
    await expect(page.getByRole("main")).toHaveCSS("max-width", "1280px");
    await page.evaluate(() => document.documentElement.style.removeProperty("--container-workspace"));
    await expect(page.locator("body")).toHaveCSS("margin", "0px");
    const button = page.getByRole("button", { name: "Count 0", exact: true });
    await expect(button).toBeVisible();
    await expect(button).toHaveCSS("height", "40px");
    await button.click();
    await expect(page.getByRole("button", { name: "Count 1", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Count 1", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "Count 2", exact: true })).toBeVisible();
    if (item === "step-transition") await expect(page.getByText("Current step 2", { exact: true })).toBeVisible();
    if (item === "data-table") {
      await page.getByRole("checkbox", { name: "Select First source", exact: true }).click();
      await expect(page.getByRole("checkbox", { name: "Select First source", exact: true })).toBeChecked();
      await page.getByRole("button", { name: "Next page" }).click();
      await expect(page.getByText("Second source", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Previous page" }).click();
      await expect(page.getByRole("checkbox", { name: "Select First source", exact: true })).toBeChecked();
    }
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter(font => font.status === "loaded").map(font => font.family.replaceAll('"', ""));
    });
    assert.ok(fonts.includes("Inter Variable"), "Installed sans font must load");
    assert.ok(fonts.includes("Magda Clean Mono"), "Installed mono font must load");
    const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--anaphor-background"));
    assert.ok(light.trim(), "Installed theme tokens must exist");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--anaphor-background"));
    assert.notEqual(light, dark, "Installed dark theme must change tokens");
    if (item === "font-delivery") {
      const faces = await page.evaluate(() => [...document.fonts].map(font => ({ family: font.family, style: font.style, weight: font.weight, status: font.status })).sort((a, b) => `${a.family}:${a.style}`.localeCompare(`${b.family}:${b.style}`)));
      assert.equal(faces.length, 4, "One declaration per intended face, without embedded duplicates");
      assert.ok(faces.every(face => face.status === "loaded"), "All four specimen faces must load");
      assert.equal(fontRequests.length, fontDelivery === "embedded" ? 0 : 4, "Cold consumer must use exactly one font delivery path");
      if (fontDelivery === "application") assert.ok(fontRequests.every(url => new URL(url).pathname.startsWith("/fonts/")));
      const specimens = await page.locator("[data-font-sample]").evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return { family: style.fontFamily, weight: style.fontWeight, style: style.fontStyle, width: rect.width, height: rect.height };
      }));
      const evidence = path.join(root, "test-results/registry-fonts");
      await mkdir(evidence, { recursive: true });
      for (const theme of ["light", "dark"]) {
        await page.evaluate(dark => document.documentElement.classList.toggle("dark", dark), theme === "dark");
        await page.screenshot({ path: path.join(evidence, `${fontDelivery}-${theme}.png`), fullPage: true });
      }
      assert.deepEqual(errors, [], "Font consumer must load without browser errors");
      return { faces, specimens, fontRequests: fontRequests.map(url => new URL(url).pathname), layoutShift };
    }
    if (item === "diff" || item === "ui") {
      const diff = page.getByRole("region", { name: "Diff for example.ts" });
      await expect(diff.locator("[data-line]").filter({ hasText: "const count = 2;" })).toBeVisible();
      if (item === "diff") {
        await diff.getByRole("button", { name: "1. Raise the initial count" }).click();
        await expect(page.getByRole("dialog")).toContainText("New readers begin with two items.");
        await page.keyboard.press("Escape");
        await expect(diff.getByRole("button", { name: "1. Raise the initial count" })).toBeFocused();
      }
      await diff.getByRole("button", { name: "Collapse example.ts" }).click();
      await expect(diff.getByRole("region", { name: "Code changes: example.ts" })).toBeHidden();
      await diff.getByRole("button", { name: "Expand example.ts" }).click();
    }
    if (item === "markdown-editor") {
      const editor = page.getByRole("textbox", { name: "Registry note" });
      await expect(editor).toBeVisible();
      await editor.click();
      await editor.press("ControlOrMeta+A");
      await editor.pressSequentially("# Installed");
      await expect.poll(() => page.getByLabel("Registry Markdown", { exact: true }).textContent()).toBe("# Installed");
    }
    if (item === "media-viewer" || item === "ui") {
      await page.getByRole("button", { name: "Inspect registry media" }).click();
      const viewer = page.getByRole("dialog", { name: "Registry media" });
      await expect(viewer.getByText("Installed supporting details.")).toBeVisible();
      await viewer.getByRole("button", { name: "Actual size", exact: true }).click();
      await expect(viewer.getByRole("img", { name: "Example" })).toHaveJSProperty("clientWidth", 800);
      await viewer.getByRole("button", { name: "Close media viewer" }).click();
      await expect(page.getByRole("button", { name: "Inspect registry media" })).toBeFocused();
    }
    if (item === "ui") {
      const disclosure = page.getByRole("button", { name: "Registry disclosure" });
      await disclosure.click();
      await expect(page.getByRole("button", { name: "Installed section" })).toBeVisible();
      await disclosure.press("Space");
      await expect(disclosure).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("button", { name: "Installed section" })).toBeHidden();
      assert.ok(fonts.includes("Bell Gothic Black"), "Installed heading font must load");
      await page.getByRole("textbox", { name: "Email" }).fill("reader@example.com");
      await page.getByRole("checkbox", { name: "Accept updates" }).check();
      await expect(page.getByRole("checkbox", { name: "Accept updates" })).toBeChecked();
      const preferences = page.getByRole("form", { name: "Installed notification preferences" });
      const frequency = preferences.getByRole("radiogroup", { name: "Notification frequency" });
      await expect(frequency.getByRole("radio", { name: "Daily digest" })).toHaveAccessibleDescription("A daily summary.");
      await frequency.getByText("Weekly digest", { exact: true }).click();
      await expect(frequency.getByRole("radio", { name: "Weekly digest" })).toBeChecked();
      await expect(frequency.getByRole("radio", { name: "Daily digest" })).not.toBeChecked();
      await preferences.getByRole("button", { name: "Save frequency" }).click();
      await expect(preferences.getByRole("status", { name: "Saved frequency" })).toHaveText("weekly");
      const slider = page.getByRole("slider", { name: "Amount" });
      await slider.focus();
      await slider.press("ArrowRight");
      await expect(slider).toHaveAttribute("aria-valuenow", "60");
      await expect(slider).toHaveCSS("height", "44px");
      await slider.scrollIntoViewIfNeeded();
      const rect = await slider.boundingBox();
      assert.ok(rect);
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.mouse.move(rect.x - 100, rect.y + rect.height / 2);
      await expect(slider).toHaveAttribute("aria-valuenow", "0");
      const dragged = await slider.boundingBox();
      assert.ok(dragged);
      assert.equal(dragged.width, rect.width, "Reduced motion must not stretch the owned slider");
      assert.equal(dragged.x, rect.x, "Reduced motion must not move the owned slider");
      await page.mouse.up();
      await page.getByRole("button", { name: "Registry menu" }).click();
      await expect(page.getByRole("menuitem", { name: "Installed action" })).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Registry popover" }).click();
      await expect(page.getByRole("dialog", { name: "Installed preferences" })).toBeVisible();
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Installed preferences" })).toBeHidden();
      await expect(page.getByRole("button", { name: "Registry popover" })).toBeFocused();
      await page.getByRole("button", { name: "Open Registry controls" }).click();
      await expect(page.getByRole("region", { name: "Registry controls" })).toBeVisible();
      await page.getByRole("region", { name: "Introduction", exact: true }).focus();
      await page.keyboard.press("j");
      await expect(page.getByRole("region", { name: "Controls", exact: true })).toBeFocused();
      await page.keyboard.press("g");
      await page.keyboard.press("g");
      await expect(page.getByRole("region", { name: "Introduction", exact: true })).toBeFocused();
    }
    assert.deepEqual(errors, [], "Installed consumer must load without browser errors");
  } catch (error) {
    if (errors.length) console.error("Installed consumer browser errors:", errors);
    throw error;
  } finally {
    await page.close();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

async function checkApplicationFonts(browser, consumer, baseline, items) {
  const assetCss = async () => {
    const assets = path.join(consumer, "dist/assets");
    return (await Promise.all((await readdir(assets)).filter(file => file.endsWith(".css")).map(file => readFile(path.join(assets, file), "utf8")))).join("\n");
  };
  const before = await assetCss();
  assert.match(before, /data:font\//, "Default consumer must retain embedded fonts");
  const entry = path.join(consumer, "src/styles.css");
  const appCss = (await readFile(entry, "utf8")).replace('@/components/anaphor.css', '@/components/styles-base.css')
    + await readFile(path.join(root, "test/registry-consumer/application-fonts.css"), "utf8");
  await writeFile(entry, appCss);
  await mkdir(path.join(consumer, "public/fonts"), { recursive: true });
  for (const file of ["InterVariable.woff2", "InterVariable-Italic.woff2", "BellGothicStd-Black.woff2", "MagdaCleanMono-Regular.woff2"]) {
    await cp(path.join(root, "packages/design-system/src/fonts", file), path.join(consumer, "public/fonts", file));
  }
  // A real refresh can reinsert the default import. Only the app entry is normalized.
  await run(process.execPath, [installer, "add", ...items, "--cwd", consumer, "--overwrite", "--yes"], consumer);
  const refreshed = (await readFile(entry, "utf8")).replace(/^@import ["']@\/components\/anaphor\.css["'];\s*\n/gm, "");
  await writeFile(entry, refreshed);
  assert.equal((refreshed.match(/styles-base\.css/g) ?? []).length, 1);
  assert.ok(refreshed.includes('/fonts/InterVariable.woff2'), "Refresh must preserve application font declarations");
  for (const file of ["Inter-LICENSE.txt", "MagdaCleanMono-download-notice.txt"]) {
    assert.equal(await readFile(path.join(consumer, "src/components/fonts", file), "utf8"), await readFile(path.join(root, "packages/design-system/src/fonts", file), "utf8"));
  }
  await run("pnpm", ["run", "build"], consumer);
  const after = await assetCss();
  assert.doesNotMatch(after, /data:font\//, "Opt-out must remove embedded font bytes from emitted CSS");
  assert.equal((after.match(/@font-face/g) ?? []).length, 4, "Only application font faces may be emitted");
  const application = await checkBrowser(browser, consumer, "font-delivery", "application");
  assert.deepEqual(application.faces, baseline.faces, "Changing delivery must preserve families, weights, and styles");
  assert.deepEqual(application.specimens, baseline.specimens, "Loaded typography must keep the same geometry");
  const receipt = { embedded: { cssBytes: Buffer.byteLength(before), gzipBytes: gzipSync(before).length, ...baseline }, application: { cssBytes: Buffer.byteLength(after), gzipBytes: gzipSync(after).length, ...application } };
  await writeFile(path.join(root, "test-results/registry-fonts/receipt.json"), JSON.stringify(receipt, null, 2));
  console.log("Font delivery CSS bytes:", receipt.embedded.cssBytes, "embedded;", receipt.application.cssBytes, "application-owned");
}

let succeeded = false;
let browser;
try {
  console.log(`Registry verification workspace: ${temporary}`);
  await prepareRegistry();
  browser = await chromium.launch();
  for (const item of ["button", "diff", "media-viewer", "markdown-editor", "step-transition", "data-table", "ui", "font-delivery"]) {
    console.log(`\nChecking independent ${item} installation`);
    const consumer = path.join(temporary, item);
    await cp(path.join(root, "test/registry-consumer"), consumer, { recursive: true });
    await mkdir(path.join(consumer, "src"));
    await writeFile(path.join(consumer, "src/styles.css"), '@import "tailwindcss";\nbody { margin: 0; }\n');
    await run("pnpm", ["install", "--ignore-workspace"], consumer);
    const items = (item === "font-delivery" ? ["card", "text", "button"] : [item]).map(name => path.join(registryDirectory, `${name}.json`));
    await run(process.execPath, [installer, "add", ...items, "--cwd", consumer, "--yes"], consumer);
    await cp(path.join(consumer, item === "diff" ? "diff-consumer.tsx" : `${item}.tsx`), path.join(consumer, "src/main.tsx"));
    const installedCss = await readFile(path.join(consumer, "src/styles.css"), "utf8");
    assert.ok(installedCss.includes('@import "@/components/anaphor.css"'), "Installer must import the shared stylesheet");
    assert.ok(installedCss.includes("body { margin: 0; }"), "Installer must preserve application CSS");
    await run(process.execPath, [installer, "add", ...items, "--cwd", consumer, "--yes"], consumer);
    assert.equal(await readFile(path.join(consumer, "src/styles.css"), "utf8"), installedCss, "Reinstalling must not duplicate the stylesheet import");
    await run("pnpm", ["run", "build"], consumer);
    const fontBaseline = await checkBrowser(browser, consumer, item);
    if (item === "font-delivery") await checkApplicationFonts(browser, consumer, fontBaseline, items);
    console.log(`${item}: installed source, build, interaction, themes, and fonts passed`);
  }
  succeeded = true;
} finally {
  await browser?.close();
  if (succeeded) await rm(temporary, { recursive: true, force: true });
  else console.error(`Retained failing consumer for inspection: ${temporary}`);
}
