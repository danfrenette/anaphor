import { expect, test } from "@playwright/test";

test("Foundations exposes package layout tokens and utilities", async ({ page }) => {
  await page.goto("/foundations#layout-reference");
  const layout = page.getByRole("region", { name: "Layout", exact: true });
  for (const token of ["--container-workspace", "--container-editorial", "--container-reading", "--spacing-page-inset"]) {
    await expect(layout).toContainText(token);
  }
  const sample = page.getByTestId("layout-editorial-sample");
  await expect(sample).toHaveCSS("max-width", "1120px");
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(() => document.fonts.ready);
    const paragraphs = await sample.locator("p").evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { left: rect.left, width: rect.width, fontSize: style.fontSize, color: style.color, lineHeight: style.lineHeight };
    }));
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[1]).toEqual(paragraphs[0]);
    for (const text of [/^Link the source-owned package/, /^Keep ordinary gaps and padding/]) {
      const paragraph = layout.getByText(text);
      await expect(paragraph).toHaveCSS("font-size", "16px");
      await expect(paragraph).toHaveCSS("line-height", "25.6px");
      expect(await paragraph.evaluate(element => getComputedStyle(element).maxWidth)).not.toBe("none");
    }
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(sample).toHaveCSS("padding-inline-start", "24px");
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(sample).toHaveCSS("padding-inline-start", "48px");
  await page.evaluate(() => document.documentElement.style.setProperty("--container-editorial", "60rem"));
  await expect(sample).toHaveCSS("max-width", "960px");
});

for (const width of [320, 700, 1024, 1280, 1920]) {
  test(`layout reference preserves bounds at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/foundations#layout-reference");
    await page.evaluate(() => document.fonts.ready);
    const sample = page.getByTestId("layout-editorial-sample");
    await expect(sample).toHaveCSS("max-width", "1120px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("layout reference stays readable in a mirrored layout", async ({ page }) => {
  await page.goto("/foundations#layout-reference");
  await page.evaluate(() => { document.documentElement.dir = "rtl"; });
  await expect(page.getByRole("heading", { name: "Layout", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
