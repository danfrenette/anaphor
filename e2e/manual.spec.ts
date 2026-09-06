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
    .disableRules(["color-contrast"])
    .analyze();

  expect(accessibility.violations).toEqual([]);
  const contrast = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .exclude('[data-tone="accent"][data-variant="solid"]')
    .analyze();
  expect(contrast.violations).toEqual([]);
  expect(
    await page.locator("html").evaluate((element) => {
      return element.scrollWidth <= element.clientWidth;
    }),
  ).toBe(true);
});

test("skip link moves keyboard focus to the main content", async ({ page, browserName }) => {
  await page.goto("/");

  // macOS WebKit uses Option-Tab to include links in keyboard navigation.
  await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
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
  const variant = page.getByLabel("Variant");
  const size = page.getByLabel("Size");
  await expect(variant).toHaveValue("solid");
  await expect(size).toHaveValue("md");
  await variant.selectOption("destructive");
  await size.selectOption("lg");
  await expect(demo).toHaveAccessibleName("Delete item");
  await page.getByRole("checkbox", { name: "Loading", exact: true }).check();
  await expect(demo).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(variant).toHaveValue("solid");
  await expect(size).toHaveValue("md");
  await expect(page.getByRole("checkbox", { name: "Loading", exact: true })).not.toBeChecked();
  await expect(demo).toHaveAccessibleName("Execute");
  await expect(demo).toBeEnabled();
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

  const metrics = await page.getByRole("group", { name: "Default button example" }).getByRole("button").evaluate((button) => {
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
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const demo = page.getByTestId("primary-button");
  const field = demo.locator("..");

  for (const theme of ["light", "dark"] as const) {
    await field.evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");

    for (const tone of ["accent", "neutral"] as const) {
      await page.getByLabel("Tone").selectOption(tone);

      for (const variant of ["solid", "destructive", "outline", "ghost"] as const) {
        await page.getByLabel("Variant").selectOption(variant);
        // Only this documented contrast exception is permitted; improvement is welcome.
        if (tone === "accent" && variant === "solid") continue;
        const contrast = await new AxeBuilder({ page })
          .include('[data-testid="primary-button"]')
          .withRules(["color-contrast"])
          .analyze();

        expect(contrast.violations).toEqual([]);
      }
    }
  }
});

test("loading preserves action colors while explicit disabled stays neutral", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  const demo = page.getByTestId("primary-button");
  const field = page.getByTestId("primary-button").locator("..");
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
    await page.getByRole("checkbox", { name: "Disabled", exact: true }).check();
    const disabledColors = await colors();
    const expected = await demo.evaluate((element) => {
      // Resolve tokens through the browser so equivalent color syntax compares equally.
      const sample = document.createElement("span");
      sample.style.backgroundColor = "var(--dl-input-disabled)";
      sample.style.color = "var(--dl-font-tertiary)";
      element.append(sample);
      const style = getComputedStyle(sample);
      const colors = {
        background: style.backgroundColor,
        foreground: style.color,
      };
      sample.remove();
      return colors;
    });
    expect(disabledColors).toEqual(expected);

    await page.getByRole("checkbox", { name: "Disabled", exact: true }).uncheck();
    for (const variant of ["solid", "destructive", "outline", "ghost"]) {
      await page.getByLabel("Variant").selectOption(variant);
      const actionColors = await colors();
      await page.getByRole("checkbox", { name: "Loading", exact: true }).check();
      expect(await colors()).toEqual(actionColors);
      await page.getByRole("checkbox", { name: "Disabled", exact: true }).check();
      expect(await colors()).toEqual(disabledColors);
      await page.getByRole("checkbox", { name: "Loading", exact: true }).uncheck();
      expect(await colors()).toEqual(disabledColors);
      await page.getByRole("checkbox", { name: "Disabled", exact: true }).uncheck();
    }
  }
});

test("default and destructive buttons retain their approved visual appearance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const defaultButton = page.getByRole("group", { name: "Default button example" }).getByRole("button");
  const destructiveButton = page.getByRole("button", { name: "Delete item", exact: true });
  for (const theme of ["light", "dark"] as const) {
    await page.locator("html").evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");
    await expect(defaultButton).toHaveScreenshot(`button-default-${theme}.png`);
    await expect(destructiveButton).toHaveScreenshot(`button-destructive-${theme}.png`);
  }
});

test("icon-only buttons stay square and centered while loading", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByLabel("Icon only", { exact: true }).check();
  const button = page.getByTestId("primary-button");
  const desktopSizes = { xs: 28, sm: 32, md: 40, lg: 48 };
  for (const size of ["xs", "sm", "md", "lg"] as const) {
    await page.getByLabel("Size").selectOption(size);
    const expected = testInfo.project.name === "mobile-webkit"
      ? Math.max(44, desktopSizes[size]) : desktopSizes[size];
    for (const loading of [false, true]) {
      await page.getByRole("checkbox", { name: "Loading", exact: true }).setChecked(loading);
      await expect(button).toHaveAccessibleName("Execute");
      const bounds = await button.boundingBox();
      expect(bounds?.width).toBe(expected);
      expect(bounds?.height).toBe(expected);
      const indicator = loading ? button.locator('[data-slot="button-loader"]') : button.locator('[data-slot="button-content"] svg');
      const icon = await indicator.boundingBox();
      expect(icon).not.toBeNull();
      expect(icon!.x + icon!.width / 2).toBeCloseTo(bounds!.x + expected / 2, 1);
      expect(icon!.y + icon!.height / 2).toBeCloseTo(bounds!.y + expected / 2, 1);
    }
  }
});

test("cards compose readable surfaces in both themes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#card");
  await expect(page.getByRole("heading", { name: "Card", exact: true, level: 2 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Card", exact: true })).toHaveAttribute("href", "#card");
  const card = page.locator('[aria-labelledby="card-project-title"]');
  for (const theme of ["light", "dark"] as const) {
    await page.locator("html").evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");
    const result = await new AxeBuilder({ page }).include("#card").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    expect(result.violations).toEqual([]);
    await expect(card).toHaveScreenshot(`card-${theme}.png`);
  }
});

test("loading smoothly adds and removes spinner space without clipping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  const button = page.getByTestId("primary-button");
  const loading = page.getByRole("checkbox", { name: "Loading", exact: true });
  const restingWidth = await button.evaluate((element) => element.getBoundingClientRect().width);
  const sampleWidths = () => button.evaluate(async (element) => {
    const widths: number[] = [];
    const loader = element.querySelector<SVGSVGElement>('[data-slot="button-loader"]')!;
    const wrapper = loader.parentElement!;
    // Sample the transition itself, rather than sleeping and checking only its endpoint.
    for (let frame = 0; frame < 30; frame++) {
      await new Promise(requestAnimationFrame);
      widths.push(element.getBoundingClientRect().width);
      const style = getComputedStyle(wrapper);
      if (Number(style.opacity) > 0) {
        const ring = loader.getBoundingClientRect();
        const bounds = wrapper.getBoundingClientRect();
        if (style.overflowX !== "visible" && (bounds.width < ring.width || bounds.height < ring.height)) {
          throw new Error("The visible spinner is clipped during its transition");
        }
      }
    }
    return widths;
  });
  const opening = sampleWidths();
  await loading.check();
  const opened = await opening;
  const expandedWidth = opened.at(-1)!;
  expect(expandedWidth).toBeGreaterThan(restingWidth + 1);
  expect(opened.some((width) => width > restingWidth + 0.5 && width < expandedWidth - 0.5)).toBe(true);
  const closing = sampleWidths();
  await loading.uncheck();
  const closed = await closing;
  expect(closed.at(-1)).toBeCloseTo(restingWidth, 1);
  expect(closed.some((width) => width > restingWidth + 0.5 && width < expandedWidth - 0.5)).toBe(true);
});

test("loading examples run independently and return to idle", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#button");
  const loading = page.getByRole("group", { name: "Loading transition example", exact: true }).getByRole("button");
  const disabledLoading = page.getByRole("group", { name: "Disabled loading transition example", exact: true }).getByRole("button");
  await loading.click();
  await expect(loading).toHaveAttribute("aria-busy", "true");
  await expect(disabledLoading).not.toHaveAttribute("aria-busy");
  await disabledLoading.click();
  await expect(disabledLoading).toHaveAttribute("aria-busy", "true");
  await page.clock.fastForward(1500);
  await expect(loading).not.toHaveAttribute("aria-busy");
  await expect(disabledLoading).not.toHaveAttribute("aria-busy");
  await expect(loading).toBeEnabled();
  await expect(disabledLoading).toBeEnabled();
  await loading.click();
  await expect(loading).toHaveAttribute("aria-busy", "true");
});

test("outline and ghost show pressed color with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  const button = page.getByTestId("primary-button");
  const field = page.getByTestId("primary-button").locator("..");
  for (const dark of [false, true]) {
    await field.evaluate((element, value) => element.classList.toggle("dark", value), dark);
    for (const tone of ["accent", "neutral"]) {
      await page.getByLabel("Tone").selectOption(tone);
      for (const variant of ["outline", "ghost"]) {
        await page.getByLabel("Variant").selectOption(variant);
        await button.hover();
        const hoverColor = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
        await page.mouse.down();
        const pressedColor = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
        await page.mouse.up();
        expect(pressedColor).not.toEqual(hoverColor);
      }
    }
  }
});

test("composed anchor navigates by keyboard", async ({ page }) => {
  await page.goto("/#button");
  const anchor = page.getByRole("button", { name: "Explore Card" });
  await expect(anchor).toHaveAttribute("href", "#card");
  await anchor.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#card$/);
});
