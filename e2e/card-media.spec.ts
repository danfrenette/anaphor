import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Card documentation shows shader child content and a playable node-edge diagram", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/#card-media");
  const examples = page.locator("#card-media");
  await examples.scrollIntoViewIfNeeded();
  await expect(examples.locator(".rocaille-artwork")).toHaveAttribute("data-renderer", "webgl");
  await expect(examples.getByRole("link", { name: "Xor / @XorDev" })).toHaveAttribute("href", "https://x.com/XorDev/status/2015813875833225715");
  await expect(examples.getByRole("heading", { name: "Node-edge diagram" })).toBeVisible();
  await expect(examples.getByRole("link", { name: "Open the full study" })).toHaveAttribute("href", "/studies/node-edge-graphs");
  const diagram = examples.getByRole("group", { name: "Capture connects to Organize, then Recall" });
  await diagram.getByRole("button", { name: "Play three-node diagram" }).click();
  await expect(diagram.getByRole("status")).toHaveText("Following the three-node flow");
  await expect(diagram.getByRole("status")).toHaveText("Ready to play");
  await examples.getByRole("button", { name: "Pause Rocaille preview" }).click();
  await expect(examples.getByRole("button", { name: "Play Rocaille preview" })).toHaveAttribute("aria-pressed", "false");
  await mkdir(".impeccable/review", { recursive: true });
  await examples.screenshot({ path: `.impeccable/review/card-media-${testInfo.project.name}.png`, animations: "disabled" });
  expect((await new AxeBuilder({ page }).include("#card-media").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(examples.getByRole("button", { name: "Play Rocaille preview" })).toBeDisabled();
  expect(errors).toEqual([]);
});
