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

for (const side of ["left", "right"] as const) {
  for (const { direction, zoom } of [{ direction: "ltr", zoom: 1 }, { direction: "rtl", zoom: 1 }, { direction: "ltr", zoom: 2 }] as const) {
    test(`${side} rail and card keep their gutter on every frame, including reversals (${direction}, ${zoom}x)`, async ({ page, isMobile }) => {
      test.skip(isMobile, "Desktop workspace geometry");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/#sidebar");
      await page.evaluate(({ direction, zoom }) => { document.documentElement.dir = direction; document.documentElement.style.zoom = String(zoom); }, { direction, zoom });
      await page.getByRole("group", { name: "Sidebar placement" }).getByRole("button", { name: new RegExp(`^${side}$`, "i") }).click();
      await page.evaluate(() => document.fonts.ready);
      const result = await panel(page).evaluate(async (rail, physicalLeft) => {
        const shell = rail.closest('[data-slot="workspace-shell"]')!;
        const provider = rail.closest<HTMLElement>('[data-slot="sidebar-provider"]')!;
        // Inspect many intermediate frames, rather than only settled endpoints.
        provider.style.setProperty("--anaphor-sidebar-duration", "600ms");
        provider.style.setProperty("--anaphor-sidebar-exit-duration", "600ms");
        const card = shell.querySelector('[data-slot="workspace-card"]')!;
        const label = card.querySelector("#sidebar h2")!;
        const text = document.createRange();
        text.selectNodeContents(label);
        const expectedTextWidth = text.getBoundingClientRect().width;
        const read = () => {
          const p = rail.getBoundingClientRect();
          const c = card.getBoundingClientRect();
          return { gap: physicalLeft ? c.left - p.right : p.left - c.right,
            outerEdge: physicalLeft ? c.right : c.left,
            cardWidth: c.width, textWidth: text.getBoundingClientRect().width,
            closed: provider.dataset.desktopOpen === "false", inert: rail instanceof HTMLElement && rail.inert };
        };
        const initial = read();
        const samples = [initial];
        const toggle = () => {
          const trigger = [...shell.querySelectorAll<HTMLButtonElement>('[data-slot="workspace-top-bar"] [data-slot="sidebar-trigger"]')].find(button => getComputedStyle(button).display !== "none");
          if (!trigger) throw new Error("Missing desktop trigger");
          trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
        };
        let largestReversalStep = 0;
        for (const frames of [8, 8, 45, 45]) {
          const before = read();
          toggle();
          for (let frame = 0; frame < frames; frame += 1) {
            await new Promise(requestAnimationFrame);
            const sample = read();
            if (frame === 0) largestReversalStep = Math.max(largestReversalStep, Math.abs(sample.cardWidth - before.cardWidth));
            samples.push(sample);
          }
        }
        return { initial, samples, expectedTextWidth, largestReversalStep };
      }, (side === "left") !== (direction === "rtl"));
      expect(result.samples.length).toBeGreaterThan(50);
      expect(result.largestReversalStep).toBeLessThan(40 * zoom);
      expect(new Set(result.samples.map(sample => Math.round(sample.cardWidth))).size).toBeGreaterThan(10);
      for (const sample of result.samples) {
        expect(sample.gap).toBeCloseTo(result.initial.gap, 0);
        expect(sample.outerEdge).toBeCloseTo(result.initial.outerEdge, 0);
        expect(sample.textWidth).toBeCloseTo(result.expectedTextWidth, 0);
        expect(sample.inert).toBe(sample.closed);
      }
      await expect(panel(page)).toBeVisible();
    });
  }
}

for (const interrupt of ["reduced motion", "viewport resize", "text direction"] as const) {
  test(`workspace motion settles when interrupted by ${interrupt}`, async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop workspace transition");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/#sidebar");
    const card = page.locator('[data-app-shell] [data-slot="workspace-card"]').first();
    await page.locator('[data-app-shell] [data-slot="sidebar-provider"]').evaluate(element => {
      if (!(element instanceof HTMLElement)) throw new Error("Expected provider");
      element.style.setProperty("--anaphor-sidebar-exit-duration", "1000ms");
    });
    await top(page).getByRole("button", { name: "Collapse sidebar", exact: true }).click();
    await expect.poll(() => card.evaluate(element => element.style.transform)).not.toBe("");
    if (interrupt === "reduced motion") await page.emulateMedia({ reducedMotion: "reduce" });
    else if (interrupt === "viewport resize") await page.setViewportSize({ width: 320, height: 800 });
    else await page.evaluate(() => { document.documentElement.dir = "rtl"; });
    await expect(card).toHaveCSS("transform", "none");
    await expect.poll(() => card.evaluate(element => element.getBoundingClientRect().width)).toBe(interrupt === "viewport resize" ? 320 : 1264);
    await expect.poll(() => card.evaluate(element => [...element.children].every(child => !(child instanceof HTMLElement) || child.style.transform === ""))).toBe(true);
    if (interrupt === "viewport resize") {
      await page.setViewportSize({ width: 1280, height: 900 });
      await top(page).getByRole("button", { name: "Open sidebar", exact: true }).click();
      await expect(panel(page)).toBeVisible();
      await expect(card).toHaveCSS("transform", "none");
    } else {
      await expect(panel(page)).toBeHidden();
    }
  });
}


test("the left exit keeps text painted after a delayed commit at normal timing", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop workspace exit");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#sidebar");
  await page.evaluate(() => document.fonts.ready);
  const samples = await panel(page).evaluate(async rail => {
    const provider = rail.closest<HTMLElement>('[data-slot="sidebar-provider"]')!;
    const destination = rail.querySelector('[data-slot="sidebar-menu-button"]')!;
    const text = document.createRange();
    text.selectNodeContents(destination);
    const initial = rail.getBoundingClientRect();
    const delayedCommit = new MutationObserver(() => {
      if (provider.dataset.desktopOpen !== "false") return;
      delayedCommit.disconnect();
      // Model work after the coordinator's layout effect and before paint.
      const until = performance.now() + 80;
      while (performance.now() < until) { /* Busy commit */ }
    });
    delayedCommit.observe(provider, { attributes: true, attributeFilter: ["data-desktop-open"] });
    const frames: Array<{ distance: number; textRight: number; visibility: string }> = [];
    const trigger = provider.querySelector<HTMLButtonElement>('[data-slot="workspace-top-bar"] [data-slot="sidebar-trigger"]')!;
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    for (let frame = 0; frame < 30; frame += 1) {
      await new Promise(requestAnimationFrame);
      frames.push({ distance: initial.x - rail.getBoundingClientRect().x, textRight: text.getBoundingClientRect().right, visibility: getComputedStyle(destination).visibility });
    }
    delayedCommit.disconnect();
    return { frames, width: initial.width };
  });
  const firstMoving = samples.frames.find(frame => frame.distance > 1);
  expect(firstMoving).toBeDefined();
  expect(firstMoving!.distance).toBeLessThan(samples.width / 2);
  expect(firstMoving!.textRight).toBeGreaterThan(0);
  expect(firstMoving!.visibility).toBe("visible");
  expect(samples.frames.filter(frame => frame.distance > 1 && frame.textRight > 0).length).toBeGreaterThan(1);
  await expect(panel(page)).toBeHidden();
});
