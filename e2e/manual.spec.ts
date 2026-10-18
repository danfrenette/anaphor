import { selectControl } from "./playground-select";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { seekAnimations } from "./animation";
import { prepareContentSnapshot } from "./content-snapshot";

test("renders an accessible reference manual without horizontal overflow", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Anaphor" }),
  ).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Manual index" })).toBeVisible();
  // Audit the manual with its content exposed; sidebar.spec.ts audits the open drawer.
  if (isMobile) {
    await page.getByRole("button", { name: "Close sidebar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }

  // Field labels register during hydration; audit the interactive page.
  for (const checkbox of await page.getByRole("checkbox").all()) {
    await expect(checkbox).toHaveAccessibleName(/\S/);
  }

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
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();

  await expect(
    page.getByRole("heading", { level: 2, name: "Button", exact: true }),
  ).toBeVisible();
  const demo = page.getByTestId("primary-button");
  const variant = page.getByRole("button", { name: "Variant", exact: true });
  const size = page.getByRole("button", { name: "Size", exact: true });
  await expect(variant).toHaveText("solid");
  await expect(size).toHaveText("md");
  await selectControl(page, "Tone", "danger");
  await selectControl(page, "Size", "lg");
  await expect(demo).toHaveAccessibleName("Delete item");
  await page.getByRole("checkbox", { name: "Loading", exact: true }).check();
  await expect(demo).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(variant).toHaveText("solid");
  await expect(size).toHaveText("md");
  await expect(page.getByRole("checkbox", { name: "Loading", exact: true })).not.toBeChecked();
  await expect(demo).toHaveAccessibleName("Execute");
  await expect(demo).toBeEnabled();
  await expect(demo).not.toHaveAttribute("aria-busy");

  await page.getByRole("button", { name: "Close controls" }).click();
  const closedPanel = page.getByRole("region", { name: "Button controls", includeHidden: true });
  await expect(closedPanel.locator("..").locator("..")).toHaveAttribute("inert", "");
  await expect(closedPanel.locator("..").locator("..")).toHaveCSS("height", "0px");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  await expect(page.getByLabel("Variant", { exact: true })).toBeVisible();
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
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const field = page.getByRole("group", { name: "Primary button example" });

  for (const theme of ["light", "dark"] as const) {
    await field.evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");

    for (const tone of ["accent", "neutral", "danger"] as const) {
      await selectControl(page, "Tone", tone);

      for (const variant of ["solid", "outline", "ghost", "soft"] as const) {
        await selectControl(page, "Variant", variant);
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
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const demo = page.getByTestId("primary-button");
  const field = page.getByRole("group", { name: "Primary button example" });
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
      sample.style.backgroundColor = "var(--anaphor-input-disabled)";
      sample.style.color = "var(--anaphor-font-tertiary)";
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
    for (const variant of ["solid", "outline", "ghost", "soft"]) {
      await selectControl(page, "Variant", variant);
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
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/");
  const defaultButton = page.getByRole("group", { name: "Default button example" }).getByRole("button");
  const destructiveButton = page.getByRole("button", { name: "Delete item", exact: true });
  for (const theme of ["light", "dark"] as const) {
    if (theme === "dark") await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click();
    await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
    await expect(defaultButton).toHaveScreenshot(`button-default-${theme}.png`);
    await expect(destructiveButton).toHaveScreenshot(`button-destructive-${theme}.png`);
  }
});

test("icon-only buttons stay square and centered while loading", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  await page.getByRole("checkbox", { name: "Icon only", exact: true }).check();
  const button = page.getByTestId("primary-button");
  const desktopSizes = { xs: 28, sm: 32, md: 40, lg: 48 };
  for (const size of ["xs", "sm", "md", "lg"] as const) {
    await selectControl(page, "Size", size);
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
      if (!icon || !bounds) throw new Error("Button and indicator must have visible bounds");
      expect(icon.x + icon.width / 2).toBeCloseTo(bounds.x + expected / 2, 1);
      expect(icon.y + icon.height / 2).toBeCloseTo(bounds.y + expected / 2, 1);
    }
  }
});

test("cards compose readable surfaces in both themes", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#card");
  await expect(page.getByRole("heading", { name: "Card", exact: true, level: 2 })).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Card", exact: true })).toHaveAttribute("href", "/#card");
  if (isMobile) await page.getByRole("button", { name: "Close sidebar", exact: true }).click();
  const card = page.locator('[aria-labelledby="card-project-title"]');
  for (const theme of ["light", "dark"] as const) {
    await page.locator("html").evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");
    const result = await new AxeBuilder({ page }).include("#card").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    expect(result.violations).toEqual([]);
    await expect(card).toHaveScreenshot(`card-${theme}.png`);
  }
});

test("controls preserve edits across switches and return keyboard focus", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("tab", { name: /Open .* controls/ })).toHaveCount(0);
  const visit = async (name: string) => {
    if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
    await page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name, exact: true }).click();
    const trigger = page.getByRole("tab", { name: `Open ${name} controls` });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const panel = page.getByRole("region", { name: `${name} controls` });
    await expect(trigger).toBeFocused();
    return panel;
  };
  await visit("Button");
  await selectControl(page, "Tone", "danger");
  await page.getByRole("button", { name: "Close controls" }).click();
  await visit("Card");
  await page.getByRole("checkbox", { name: "Footer", exact: true }).uncheck();
  await expect(page.locator('[aria-labelledby="card-project-title"]').getByRole("button", { name: "Open workspace" })).toHaveCount(0);
  await page.getByRole("button", { name: "Close controls" }).click();
  await visit("Button");
  await expect(page.getByLabel("Tone", { exact: true })).toHaveText("danger");
  await page.getByLabel("Tone", { exact: true }).focus();
  await page.keyboard.press("Escape");
  const trigger = page.getByRole("tab", { name: "Open Button controls" });
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const cardPanel = await visit("Card");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.locator('[aria-labelledby="card-project-title"]').getByRole("button", { name: "Open workspace" })).toBeVisible();
  const bounds = await cardPanel.boundingBox();
  if (!bounds) throw new Error("The controls panel must have visible bounds");
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  const accessibility = await new AxeBuilder({ page }).include('[data-slot="morph-surface"]').withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
});


test("loading smoothly adds and removes spinner space without clipping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#button");
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const button = page.getByTestId("primary-button");
  const loading = page.getByRole("checkbox", { name: "Loading", exact: true });
  const restingWidth = await button.evaluate((element) => element.getBoundingClientRect().width);
  // Give CSS transitions time to be captured, then seek their real interpolation.
  await page.addStyleTag({ content: '[data-testid="primary-button"] * { transition-duration: 10s !important; }' });
  const sampleWidths = async () => {
    const widths: number[] = [];
    for (const progress of [0.1, 0.3, 0.6, 1]) {
      await seekAnimations(button, progress);
      widths.push(await button.evaluate(element => {
        const loader = element.querySelector('[data-slot="button-loader"]');
        const wrapper = loader?.parentElement;
        if (!loader || !wrapper) throw new Error("The loading indicator must be mounted");
        const style = getComputedStyle(wrapper);
        if (Number(style.opacity) > 0) {
          const ring = loader.getBoundingClientRect();
          const bounds = wrapper.getBoundingClientRect();
          if (style.overflowX !== "visible" && (bounds.width < ring.width || bounds.height < ring.height)) {
            throw new Error("The visible spinner is clipped during its transition");
          }
        }
        return element.getBoundingClientRect().width;
      }));
    }
    return widths;
  };
  await loading.check();
  const opened = await sampleWidths();
  const expandedWidth = opened.at(-1);
  if (expandedWidth === undefined) throw new Error("Expected animation samples");
  expect(expandedWidth).toBeGreaterThan(restingWidth + 1);
  expect(opened.some((width) => width > restingWidth + 0.5 && width < expandedWidth - 0.5)).toBe(true);
  await loading.uncheck();
  const closed = await sampleWidths();
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
  await page.getByRole("tab", { name: "Open Button controls" }).click();
  const button = page.getByTestId("primary-button");
  const field = page.getByRole("group", { name: "Primary button example" });
  for (const dark of [false, true]) {
    await field.evaluate((element, value) => element.classList.toggle("dark", value), dark);
    for (const tone of ["accent", "neutral"]) {
      await selectControl(page, "Tone", tone);
      for (const variant of ["outline", "ghost"]) {
        await selectControl(page, "Variant", variant);
        await page.getByRole("button", { name: "Close controls" }).click();
        await button.hover();
        const hoverColor = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
        await page.mouse.down();
        const pressedColor = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
        await page.mouse.up();
        expect(pressedColor).not.toEqual(hoverColor);
        await page.locator("#button").evaluate(element => element.scrollIntoView({ block: "start" }));
        await page.getByRole("tab", { name: "Open Button controls" }).click();
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

test("card copy confirms a write", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (value: string) => { document.documentElement.dataset.copiedText = value; },
    } });
  });
  await page.goto("/#card");
  const copy = page.getByRole("button", { name: "Copy development command" });
  const status = page.getByRole("group", { name: "Local development", exact: true }).getByRole("status");
  await copy.click();
  await expect(status).toHaveText("Copied to clipboard.");
  await expect(page.locator("html")).toHaveAttribute("data-copied-text", "pnpm dev");
  await expect(status).toBeEmpty();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(status).toHaveText("Copied to clipboard.");
});

test("reference card links to its documentation", async ({ page }) => {
  await page.goto("/#card");
  await page.getByRole("link", { name: "Read the reference", exact: true }).click();
  await expect(page).toHaveURL(/\/foundations#layout-reference$/);
  await expect(page.getByRole("heading", { name: "Layout", exact: true })).toBeVisible();
});

test("showcase previews reflow in both themes", async ({ page }) => {
  await page.goto("/#card");
  const snapshotStyle = await prepareContentSnapshot(page);
  const showcase = page.locator('#card [data-variant="showcase"]').first();
  await showcase.scrollIntoViewIfNeeded();
  for (const theme of ["light", "dark"] as const) {
    await page.locator("html").evaluate((element, dark) => element.classList.toggle("dark", dark), theme === "dark");
    await expect(showcase).toHaveScreenshot(`card-showcase-${theme}.png`);
  }
  await snapshotStyle.evaluate(element => element.parentNode?.removeChild(element));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
