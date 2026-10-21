import { expect, test } from "@playwright/test";

test("Tabs search navigates by keyboard and updates the manual context", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await page.getByRole("button", { name: "Search manual" }).click();
  const dialog = page.getByRole("dialog", { name: "Search the manual" });
  const input = dialog.getByRole("combobox");
  await input.fill("Tabs");
  await expect(dialog.getByRole("option", { name: "Tabs", exact: true })).toHaveAttribute("data-highlighted", "");
  await input.press("Enter");

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/#tabs$/);
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Navigation/Tabs");
  await expect(page.locator("#tabs")).toHaveAttribute("data-active", "");
  if (isMobile) await expect(page.locator('[data-slot="sidebar"]')).toBeHidden();
});

test("a direct Tabs link settles the breadcrumb and active index entry", async ({ page, isMobile }) => {
  await page.goto("/#tabs");
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Navigation/Tabs");
  await expect(page.locator("#tabs")).toHaveAttribute("data-active", "");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const link = page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Tabs", exact: true });
  await expect(link).toHaveAttribute("href", "/#tabs");
  await expect(link).toHaveAttribute("aria-current", "page");
});

test("activating Tabs in the narrow index dismisses the drawer", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile index dismissal is breakpoint-specific");
  await page.goto("/");
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const link = page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Tabs", exact: true });
  await link.focus();
  await link.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/#tabs$/);
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Navigation/Tabs");
});

test("the combined Typography reference is searchable and has matching route context", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await page.getByRole("button", { name: "Search manual" }).click();
  const dialog = page.getByRole("dialog", { name: "Search the manual" });
  const input = dialog.getByRole("combobox");
  await input.fill("Typography");
  await expect(dialog.getByRole("option", { name: "Typography", exact: true })).toBeVisible();
  await input.press("Enter");

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/typography$/);
  await expect(page.getByRole("heading", { name: "Typography", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Foundations/Typography");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Typography", exact: true })).toHaveAttribute("aria-current", "page");
});


test("legacy Principles links retain Overview context without retired navigation", async ({ page, isMobile }) => {
  await page.goto("/#principles");
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Manual/Overview");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const index = page.getByRole("navigation", { name: "Manual index" });
  await expect(index.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(index.getByRole("link", { name: /Studies|Signal|Field Notes|Source Outline|Principles/ })).toHaveCount(0);
});

test("index groups are alphabetized and in-page sections follow their order", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const index = page.getByRole("navigation", { name: "Manual index" });
  for (const list of await index.getByRole("list").all()) {
    const labels = await list.getByRole("link").allTextContents();
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  }
  const links = await index.getByRole("link").evaluateAll(elements => elements.map(el => el.getAttribute("href")!));
  const expected = links.flatMap(href => href.startsWith("/#") ? [href.slice(2)] : href === "/typography" ? ["typography"] : []);
  const actual = await page.locator("article section[id], article header[id]").evaluateAll(elements => elements.map(el => el.id));
  // Principles is retained as an Overview subsection for incoming links.
  expect(actual.filter(id => id !== "principles")).toEqual(expected);
  await index.getByRole("link", { name: "Workspace shell", exact: true }).click();
  await expect(page.locator("#workspace-shell")).toHaveAttribute("data-active", "");
  await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText("Navigation/Workspace shell");
});

for (const [id, label] of [["authored-notes", "Authored notes"], ["unchanged-excerpts", "Unchanged excerpts"]]) {
  test(`${label} is reachable from the Content index`, async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
    const link = page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: label, exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/#${id}$`));
    await expect(page.locator(`#${id}`)).toHaveAttribute("data-active", "");
    await expect(page.locator(`#${id}`).getByRole("heading", { name: label, exact: true })).toBeVisible();
    await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText(`Content/${label}`);
    if (isMobile) await expect(page.locator('[data-slot="sidebar"]')).toBeHidden();
  });
}
