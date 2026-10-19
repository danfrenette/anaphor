import { expect, test } from "@playwright/test";

test("the manual has a continuous shell around an inset, independently scrolling card", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop canvas and card edge are visible together");
  await page.goto("/#workspace-shell");
  const shell = page.locator('[data-app-shell]');
  const top = shell.locator('[data-slot="workspace-top-bar"]').first();
  const card = shell.locator('[data-slot="workspace-card"]').first();
  const sidebar = shell.locator('[data-slot="sidebar"][data-side="left"]').first();
  const bottom = page.getByRole("contentinfo", { name: "Manual utilities" });
  const body = shell.locator('[data-slot="workspace-card-body"]').first();
  const topBox = await top.boundingBox();
  const cardBox = await card.boundingBox();
  const bottomBox = await bottom.boundingBox();
  if (!topBox || !cardBox || !bottomBox) throw new Error("Expected shell regions");
  expect(cardBox.y).toBeGreaterThan(topBox.y + topBox.height);
  expect(cardBox.y + cardBox.height).toBeLessThan(bottomBox.y);
  expect(await top.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(await bottom.evaluate(element => getComputedStyle(element).backgroundColor));
  expect(await sidebar.evaluate(element => getComputedStyle(element).borderRightWidth)).toBe("0px");
  expect(await bottom.evaluate(element => getComputedStyle(element).borderTopWidth)).toBe("0px");
  expect(await card.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe("none");
  expect(await shell.evaluate(element => element.scrollTop)).toBe(0);

  await page.locator("#input").scrollIntoViewIfNeeded();
  expect(await body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await shell.evaluate(element => element.scrollTop)).toBe(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("direct section links keep the shell and card anchored", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop shell shows all frame edges");
  await page.goto("/#workspace-shell");
  const shell = page.locator('[data-app-shell]');
  const top = shell.locator('[data-slot="workspace-top-bar"]').first();
  const body = shell.locator('[data-slot="workspace-card-body"]').first();
  await expect.poll(async () => await body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await shell.evaluate(element => element.scrollTop)).toBe(0);
  expect((await top.boundingBox())?.y).toBe(0);
});

test("optional shell regions collapse without blank tracks", async ({ page, isMobile }) => {
  test.skip(isMobile, "The compact preview uses desktop shell tracks");
  await page.goto("/#workspace-shell");
  const preview = page.locator('[data-slot="workspace-shell"][aria-label="Workspace composition preview"]');
  const controls = page.getByRole("group", { name: "Preview regions" });
  const card = preview.locator('[data-slot="workspace-card"]');
  const top = preview.locator('[data-slot="workspace-top-bar"]');
  const bottom = preview.locator('[data-slot="bottom-bar"]');
  const left = preview.getByRole("complementary", { name: "Preview navigation" });
  const right = preview.getByRole("complementary", { name: "Preview context" });
  const names = ["Top", "Navigation", "Context", "Bottom"] as const;

  for (let mask = 0; mask < 16; mask += 1) {
    for (let index = 0; index < names.length; index += 1) {
      const shouldShow = Boolean(mask & (1 << index));
      const control = controls.getByRole("button", { name: names[index], exact: true });
      if ((await control.getAttribute("aria-pressed")) !== String(shouldShow)) await control.click();
    }
    await expect(top).toHaveCount(Number(Boolean(mask & 1)));
    await expect(left).toHaveCount(Number(Boolean(mask & 2)));
    await expect(right).toHaveCount(Number(Boolean(mask & 4)));
    await expect(bottom).toHaveCount(Number(Boolean(mask & 8)));
    await expect(preview.getByRole("tab", { name: "Overview" })).toHaveCount(Number(Boolean(mask & 1)));
    const frame = await preview.boundingBox();
    const content = await card.boundingBox();
    if (!frame || !content) throw new Error("Expected card and preview frame");
    const leftWidth = (await left.count()) ? (await left.boundingBox())?.width ?? 0 : 0;
    const rightWidth = (await right.count()) ? (await right.boundingBox())?.width ?? 0 : 0;
    expect(content.x - frame.x).toBeCloseTo(leftWidth + 9, 0);
    expect(frame.x + frame.width - content.x - content.width).toBeCloseTo(rightWidth + 9, 0);
    if (!(mask & 1)) expect(content.y).toBeCloseTo(frame.y + 9, 0);
    if (!(mask & 8)) expect(content.y + content.height).toBeCloseTo(frame.y + frame.height - 9, 0);
  }
});

test("the mobile card becomes a flush page surface", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile page surface");
  await page.goto("/#workspace-shell");
  const shell = page.locator("[data-app-shell]");
  const card = shell.locator('[data-slot="workspace-card"]').first();
  const body = shell.locator('[data-slot="workspace-card-body"]').first();
  const viewport = page.viewportSize();
  const box = await card.boundingBox();
  if (!viewport || !box) throw new Error("Expected mobile card");
  expect(box.x).toBeCloseTo(0, 0);
  expect(box.width).toBeCloseTo(viewport.width, 0);
  expect(await card.evaluate(element => getComputedStyle(element).borderRadius)).toBe("0px");
  expect(await card.evaluate(element => getComputedStyle(element).boxShadow)).toMatch(/^(none|(?:rgba\([^)]*, 0\)(?: [^,]+)?(?:, )?)+)$/);
  expect(await body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByRole("contentinfo", { name: "Manual utilities" })).toBeVisible();
});

test("the two-sided preview card stays within its shell at RTL and 200% zoom", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop composition");
  await page.goto("/#workspace-shell");
  await page.evaluate(() => { document.documentElement.dir = "rtl"; document.documentElement.style.zoom = "2"; });
  const preview = page.locator('[data-slot="workspace-shell"][aria-label="Workspace composition preview"]');
  await expect(preview.getByRole("complementary", { name: "Preview navigation" })).toBeVisible();
  await expect(preview.getByRole("complementary", { name: "Preview context" })).toBeVisible();
  const card = preview.locator('[data-slot="workspace-card"]');
  const box = await card.boundingBox();
  const frame = await preview.boundingBox();
  if (!box || !frame) throw new Error("Expected zoomed preview card");
  expect(box.x).toBeGreaterThanOrEqual(frame.x);
  expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
  await expect(page.getByRole("contentinfo", { name: "Manual utilities" })).toBeVisible();
});

test("top tabs can be omitted while top controls remain", async ({ page, isMobile }) => {
  test.skip(isMobile, "The compact preview uses desktop shell tracks");
  await page.goto("/#workspace-shell");
  const preview = page.locator('[data-slot="workspace-shell"][aria-label="Workspace composition preview"]');
  await preview.getByRole("tab", { name: "Details" }).click();
  await expect(preview.getByText("Each view supplies its own content.")).toBeVisible();
  await page.getByRole("group", { name: "Preview regions" }).getByRole("button", { name: "Tabs", exact: true }).click();
  await expect(preview.getByRole("tablist")).toHaveCount(0);
  await expect(preview.getByText("Workspace controls")).toBeVisible();
  await expect(preview.locator('[data-slot="workspace-top-bar"]')).toBeVisible();
});

test("active tab labels stay aligned with their interactive tabs", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop preview shows both tab labels together");
  await page.goto("/#workspace-shell");
  const preview = page.locator('[data-slot="workspace-shell"][aria-label="Workspace composition preview"]');
  const alignment = () => preview.evaluate(root => {
    const tabs = [...root.querySelectorAll('[data-slot="tabs-tab"]')];
    const copies = [...root.querySelectorAll('[data-slot="tabs-active-copy"]')];
    return tabs.map((tab, index) => {
      const original = tab.getBoundingClientRect();
      const activeCopy = copies[index];
      if (!activeCopy) throw new Error("Expected a visual copy for each tab");
      const copy = activeCopy.getBoundingClientRect();
      return { x: copy.x - original.x, y: copy.y - original.y };
    });
  });
  for (const offset of await alignment()) {
    expect(Math.abs(offset.x)).toBeLessThan(0.5);
    expect(Math.abs(offset.y)).toBeLessThan(0.5);
  }
  const card = preview.locator('[data-slot="workspace-card"]');
  const before = await card.boundingBox();
  await preview.getByRole("tab", { name: "Details" }).click();
  for (const offset of await alignment()) {
    expect(Math.abs(offset.x)).toBeLessThan(0.5);
    expect(Math.abs(offset.y)).toBeLessThan(0.5);
  }
  expect(await card.boundingBox()).toEqual(before);
});
