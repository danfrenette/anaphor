import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";
import { selectControl } from "./playground-select";

async function expectTriggerOrigin(popup: Locator, trigger: Locator) {
  await expect(popup).toHaveCSS("transform", "none");
  await expect.poll(async () => {
    const anchor = await trigger.boundingBox();
    const panel = await popup.boundingBox();
    if (!anchor || !panel) return false;
    const { side, x, y } = await popup.evaluate(element => {
      const [x = NaN, y = NaN] = getComputedStyle(element).transformOrigin.split(" ").map(Number.parseFloat);
      return { side: element.getAttribute("data-side"), x, y };
    });
    const originX = panel.x + x;
    const originY = panel.y + y;
    if (side === "top" || side === "bottom") {
      const anchorEdge = side === "top" ? anchor.y : anchor.y + anchor.height;
      return Math.abs(originY - anchorEdge) < 2
        && originX >= anchor.x - 2 && originX <= anchor.x + anchor.width + 2;
    }
    const anchorEdge = side === "left" ? anchor.x : anchor.x + anchor.width;
    return Math.abs(originX - anchorEdge) < 2
      && originY >= anchor.y - 2 && originY <= anchor.y + anchor.height + 2;
  }).toBe(true);
}

test("popover supports fields, nested menus, and focus restoration", async ({ page }) => {
  await page.goto("/#popover");
  const trigger = page.getByRole("button", { name: "Workspace settings", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const popup = page.getByRole("dialog", { name: "Workspace settings" });
  await expect(popup).toBeVisible();
  await expect(popup).toHaveCSS("transition-duration", "0.18s, 0.18s");
  await expect(page.getByRole("textbox", { name: "Workspace name" })).toBeFocused();
  await page.getByRole("textbox", { name: "Workspace name" }).fill("Research");
  await selectControl(page, "Density", "Compact");
  await expect(popup).toBeVisible();
  await page.getByRole("checkbox", { name: "Show details" }).uncheck();
  await page.getByRole("button", { name: "Density", exact: true }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(popup).toBeVisible();
  await expect(page.getByRole("button", { name: "Density", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByText("Research · compact · details hidden", { exact: true })).toBeVisible();
  await trigger.click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("popover uses restrained pointer motion and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#popover");
  const trigger = page.getByRole("button", { name: "Workspace settings", exact: true });
  await trigger.click();
  const popup = page.locator('[data-slot="popover-popup"]');
  await expect(popup).toHaveCSS("transition-duration", "0.18s, 0.18s");
  await expect(popup).toHaveCSS("transition-property", "opacity, transform");
  await expectTriggerOrigin(popup, trigger);
  const accessibility = await new AxeBuilder({ page }).include('[data-slot="popover-popup"]').withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await expect(popup).toHaveCSS("transition-duration", "0s");
  await expect(popup).toHaveCSS("transform", "none");
  await page.mouse.click(4, 4);
  await expect(popup).toBeHidden();
});

test("popover stays within narrow viewports and scrolls tall content", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/#popover");
  await page.getByRole("button", { name: "Workspace settings", exact: true }).click();
  const popup = page.locator('[data-slot="popover-popup"]');
  await expect(popup).toBeVisible();
  await expect.poll(async () => {
    const box = await popup.boundingBox();
    return Boolean(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 320 && box.y + box.height <= 481);
  }).toBe(true);
  const body = page.locator('[data-slot="popover-body"]');
  await expect(body).toHaveCSS("overflow-y", "auto");
  await expect.poll(() => body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(popup).toBeHidden();
});

test("pointer closing is faster than opening", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#popover");
  await page.getByRole("button", { name: "Workspace settings", exact: true }).click();
  const popup = page.locator('[data-slot="popover-popup"]');
  await expect(popup).toHaveCSS("opacity", "1");
  await expect(popup).toHaveCSS("transition-duration", "0.18s, 0.18s");
  await popup.evaluate(element => {
    element.addEventListener("transitionrun", event => {
      if (event.target === element && element.hasAttribute("data-ending-style")) {
        document.documentElement.dataset.popoverExitDuration = getComputedStyle(element).transitionDuration;
      }
    });
    element.addEventListener("transitionend", event => {
      if (event instanceof TransitionEvent && event.target === element && event.propertyName === "opacity") {
        document.documentElement.dataset.popoverExitElapsed = String(event.elapsedTime);
      }
    });
  });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-popover-exit-duration", "0.125s");
  await expect(page.locator("html")).toHaveAttribute("data-popover-exit-elapsed", "0.125");
});

for (const key of ["Enter", "Space", "Escape"]) {
  test(`keyboard ${key} uses the same exit motion and restores focus`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/#popover");
    const trigger = page.getByRole("button", { name: "Workspace settings", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const popup = page.getByRole("dialog", { name: "Workspace settings" });
    await expect(popup).toHaveCSS("transition-duration", "0.18s, 0.18s");
    await expect(popup).toHaveCSS("opacity", "1");
    await popup.evaluate(element => {
      element.addEventListener("transitionrun", event => {
        if (event.target === element && element.hasAttribute("data-ending-style")) {
          document.documentElement.dataset.keyboardExitDuration = getComputedStyle(element).transitionDuration;
        }
      });
    });
    if (key !== "Escape") await page.getByRole("button", { name: "Done", exact: true }).focus();
    await page.keyboard.press(key);
    await expect(page.locator("html")).toHaveAttribute("data-keyboard-exit-duration", "0.125s");
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("popover placement is configurable and resettable", async ({ page }) => {
  await page.goto("/#popover");
  await page.getByRole("tab", { name: "Open Popover controls", exact: true }).click();
  await selectControl(page, "Side", "top");
  await selectControl(page, "Alignment", "start");
  await expect(page.getByRole("button", { name: "Alignment", exact: true })).toHaveAccessibleDescription("start");
  await page.getByRole("tab", { name: "Open Popover controls", exact: true }).click();
  await page.getByRole("button", { name: "Workspace settings", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Workspace settings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Open Popover controls", exact: true }).click();
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.getByRole("button", { name: "Alignment", exact: true })).toHaveAccessibleDescription("center");
  await expect(page.getByRole("button", { name: "Side", exact: true })).toHaveAccessibleDescription("bottom");
  await page.getByRole("tab", { name: "Open Popover controls", exact: true }).click();
  await page.getByRole("button", { name: "Workspace settings", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Workspace settings" })).toBeVisible();
});

test("catalog examples stay independent and inline code follows placement", async ({ page }) => {
  await page.goto("/#popover");
  const section = page.locator("#popover");
  for (const name of ["Anatomy", "Interactive content", "Playground"]) await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  const about = section.getByRole("button", { name: "About this workspace", exact: true });
  await about.click();
  await expect(page.getByRole("dialog", { name: "Workspace details", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(about).toBeFocused();
  await section.getByRole("button", { name: "Edit preferences", exact: true }).click();
  await page.getByRole("textbox", { name: "Workspace name", exact: true }).fill("Reading room");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const preview = section.getByRole("group", { name: "Workspace settings preview", exact: true });
  await expect(preview).toContainText("My workspace");
  await preview.getByRole("button", { name: "Workspace settings", exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole("tab", { name: "Open Popover controls", exact: true }).click();
  await selectControl(page, "Side", "top");
  await selectControl(page, "Alignment", "end");
  await page.getByRole("button", { name: "Close controls", exact: true }).click();
  await section.getByRole("button", { name: "Show playground code", exact: true }).press("Enter");
  await expect(section.getByLabel("Playground code", { exact: true })).toContainText('side="top" align="end"');
  await page.getByRole("tab", { name: "Open Popover controls", exact: true }).click();
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  await expect(section.getByRole("group", { name: "Edit preferences preview", exact: true })).toContainText("Reading room");
  expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});


test("scale origin follows placement and can be compared with center then reset", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#popover");
  const controls = page.getByRole("tab", { name: "Open Popover controls", exact: true });
  const trigger = page.getByRole("button", { name: "Workspace settings", exact: true });
  const popup = page.locator('[data-slot="popover-popup"]');
  for (const side of ["top", "right", "bottom", "left"]) {
    await controls.click();
    await selectControl(page, "Side", side);
    await selectControl(page, "Alignment", "start");
    await controls.click();
    await trigger.click();
    await expectTriggerOrigin(popup, trigger);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  }
  await controls.click();
  await selectControl(page, "Scale origin", "Center");
  await controls.click();
  await trigger.click();
  await expect(popup).toHaveCSS("transform", "none");
  expect(await popup.evaluate(element => {
    const [x = NaN, y = NaN] = getComputedStyle(element).transformOrigin.split(" ").map(Number.parseFloat);
    const rect = element.getBoundingClientRect();
    return Math.abs(x - rect.width / 2) < 1 && Math.abs(y - rect.height / 2) < 1;
  })).toBe(true);
  await page.keyboard.press("Escape");
  await page.locator("#popover").getByRole("button", { name: "Show playground code", exact: true }).click();
  await expect(page.locator("#popover").getByLabel("Playground code", { exact: true })).toContainText('className="origin-center"');
  await controls.click();
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  await expect(page.getByRole("button", { name: "Scale origin", exact: true })).toHaveAccessibleDescription("Trigger");
  await controls.click();
  await expect(page.locator("#popover").getByLabel("Playground code", { exact: true })).not.toContainText('origin-center');
});
