import { expect, test } from "@playwright/test";

test("sidebar playground selection, placement, resizing and reset stay local", async ({ page, isMobile }) => {
  await page.goto("/#sidebar");
  const section = page.locator("#sidebar");
  for (const name of ["Anatomy", "Placement", "Playground"]) await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  const preview = section.getByLabel("Sidebar playground", { exact: true });
  const provider = preview.locator('[data-slot="sidebar-provider"]');
  const outer = page.locator('[data-app-shell] > [data-slot="sidebar-provider"]');
  if (isMobile) await preview.getByRole("button", { name: "Open playground sidebar" }).click();
  const nav = page.getByLabel("Sidebar preview navigation", { exact: true });
  await nav.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(preview).toContainText("Keep your projects in one place.");
  if (!isMobile) {
    const trigger = preview.getByRole("button", { name: "Toggle playground sidebar" });
    await trigger.click();
    await expect(provider).toHaveAttribute("data-desktop-open", "false");
    await trigger.press("Enter");
    await expect(provider).toHaveAttribute("data-motion", "instant");
  }
  await expect(outer).toHaveAttribute("data-desktop-open", "true");
  await page.getByRole("tab", { name: "Open Sidebar controls", exact: true }).click();
  const controls = page.getByRole("region", { name: "Sidebar controls", exact: true });
  await controls.getByRole("button", { name: "Placement", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "right", exact: true }).click();
  await controls.getByRole("checkbox", { name: "Resizable", exact: true }).check();
  await expect(provider).toHaveAttribute("data-side", "right");
  await expect(outer).toHaveAttribute("data-side", "left");
  await page.getByRole("button", { name: "Close controls" }).click();
  if (!isMobile) {
    const rail = preview.locator('[data-slot="sidebar-rail"]');
    const width = await nav.evaluate(el => el.getBoundingClientRect().width);
    await rail.press("ArrowLeft");
    await expect.poll(() => nav.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(width);
  } else {
    await preview.getByRole("button", { name: "Open playground sidebar" }).click();
    await page.getByRole("button", { name: "Close sidebar preview" }).click();
    await expect(preview.getByRole("button", { name: "Open playground sidebar" })).toBeFocused();
  }
  await page.getByRole("tab", { name: "Open Sidebar controls", exact: true }).click();
  await controls.getByRole("button", { name: "Reset controls" }).click();
  await expect(provider).toHaveAttribute("data-side", "left");
  await expect(provider).toHaveAttribute("data-resizable", "false");
  await expect(preview).toContainText("Your workspace at a glance.");
  await page.getByRole("button", { name: "Close controls" }).click();
  await section.getByRole("button", { name: "Show playground code", exact: true }).press("Enter");
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText('side="left"');
  expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("right-hand example selects destinations and toggles independently", async ({ page, isMobile }) => {
  await page.goto("/#sidebar");
  const example = page.getByLabel("Right-hand sidebar example", { exact: true });
  if (isMobile) await example.getByRole("button", { name: "Open right-hand navigation" }).click();
  await page.getByLabel("Right-hand navigation", { exact: true }).getByRole("button", { name: "Activity", exact: true }).click();
  await expect(example.locator('[data-slot="workspace-card-header"]')).toContainText("Activity");
  if (!isMobile) {
    await example.getByRole("button", { name: "Toggle right-hand navigation" }).click();
    await expect(example.locator('[data-slot="sidebar-provider"]')).toHaveAttribute("data-desktop-open", "false");
    await example.getByRole("button", { name: "Toggle right-hand navigation" }).press("Enter");
  } else {
    await example.getByRole("button", { name: "Open right-hand navigation" }).click();
    await page.getByRole("button", { name: "Close sidebar preview" }).click();
    await expect(example.getByRole("button", { name: "Open right-hand navigation" })).toBeFocused();
  }
  await expect(page.getByLabel("Sidebar playground", { exact: true }).locator('[data-slot="sidebar-provider"]')).toHaveAttribute("data-side", "left");
});
