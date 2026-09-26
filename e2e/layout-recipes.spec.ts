import { expect, test } from "@playwright/test";

test("Foundations exposes package layout tokens and utilities", async ({ page }) => {
  await page.goto("/foundations#layout-reference");
  const layout = page.getByRole("region", { name: "Layout", exact: true });
  for (const token of ["--container-workspace", "--container-editorial", "--container-reading", "--spacing-page-inset"]) {
    await expect(layout).toContainText(token);
  }
  const sample = page.getByTestId("layout-editorial-sample");
  await expect(sample).toHaveCSS("max-width", "1120px");
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(sample).toHaveCSS("padding-inline-start", "24px");
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(sample).toHaveCSS("padding-inline-start", "48px");
  await page.evaluate(() => document.documentElement.style.setProperty("--container-editorial", "60rem"));
  await expect(sample).toHaveCSS("max-width", "960px");
});

for (const width of [320, 700, 1024, 1280, 1920]) {
  test(`layout recipes preserve bounds and reading order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/studies/signal");
    await page.evaluate(() => document.fonts.ready);
    const workspace = await page.locator(".signal-study").evaluate(element => {
      const style = getComputedStyle(element);
      return {
        width: element.getBoundingClientRect().width,
        content: element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      };
    });
    expect(workspace.width).toBeLessThanOrEqual(1536);
    const chart = await page.locator(".traffic-panel").boundingBox();
    const field = await page.locator(".field-panel").boundingBox();
    expect(chart).not.toBeNull();
    expect(field).not.toBeNull();
    if (workspace.content < 896) expect(field!.y).toBeGreaterThan(chart!.y);
    else {
      expect(field!.y).toBeCloseTo(chart!.y, 0);
      expect(chart!.width).toBeGreaterThan(field!.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByLabel("Search workloads").fill("missing");
    await expect(page.getByRole("status").filter({ hasText: "No workloads match" })).toBeVisible();

    await page.goto("/studies/field-notes");
    await page.evaluate(() => document.fonts.ready);
    const paragraph = await page.locator(".notes-body > p").first().boundingBox();
    const figure = await page.locator(".attention-figure").boundingBox();
    expect(paragraph).not.toBeNull();
    expect(figure).not.toBeNull();
    expect(figure!.width).toBeGreaterThanOrEqual(paragraph!.width - 1);
    if (width >= 1280) expect(figure!.width).toBeGreaterThan(paragraph!.width + 32);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("recipes are discoverable and stay readable in a mirrored layout", async ({ page }) => {
  await page.goto("/foundations#layout-reference");
  await expect(page.getByRole("heading", { name: "Layout", exact: true })).toBeVisible();
  await page.goto("/studies/signal");
  await page.evaluate(() => { document.documentElement.dir = "rtl"; });
  await page.getByRole("button", { name: /image-pipeline/ }).click();
  await expect(page.getByText(/Elevated latency in sfo-1/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
