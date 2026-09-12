import { expect, test } from "@playwright/test";

test("headings load Bell Gothic and article text keeps a single 90% alpha", async ({ page }) => {
  await page.goto("/#typography");
  await page.evaluate(() => document.fonts.ready);
  const heading = page.getByRole("heading", { name: "Type with a purpose" });
  await expect(heading).toHaveCSS("font-family", /Bell Gothic Black/);
  await expect(heading).toHaveCSS("font-weight", "900");
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family.replaceAll('"', '') === "Bell Gothic Black" && font.status === "loaded"))).toBe(true);

  for (const theme of ["light", "dark"]) {
    const prose = page.locator(`[data-slot="prose"][aria-label="${theme} article example"]`);
    const result = await prose.evaluate(element => {
      const root = getComputedStyle(element);
      return {
        color: root.color, opacity: root.opacity, lineHeight: root.lineHeight,
        children: [...element.querySelectorAll("p, strong, em, h3, a, code, li, blockquote")].map(child => ({ color: getComputedStyle(child).color, opacity: getComputedStyle(child).opacity })),
      };
    });
    expect(result.color).toMatch(/\/ 0\.9\)/);
    expect(Number(result.color.match(/oklch\(([\d.]+)/)?.[1])).toBeCloseTo(theme === "dark" ? 0.9 : 0.2, 3);
    expect(result.opacity).toBe("1");
    expect(result.lineHeight).toBe("25.6px");
    for (const child of result.children) {
      expect(child.color).toBe(result.color);
      expect(child.opacity).toBe("1");
    }
    await expect(prose.locator("code")).toHaveCSS("font-family", /Magda Clean Mono/);
    await expect(prose.locator("ul")).toHaveCSS("list-style-type", "disc");
    await expect(prose.locator("em")).toHaveCSS("font-style", "italic");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator("#typography").screenshot({ path: `/tmp/anaphor-typography-${test.info().project.name}.png` });
});

test("purpose variants own wrapping and reading measure without caller styling", async ({ page }) => {
  await page.goto("/#button");
  await page.evaluate(() => document.fonts.ready);
  const description = page.locator('#button [data-slot="text"][data-variant="description"]').first();
  await expect(description).toHaveCSS("text-wrap-style", "pretty");
  await expect(page.getByRole("heading", { name: "Button", exact: true })).toHaveCSS("text-wrap-style", "balance");
  const body = page.locator('#typography [data-slot="text"][data-variant="body"]').first();
  await expect(body).toHaveCSS("text-wrap-style", "auto");
  const readingText = page.locator('[data-slot="text"][data-variant="body"], [data-slot="text"][data-variant="description"], [data-slot="prose"]');
  for (const measure of ["65ch", "40ch"]) {
    if (measure === "40ch") {
      await page.evaluate(() => document.documentElement.style.setProperty("--container-reading", "40ch"));
    }
    const widths = await readingText.evaluateAll((elements, measure) => elements.map(element => {
      const reference = document.createElement("span");
      reference.style.cssText = `position: absolute; visibility: hidden; width: ${measure}; font: inherit;`;
      element.append(reference);
      const expected = reference.getBoundingClientRect().width;
      reference.remove();
      return { text: element.textContent, actual: getComputedStyle(element).maxWidth, expected };
    }), measure);
    expect(widths.length).toBeGreaterThan(3);
    for (const width of widths) {
      expect(width.actual, width.text ?? "Reading text").not.toBe("none");
      expect(parseFloat(width.actual), width.text ?? "Reading text").toBeCloseTo(width.expected, 1);
    }
  }
  await page.evaluate(() => document.documentElement.style.removeProperty("--container-reading"));
  await expect(page.locator('[data-slot="field-description"]:visible').first()).toHaveCSS("text-wrap-style", "pretty");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test("semantic overrides retain purpose styling and prose respects exclusions", async ({ page }) => {
  await page.goto("/#typography");
  await page.evaluate(() => document.fonts.ready);
  // Reuse the real rendered variant classes on a heading to exercise the CSS cascade.
  for (const variant of ["ui", "caption"]) {
    const source = page.locator(`[data-slot="text"][data-variant="${variant}"]`).first();
    await source.evaluate(element => {
      const heading = document.createElement("h2");
      heading.className = element.className;
      heading.dataset.testTypography = "semantic-override";
      heading.textContent = "Semantic heading with regular typography";
      element.after(heading);
    });
    const heading = page.locator('[data-test-typography="semantic-override"]');
    await expect(heading).toHaveCSS("font-weight", "400");
    await expect(heading).toHaveCSS("text-wrap-style", "auto");
    await heading.evaluate(element => element.remove());
  }
  const label = page.locator('[data-slot="card-title"][data-variant="label"]').first();
  await expect(label).toHaveCSS("font-family", /Inter/);
  await expect(label).toHaveCSS("font-weight", "500");
  await expect(label).toHaveCSS("text-transform", "uppercase");

  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = "@layer components { .excluded-component { margin-block: 24px; } }";
    document.head.append(style);
    const prose = document.createElement("article");
    prose.className = "anaphor-prose";
    prose.dataset.testTypography = "prose";
    prose.innerHTML = '<div data-prose-exclude class="excluded-component">First component</div><h1>Article title</h1><div data-prose-exclude class="excluded-component">Last component</div>';
    document.body.append(prose);
  });
  const prose = page.locator('[data-test-typography="prose"]');
  expect(await prose.locator("h1").evaluate(element => parseFloat(getComputedStyle(element).lineHeight))).toBeCloseTo(39.6, 3);
  await expect(prose.locator("[data-prose-exclude]").first()).toHaveCSS("margin-block-start", "24px");
  await expect(prose.locator("[data-prose-exclude]").last()).toHaveCSS("margin-block-end", "24px");
});

test("Text and Prose respond to shared typography tokens", async ({ page }) => {
  await page.goto("/#typography");
  await page.evaluate(() => {
    const tokens = document.documentElement.style;
    tokens.setProperty("--tracking-heading", "0.04em");
    tokens.setProperty("--tracking-label", "0.12em");
    tokens.setProperty("--leading-reading", "2");
    tokens.setProperty("--spacing-prose", "2em");
    tokens.setProperty("--radius-sm", "12px");
    tokens.setProperty("--text-xl", "22px");
    const article = document.createElement("article");
    article.className = "anaphor-prose";
    article.dataset.testTypography = "tokens";
    article.innerHTML = '<h2>Token heading</h2><h3>Token subheading</h3><p>First paragraph</p><p>Second paragraph</p><pre><code>Example</code></pre>';
    document.body.append(article);
  });
  const heading = page.locator('[data-slot="text"][data-variant="heading"]').first();
  await expect(heading).toHaveCSS("letter-spacing", "0.96px");
  await expect(page.locator('[data-slot="text"][data-variant="label"]').first()).toHaveCSS("letter-spacing", "1.44px");
  await expect(page.locator('[data-slot="text"][data-variant="body"]').first()).toHaveCSS("line-height", "32px");
  const prose = page.locator('[data-test-typography="tokens"]');
  await expect(prose).toHaveCSS("line-height", "32px");
  await expect(prose.locator("h2")).toHaveCSS("letter-spacing", "0.96px");
  await expect(prose.locator("h3")).toHaveCSS("font-size", "22px");
  await expect(prose.locator("p").first()).toHaveCSS("margin-top", "32px");
  await expect(prose.locator("pre")).toHaveCSS("border-radius", "12px");
});
