import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("renders an accessible reference manual without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Design language" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Manual index" })).toBeVisible();

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .exclude(
      '[data-tone="accent"][data-variant="solid"], [data-tone="accent"][data-variant="solid"] *',
    )
    .analyze();

  expect(accessibility.violations).toEqual([]);
  expect(
    await page.locator("html").evaluate((element) => {
      return element.scrollWidth <= element.clientWidth;
    }),
  ).toBe(true);
});

test("skip link moves keyboard focus to the main content", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("main")).toBeFocused();
});

test("button demo exposes bounded experiments and resets to approved defaults", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 2, name: "Button" }),
  ).toBeVisible();
  const demo = page.getByTestId("primary-button");
  await expect(demo).toHaveAttribute("data-variant", "solid");
  await expect(demo).toHaveAttribute("data-size", "md");

  await page.getByLabel("Variant").selectOption("ghost");
  await page.getByLabel("Loading").check();
  await expect(demo).toHaveAttribute("data-variant", "ghost");
  await expect(demo).toHaveAttribute("aria-busy", "true");

  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(demo).toHaveAttribute("data-variant", "solid");
  await expect(demo).not.toHaveAttribute("aria-busy");

  await page.getByRole("button", { name: "Hide controls" }).click();
  await expect(page.getByLabel("Variant")).toBeHidden();
  await page.getByRole("button", { name: "Show controls" }).click();
  await expect(page.getByLabel("Variant")).toBeVisible();
});

test("button motion and touch sizing follow the active device preferences", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const metrics = await page.getByTestId("primary-button").evaluate((button) => {
    const styles = getComputedStyle(button);
    return {
      height: button.getBoundingClientRect().height,
      transitionDuration: styles.transitionDuration,
    };
  });

  expect(metrics.transitionDuration).toBe("0s");
  expect(metrics.height).toBe(testInfo.project.name === "mobile-webkit" ? 44 : 40);
});

test("button color roles meet AA outside the documented solid accent exception", async ({
  page,
}) => {
  await page.goto("/");
  const demo = page.getByTestId("primary-button");
  const field = demo.locator("..");

  for (const theme of ["light", "dark"] as const) {
    await field.evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");

    for (const tone of ["accent", "neutral"] as const) {
      await page.getByLabel("Tone").selectOption(tone);

      for (const variant of ["solid", "soft", "outline", "ghost"] as const) {
        await page.getByLabel("Variant").selectOption(variant);
        await page.waitForTimeout(150);
        const contrast = await new AxeBuilder({ page })
          .include('[data-testid="primary-button"]')
          .withRules(["color-contrast"])
          .analyze();

        if (tone === "accent" && variant === "solid") {
          expect(contrast.violations.map(({ id }) => id)).toEqual(["color-contrast"]);
        } else {
          expect(contrast.violations).toEqual([]);
        }
      }
    }
  }
});

test("disabled and loading buttons share a neutral treatment", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const demo = page.getByTestId("primary-button");
  const field = demo.locator("..");
  const colors = () =>
    demo.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        foreground: style.color,
      };
    });

  for (const theme of ["light", "dark"] as const) {
    await field.evaluate(
      (element, dark) => element.classList.toggle("dark", dark),
      theme === "dark",
    );
    await page.getByLabel("Disabled").check();
    const disabledColors = await colors();

    await page.getByLabel("Disabled").uncheck();
    await page.getByLabel("Loading").check();
    expect(await colors()).toEqual(disabledColors);
    const loadingSpacing = await demo.evaluate((element) => {
      const button = element.getBoundingClientRect();
      const loader = element
        .querySelector('[data-slot="button-loader"]')!
        .getBoundingClientRect();
      const content = element
        .querySelector('[data-slot="button-content"]')!
        .getBoundingClientRect();

      return {
        gap: content.left - loader.right,
        leftInset: loader.left - button.left,
        rightInset: button.right - content.right,
      };
    });
    expect(loadingSpacing.gap).toBe(8);
    expect(
      Math.abs(loadingSpacing.leftInset - loadingSpacing.rightInset),
    ).toBeLessThan(1);

    await page.getByLabel("Tone").selectOption("neutral");
    await page.getByLabel("Variant").selectOption("ghost");
    expect(await colors()).toEqual(disabledColors);

    await page.getByLabel("Loading").uncheck();
    await page.getByLabel("Disabled").check();
    expect(await colors()).toEqual(disabledColors);
    await page.getByLabel("Disabled").uncheck();
  }
});

test("button icons center geometrically while labels use their optical offset", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const demo = page.getByTestId("primary-button");

  for (const size of ["xs", "sm", "md", "lg"] as const) {
    await page.getByLabel("Size").selectOption(size);
    const centers = await demo.evaluate((element) => {
      const center = (target: Element) => {
        const bounds = target.getBoundingClientRect();
        return bounds.top + bounds.height / 2;
      };

      return {
        button: center(element),
        content: center(element.querySelector('[data-slot="button-content"]')!),
        icon: center(element.querySelector("svg")!),
        label: center(element.querySelector('[data-slot="button-label"]')!),
      };
    });

    expect(Math.abs(centers.content - centers.button)).toBeLessThan(0.5);
    expect(Math.abs(centers.icon - centers.button)).toBeLessThan(0.5);
    expect(centers.label).toBeCloseTo(centers.icon - 1, 1);
  }
});
