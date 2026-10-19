import { expect, test } from "@playwright/test";

test("graph catalog delivers pulses and keeps notebook controls usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#node-edge-graphs");
  const section = page.locator("#node-edge-graphs");
  for (const name of ["Nodes & connections", "Pulse feedback", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  const pulse = section.getByRole("region", { name: "Pulse feedback", exact: true });
  await pulse.getByRole("button", { name: "Send forward" }).click();
  await expect(pulse.locator("p[role=status]")).toHaveText("Arrived at destination.");
  await pulse.getByRole("button", { name: "Send backward" }).click();
  await expect(pulse.locator("p[role=status]")).toHaveText("Arrived at source.");
  await section.getByRole("button", { name: "Show nodes & connections code" }).press("Enter");
  await expect(section.getByLabel("Nodes & connections code", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Show nodes & connections code" }).press("Enter");
  await section.getByRole("button", { name: "Capture from Quick note" }).click();
  await expect(section.locator("#diagram-notebook").getByText("Rev 01")).toBeVisible();
  await section.getByRole("button", { name: "Reset diagram" }).click();
  await expect(section.locator("#diagram-notebook").getByText("Rev 00")).toBeVisible();
  await page.getByRole("tab", { name: "Open Node-edge graphs controls" }).click();
  const controls = page.getByRole("region", { name: "Node-edge graphs controls", exact: true });
  await controls.getByRole("checkbox", { name: "Loop playback", exact: true }).check();
  await controls.getByRole("slider", { name: "Pulse speed", exact: true }).press("ArrowRight");
  await controls.getByRole("button", { name: "Reset controls" }).click();
  await expect(controls.getByRole("checkbox", { name: "Loop playback", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Close controls" }).click();
  await section.getByRole("button", { name: "Play flow" }).click();
  await section.getByRole("button", { name: "Stop flow" }).click();
  await expect(section.getByRole("button", { name: "Play flow" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
