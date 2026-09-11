import { expect, test } from "@playwright/test";

test("scrolling during playback keeps the pulse light on its edge", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await page.goto("/studies/node-edge-graphs");
  const region = page.getByRole("region", { name: "Notebook diagram; scroll horizontally to explore" });
  await region.scrollIntoViewIfNeeded();
  await page.clock.install({ time: new Date("2026-09-10T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-10T00:00:01Z"));
  await region.getByRole("button", { name: "Capture from Audio capture" }).click();
  await page.clock.runFor(100);

  const edge = page.locator('[data-edge-id="audio-notebook"] > path');
  const light = page.locator('.pulse-route-light > path');
  const originalRoute = await edge.getAttribute("d");
  expect(originalRoute).toBeTruthy();
  await expect(light).toHaveAttribute("d", originalRoute!);

  await region.evaluate(element => { element.scrollLeft = 140; });
  await page.clock.runFor(100);
  await expect(edge).not.toHaveAttribute("d", originalRoute!);
  await page.clock.runFor(16);
  await expect(light).toHaveAttribute("d", (await edge.getAttribute("d"))!);

  await page.getByRole("button", { name: "Reset diagram" }).click();
  await expect(page.locator(".pulse, .pulse-route-light")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Choose something to capture");
});
