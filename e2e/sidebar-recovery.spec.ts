import { expect, test } from "@playwright/test";

const panel = (page: import("@playwright/test").Page) => page.locator('[data-app-shell] [data-slot="sidebar"]');
const top = (page: import("@playwright/test").Page) => page.locator('[data-app-shell] [data-slot="workspace-top-bar"]');

for (const side of ["left", "right"] as const) {
  test(`the ${side} workspace rail keeps label width throughout collapse and reopening`, async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop workspace rail");
    await page.goto("/#sidebar");
    await page.getByRole("group", { name: "Sidebar placement" }).getByRole("button", { name: new RegExp(`^${side}$`, "i") }).click();
    const rail = panel(page);
    const before = await rail.evaluate(element => ({ width: element.getBoundingClientRect().width, brandHeight: element.querySelector('[aria-label="Anaphor home"]')!.getBoundingClientRect().height }));
    await top(page).getByRole("button", { name: "Collapse sidebar", exact: true }).click();
    const frames = await rail.evaluate(async element => {
      const samples: Array<{ width: number; brandHeight: number }> = [];
      const start = performance.now();
      do {
        await new Promise(requestAnimationFrame);
        samples.push({ width: element.getBoundingClientRect().width, brandHeight: element.querySelector('[aria-label="Anaphor home"]')!.getBoundingClientRect().height });
      } while (performance.now() - start < 350);
      return samples;
    });
    expect(frames.length).toBeGreaterThan(2);
    for (const frame of frames) {
      expect(frame.width).toBeCloseTo(before.width, 0);
      expect(frame.brandHeight).toBeCloseTo(before.brandHeight, 0);
    }
    await expect(rail).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Manual index" })).toBeHidden();
    await top(page).getByRole("button", { name: "Open sidebar", exact: true }).click();
    await expect(rail).toBeVisible();
    await expect.poll(() => rail.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeCloseTo(0, 0);
    expect(await rail.evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(before.width, 0);
  });
}

test("the right header trigger follows its rail without overlapping the manual tab", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop header");
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/#sidebar");
  await page.getByRole("group", { name: "Sidebar placement" }).getByRole("button", { name: /^right$/i }).click();
  for (const { width, fontSize } of [{ width: 768, fontSize: "16px" }, { width: 1024, fontSize: "20px" }]) {
    await page.setViewportSize({ width, height: 900 });
    for (const direction of ["ltr", "rtl"] as const) {
      await page.evaluate(({ dir, size }) => { document.documentElement.dir = dir; document.documentElement.style.fontSize = size; }, { dir: direction, size: fontSize });
      for (const name of ["Collapse sidebar", "Open sidebar"]) {
        const trigger = top(page).getByRole("button", { name, exact: true });
        const button = await trigger.boundingBox();
        const tab = await page.getByRole("tab", { name: "Reference manual", exact: true }).boundingBox();
        if (!button || !tab) throw new Error("Expected header controls");
        expect(button.x).toBeGreaterThanOrEqual(0);
        expect(button.x + button.width).toBeLessThanOrEqual(width);
        expect(direction === "ltr" ? button.x >= tab.x + tab.width : button.x + button.width <= tab.x).toBe(true);
        expect(direction === "ltr" ? button.x : width - button.x - button.width).toBeGreaterThan(width - 60);
        await trigger.click();
      }
    }
  }
});

test("the sidebar example operates the rail or drawer and returns mobile focus", async ({ page, isMobile }) => {
  await page.goto("/#sidebar");
  const section = page.locator("#sidebar");
  const trigger = section.getByRole("button", { name: isMobile ? "Open sidebar in section" : "Collapse sidebar in section", exact: true });
  await trigger.click();
  if (isMobile) {
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close sidebar", exact: true }).click();
    await expect(trigger).toBeFocused();
  } else {
    await expect(panel(page)).toBeHidden();
    await section.getByRole("button", { name: "Open sidebar in section", exact: true }).click();
    await expect(panel(page)).toBeVisible();
  }
});
