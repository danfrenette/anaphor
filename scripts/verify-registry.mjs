import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const installer = path.join(root, "node_modules/shadcn/dist/index.js");
const temporary = await mkdtemp(path.join(tmpdir(), "anaphor-registry-"));
const registryDirectory = path.join(temporary, "registry");

async function run(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: "inherit", timeout: 180_000 });
  const [code, signal] = await once(child, "exit");
  assert.equal(code, 0, `${command} ${args.join(" ")} failed (${signal ?? code})`);
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
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
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

async function checkBrowser(browser, directory, item) {
  const { server, url } = await serve(path.join(directory, "dist"));
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => errors.push(request.url()));
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url);
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
    if (item === "ui") {
      await expect(page.getByRole("heading", { name: "The problem", exact: true })).toBeVisible();
      await expect(page.getByText("Installed capture unavailable", { exact: true })).toBeVisible();
      await page.getByText("Installed execution details", { exact: true }).click();
      await expect(page.getByText("Consumer-owned receipt.", { exact: true })).toBeVisible();
      await expect(page.locator("diffs-container")).toBeVisible();
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
  } finally {
    await page.close();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

let succeeded = false;
let browser;
try {
  console.log(`Registry verification workspace: ${temporary}`);
  await prepareRegistry();
  browser = await chromium.launch();
  for (const item of ["button", "ui"]) {
    console.log(`\nChecking independent ${item} installation`);
    const consumer = path.join(temporary, item);
    await cp(path.join(root, "test/registry-consumer"), consumer, { recursive: true });
    await mkdir(path.join(consumer, "src"));
    await writeFile(path.join(consumer, "src/styles.css"), '@import "tailwindcss";\nbody { margin: 0; }\n');
    await run("pnpm", ["install", "--ignore-workspace"], consumer);
    await run(process.execPath, [installer, "add", path.join(registryDirectory, `${item}.json`), "--cwd", consumer, "--yes"], consumer);
    await cp(path.join(consumer, `${item}.tsx`), path.join(consumer, "src/main.tsx"));
    const installedCss = await readFile(path.join(consumer, "src/styles.css"), "utf8");
    assert.ok(installedCss.includes('@import "@/components/anaphor.css"'), "Installer must import the shared stylesheet");
    assert.ok(installedCss.includes("body { margin: 0; }"), "Installer must preserve application CSS");
    await run(process.execPath, [installer, "add", path.join(registryDirectory, `${item}.json`), "--cwd", consumer, "--yes"], consumer);
    assert.equal(await readFile(path.join(consumer, "src/styles.css"), "utf8"), installedCss, "Reinstalling must not duplicate the stylesheet import");
    await run("pnpm", ["run", "build"], consumer);
    await checkBrowser(browser, consumer, item);
    console.log(`${item}: installed source, build, interaction, themes, and fonts passed`);
  }
  succeeded = true;
} finally {
  await browser?.close();
  if (succeeded) await rm(temporary, { recursive: true, force: true });
  else console.error(`Retained failing consumer for inspection: ${temporary}`);
}
