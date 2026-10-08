import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const railName = "Related reading, Rail carousel";
const deckName = "Related reading, Deck carousel";

async function clickExposedPreview(page: Page, preview: Locator, touch: boolean) {
  await preview.scrollIntoViewIfNeeded();
  const point = await preview.evaluate(element => {
    const rect = element.getBoundingClientRect();
    for (const fractionY of [0.5, 0.25, 0.75]) {
      const y = rect.y + rect.height * fractionY;
      if (y < 0 || y >= innerHeight) continue;
      const exposed: number[] = [];
      for (let x = Math.max(0, rect.x); x < Math.min(innerWidth, rect.right); x += 2) {
        if (document.elementFromPoint(x, y) === element) exposed.push(x);
      }
      if (exposed.length) return { x: exposed[Math.floor(exposed.length / 2)]!, y };
    }
    throw new Error("Expected a pointer-accessible Deck preview");
  });
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

test("Rail keyboard navigation has finite boundaries and preserves pager focus", async ({ page }) => {
  await page.goto("/carousels?tab=rail");
  const rail = page.getByRole("region", { name: railName });
  const previous = rail.getByRole("button", { name: "Previous card" });
  const next = rail.getByRole("button", { name: "Next card" });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.focus();
  await next.press("End");
  await expect(next).toBeDisabled();
  await expect(next).toBeFocused();
  await expect(rail.getByRole("heading", { name: "Leave a little room" })).toBeInViewport();
  await next.press("ArrowRight");
  await expect(next).toBeDisabled();
  await next.press("Home");
  await expect(previous).toBeDisabled();
  await expect(rail.getByRole("heading", { name: "Give movement a job" })).toBeInViewport();
  await next.press("ArrowRight");
  await expect(previous).toBeEnabled();
  await expect(rail.locator('[aria-live]')).toHaveCount(0);
});

test("Deck previews select content without opening hidden links and retain keyboard continuity", async ({ page, isMobile }) => {
  await page.goto("/carousels?tab=deck");
  const deck = page.getByRole("region", { name: deckName });
  const next = deck.getByRole("button", { name: "Next card" });
  await expect(deck.getByRole("link", { name: "Read the note" })).toHaveCount(1);
  await expect(deck.getByRole("heading", { name: "Give movement a job" })).toBeVisible();
  const second = deck.getByRole("button", { name: "Show Make room for attention", exact: true });
  await clickExposedPreview(page, second, isMobile);
  await expect(page).toHaveURL(/\/carousels\?tab=deck$/);
  await expect(deck.getByRole("heading", { name: "Make room for attention" })).toBeVisible();
  await expect(deck).toBeFocused();
  await expect(deck.getByRole("link", { name: "Read the note" })).toHaveCount(1);
  const first = deck.getByRole("button", { name: "Show Give movement a job", exact: true });
  await first.focus();
  await first.press("Enter");
  await expect(deck.getByRole("heading", { name: "Give movement a job" })).toBeVisible();
  await expect(deck).toBeFocused();
  await deck.press("End");
  await expect(next).toBeDisabled();
  await expect(deck.getByRole("heading", { name: "Leave a little room" })).toBeVisible();
  await deck.press("ArrowRight");
  await expect(next).toBeDisabled();
  await deck.press("Home");
  await expect(deck.getByRole("button", { name: "Previous card" })).toBeDisabled();
  await deck.press("ArrowLeft");
  await expect(deck.getByRole("heading", { name: "Give movement a job" })).toBeVisible();
});

test("Rail mouse dragging moves the collection without opening a dragged link", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse drag is the desktop input path; trusted touch is covered separately");
  await page.goto("/carousels?tab=rail");
  const rail = page.getByRole("region", { name: railName });
  const link = rail.getByRole("link", { name: "Read the note" }).nth(1);
  const heading = rail.getByRole("heading", { name: "Give movement a job" });
  await link.scrollIntoViewIfNeeded();
  const linkBounds = await link.boundingBox();
  const before = await heading.boundingBox();
  if (!linkBounds || !before) throw new Error("Expected the first Rail card");
  const x = linkBounds.x + linkBounds.width / 2;
  const y = linkBounds.y + linkBounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 320, y, { steps: 12 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/carousels\?tab=rail$/);
  await expect(rail.getByRole("button", { name: "Previous card" })).toBeEnabled();
  await expect.poll(async () => (await heading.boundingBox())?.x ?? before.x).toBeLessThan(before.x - 80);
  await rail.focus();
  await rail.press("Home");
  await expect(rail.getByRole("button", { name: "Previous card" })).toBeDisabled();
  await rail.getByRole("link", { name: "Read the note" }).first().click();
  await expect(page).toHaveURL(/\/studies\/field-notes#useful-motion$/);
});

test("trusted touch swipes navigate Rail and Deck at 320px", async ({ browser, browserName, baseURL }) => {
  test.skip(browserName !== "chromium", "Playwright's trusted touch movement requires Chromium CDP");
  const context = await browser.newContext({ baseURL, viewport: { width: 320, height: 800 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    for (const style of ["rail", "deck"] as const) {
      await page.goto(`/carousels?tab=${style}`);
      const carousel = page.getByRole("region", { name: style === "rail" ? railName : deckName });
      const heading = carousel.getByRole("heading", { name: "Give movement a job" });
      await heading.scrollIntoViewIfNeeded();
      const bounds = await heading.boundingBox();
      if (!bounds) throw new Error("Expected a touch-accessible card");
      const startX = bounds.x + bounds.width * 0.8;
      const y = bounds.y + bounds.height / 2;
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] });
      for (let step = 1; step <= 8; step++) {
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: startX - step * 18, y }] });
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect(carousel.getByRole("button", { name: "Previous card" })).toBeEnabled();
      if (style === "deck") await expect(carousel.getByRole("heading", { name: "Make room for attention" })).toBeVisible();
      else await expect.poll(async () => (await heading.boundingBox())?.x ?? bounds.x).toBeLessThan(bounds.x - 60);
      await expect(page).toHaveURL(new RegExp(`/carousels\\?tab=${style}$`));
    }
  } finally {
    await context.close();
  }
});

test("carousel tabs survive reload and old prototype links reach the selected demo", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Rail and Deck" }).click();
  await expect(page.getByRole("region", { name: railName })).toBeVisible();
  await page.getByRole("tab", { name: "Deck", exact: true }).click();
  await expect(page).toHaveURL(/\/carousels\?tab=deck$/);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Deck", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("region", { name: deckName })).toBeVisible();
  await page.getByRole("tab", { name: "Rail", exact: true }).click();
  await expect(page).toHaveURL(/\/carousels\?tab=rail$/);
  await page.reload();
  await expect(page.getByRole("region", { name: railName })).toBeVisible();
  for (const [version, style, name] of [["1", "rail", railName], ["2", "deck", deckName], ["unknown", "rail", railName]]) {
    await page.goto(`/proto/carousel?v=${version}`);
    await expect(page).toHaveURL(new RegExp(`/carousels\\?tab=${style}$`));
    await expect(page.getByRole("region", { name: name })).toBeVisible();
  }
});

for (const style of ["rail", "deck"] as const) {
  test(`${style} reduced-motion and keyboard navigation settle without spatial animation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/carousels?tab=${style}`);
    const carousel = page.getByRole("region", { name: style === "rail" ? railName : deckName });
    await carousel.getByRole("button", { name: "Next card" }).click();
    await expect(carousel.getByRole("button", { name: "Previous card" })).toBeEnabled();
    const second = carousel.getByRole("heading", { name: "Make room for attention" });
    await expect(second).toBeInViewport();
    const assertStill = async () => {
      const positions = await second.evaluate(element => new Promise<number[]>(resolve => {
        const positions: number[] = [];
        const sample = () => {
          positions.push(element.getBoundingClientRect().x);
          if (positions.length === 5) resolve(positions);
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }));
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(0.1);
      expect(await carousel.evaluate(element => element.getAnimations({ subtree: true }).filter(animation =>
        animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes().some(frame => "transform" in frame)).length)).toBe(0);
    };
    await assertStill();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await carousel.focus();
    await carousel.press("Home");
    await carousel.press("ArrowRight");
    await expect(carousel.getByRole("button", { name: "Previous card" })).toBeEnabled();
    await assertStill();
    await expect(carousel).toBeFocused();
    await expect(carousel).toHaveCSS("outline-style", "solid");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${style} remains accessible and fits the viewport in ${theme} theme`, async ({ page }, testInfo) => {
      const pageErrors: string[] = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(`/carousels?tab=${style}`);
      await expect(page.getByRole("button", { name: `Switch to ${theme === "light" ? "dark" : "light"} theme` })).toBeVisible();
      const carousel = page.getByRole("region", { name: style === "rail" ? railName : deckName });
      await expect(carousel).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const bounds = await carousel.boundingBox();
      const viewport = page.viewportSize();
      if (!bounds || !viewport) throw new Error("Expected a visible carousel viewport");
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      for (const name of ["Previous card", "Next card"]) {
        const target = await carousel.getByRole("button", { name }).boundingBox();
        expect(target?.width).toBeGreaterThanOrEqual(44);
        expect(target?.height).toBeGreaterThanOrEqual(44);
      }
      const scan = await new AxeBuilder({ page }).include("#content").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
      expect(scan.violations).toEqual([]);
      expect(pageErrors).toEqual([]);
      for (const state of ["overview", "pager"] as const) {
        if (state === "pager") await carousel.getByRole("button", { name: "Next card" }).scrollIntoViewIfNeeded();
        const path = testInfo.outputPath(`${style}-${theme}-${state}.png`);
        await page.screenshot({ path });
        await testInfo.attach(`${style}-${theme}-${state}`, { path, contentType: "image/png" });
      }
    });
  }
}
