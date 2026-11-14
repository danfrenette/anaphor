import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

declare global { interface Window { toastExitTarget?: Promise<number>; toastRecovery?: Promise<number | null> } }

test("async feedback updates in place and Undo restores the archived note", async ({ page }) => {
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  const section = page.locator("#toast");
  await section.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(page.getByText("Saving changes", { exact: true })).toBeVisible();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(1);
  await section.getByRole("button", { name: "Dismiss all" }).click();
  await section.getByRole("button", { name: "Archive note", exact: true }).click();
  await expect(section.getByText("Research methods is archived.")).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(section.getByText("Research methods is in the library.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveCount(0);
  await section.getByRole("button", { name: "Simulate failed save" }).click();
  await expect(page.getByText("Changes weren’t saved", { exact: true })).toBeVisible();
  await page.keyboard.press("F6");
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
});

test("stack expands for keyboard access, fits narrow screens and retains accessible theme contrast", async ({ page, isMobile }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  const trigger = page.getByRole("button", { name: "Show stacked updates" });
  await trigger.focus();
  await trigger.press("Enter");
  const viewport = page.locator('[data-slot="toast-viewport"]');
  const notifications = viewport.locator('[data-slot="toast"]');
  await expect(notifications).toHaveCount(3);
  await page.keyboard.press("F6");
  await expect(notifications.first()).toHaveAttribute("data-expanded", "");
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((el, value) => el.classList.toggle("dark", value), dark);
    const boxes = await notifications.evaluateAll(elements => elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, right: rect.right, bottom: rect.bottom, top: rect.top, fits: el.scrollWidth <= el.clientWidth };
    }));
    const size = page.viewportSize()!;
    expect(boxes.every(box => box.left >= 0 && box.right <= size.width && box.top >= 0 && box.bottom <= size.height && box.fits)).toBe(true);
    if (isMobile) {
      expect(await viewport.getByRole("button", { name: "Dismiss notification" }).first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    // Base UI 1.9 emits unnamed iOS focus sentinels; match the existing Diff audit boundary.
    expect((await new AxeBuilder({ page }).exclude("[data-base-ui-focus-guard]").include('[data-slot="toast-viewport"]').withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`toast-${dark ? "dark" : "light"}.png`) });
  }
  await viewport.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Dismiss all" }).click();
  await expect(notifications).toHaveCount(0);
});

test("all six positions align to the viewport and Reset restores top-right", async ({ page }, testInfo) => {
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  await page.getByRole("tab", { name: "Open Toast controls" }).click();
  const viewport = page.locator('[data-slot="toast-viewport"]');
  for (const position of ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]) {
    await page.getByRole("button", { name: "Position", exact: true }).click();
    await page.getByRole("menuitemradio", { name: position, exact: true }).click();
    await expect(viewport).toHaveAttribute("data-position", position);
    const rect = await viewport.evaluate(el => {
      const { left, right, top, bottom, width } = el.getBoundingClientRect();
      return { left, right, top, bottom, width, viewportWidth: innerWidth, viewportHeight: innerHeight };
    });
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(rect.viewportWidth);
    if (position.endsWith("center")) expect(Math.abs(rect.left + rect.width / 2 - rect.viewportWidth / 2)).toBeLessThan(1);
    if (position.endsWith("left")) expect(rect.left).toBe(16);
    if (position.endsWith("right")) expect(rect.viewportWidth - rect.right).toBe(16);
    if (position.startsWith("top")) expect(rect.top).toBe(24);
    else expect(rect.viewportHeight - rect.bottom).toBe(24);
  }
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  await expect(viewport).toHaveAttribute("data-position", "top-right");
  await page.getByRole("button", { name: "Position", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "bottom-center", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Show stacked updates" }).click();
  await page.keyboard.press("F6");
  await expect(viewport.locator('[data-slot="toast"]').first()).toHaveAttribute("data-expanded", "");
  await page.screenshot({ path: testInfo.outputPath("toast-bottom-center.png") });
});

test("normal-motion keyboard expansion and collapse do not animate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  await page.getByRole("button", { name: "Show stacked updates" }).click();
  const viewport = page.locator('[data-slot="toast-viewport"]');
  const notifications = viewport.locator('[data-slot="toast"]');
  await expect(notifications).toHaveCount(3);
  await page.keyboard.press("F6");
  await expect(notifications.first()).toHaveAttribute("data-expanded", "");
  expect(await notifications.evaluateAll(elements => elements.every(el => el.getAnimations({ subtree: true }).length === 0))).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await expect(notifications.first()).not.toHaveAttribute("data-expanded", "");
  expect(await notifications.evaluateAll(elements => elements.every(el => el.getAnimations({ subtree: true }).length === 0))).toBe(true);
});

test("F6 shows a visible focus indicator on a single notification", async ({ page }) => {
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  await page.getByRole("button", { name: "Archive note", exact: true }).click();
  const notification = page.locator('[data-slot="toast"]');
  await expect(notification).toHaveCount(1);
  const returnTarget = page.getByRole("button", { name: "Dismiss all", exact: true });
  await returnTarget.focus();
  await page.keyboard.press("F6");
  await expect(page.locator('[data-slot="toast-viewport"]')).toBeFocused();
  await expect(notification).toHaveCSS("outline-style", "solid");
  await expect(notification).toHaveCSS("outline-width", "2px");
  await expect(notification).toHaveCSS("outline-offset", "3px");
  await page.keyboard.press("Shift+Tab");
  await expect(returnTarget).toBeFocused();
  await expect(notification).toHaveCSS("outline-style", "none");
});

test("keyboard-created loading feedback has no animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  const save = page.getByRole("button", { name: "Save note", exact: true });
  await save.focus();
  await save.press("Enter");
  await expect(page.getByText("Saving changes", { exact: true })).toBeVisible();
  expect(await page.locator('[data-slot="toast"]').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
});

test("reduced motion disables fades, recovery and loading animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  const notification = page.locator('[data-slot="toast"]');
  await expect(page.getByText("Saving changes", { exact: true })).toBeVisible();
  expect(await notification.evaluate(el => getComputedStyle(el).transitionProperty)).toBe("none");
  expect(await notification.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  expect(await notification.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
});

test("keyboard callers outside the viewport create and close feedback immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  const trigger = page.getByRole("button", { name: "Show stacked updates" });
  await trigger.focus();
  await trigger.press("Enter");
  const notifications = page.locator('[data-slot="toast"]');
  await expect(notifications).toHaveCount(3);
  expect(await notifications.evaluateAll(elements => elements.every(el => getComputedStyle(el).transitionProperty === "none" && el.getAnimations({ subtree: true }).length === 0))).toBe(true);
  const dismiss = page.getByRole("button", { name: "Dismiss all", exact: true });
  await dismiss.focus();
  await dismiss.press("Enter");
  await expect(notifications).toHaveCount(0);
});


test("a long swipe exits beyond the release point instead of reversing", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse trajectory regression; physical touch remains a manual check.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  await page.getByRole("button", { name: "Archive note", exact: true }).click();
  const notification = page.locator('[data-slot="toast"]');
  await expect(notification).toBeVisible();
  await notification.hover();
  const rect = (await notification.boundingBox())!;
  const x = rect.x + 40;
  const y = rect.y + 24;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 1, y);
  await page.mouse.move(x + 450, y, { steps: 12 });
  const releasedX = await notification.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(releasedX).toBeGreaterThan(400);
  // Observe the ending commit; an offscreen swipe need not paint a transition frame.
  await notification.evaluate(el => {
    window.toastExitTarget = new Promise<number>(resolve => {
      const observer = new MutationObserver(() => {
        if (!el.hasAttribute("data-ending-style")) return;
        const transition = el.getAnimations().find(animation => animation instanceof CSSTransition && animation.transitionProperty === "transform");
        observer.disconnect();
        const endTime = transition?.effect?.getComputedTiming().endTime;
        if (!transition || typeof endTime !== "number") { resolve(NaN); return; }
        // Seek the real transition: keyframes may retain percentages that DOMMatrix cannot resolve.
        transition.pause();
        transition.currentTime = endTime;
        const target = new DOMMatrix(getComputedStyle(el).transform).m41;
        transition.play();
        resolve(target);
      });
      observer.observe(el, { attributes: true });
    });
  });
  await page.mouse.up();
  expect(await page.evaluate(() => window.toastExitTarget)).toBeGreaterThan(releasedX + rect.width);
  await expect(notification).toHaveCount(0);
});

// Chromium protocol events exercise browser pointer capture and multi-touch routing.
// They emulate touch; physical-device acceptance remains separate.
test.describe("emulated coarse touch", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("short outward flicks dismiss, paused or inward swipes recover, and only the first finger owns the drag", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Chromium touch protocol coverage.");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/#toast");
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
    await page.getByRole("button", { name: "Archive note", exact: true }).click();
    const notification = page.locator('[data-slot="toast"]');
    await notification.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    const rect = (await notification.boundingBox())!;
    const x = rect.x + 60;
    const y = rect.y + 24;
    expect(await page.evaluate(() => matchMedia("(hover: none) and (pointer: coarse)").matches)).toBe(true);
    const session = await page.context().newCDPSession(page);
    let timestamp = Date.now() / 1000;
    const touch = (type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel", points: [number, number, number][]) => session.send("Input.dispatchTouchEvent", {
      type,
      timestamp: timestamp += 0.01,
      touchPoints: points.map(([id, px, py]) => ({ id, x: px, y: py })),
    });
    await touch("touchStart", [[1, x, y]]);
    await touch("touchMove", [[1, x + 1, y]]);
    await touch("touchMove", [[1, x + 20, y]]);
    await touch("touchStart", [[1, x + 20, y], [2, x + 30, y + 15]]);
    await touch("touchMove", [[1, x + 35, y], [2, x + 30, y + 15]]);
    expect(await notification.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)).toBeGreaterThan(30);
    await touch("touchEnd", [[2, x + 30, y + 15]]);
    await expect(notification).toHaveAttribute("data-swiping", "");
    await touch("touchCancel", []);
    await notification.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    // Holding still makes the old outward motion ineligible for flick dismissal.
    await touch("touchStart", [[1, x, y]]);
    await touch("touchMove", [[1, x + 1, y]]);
    await touch("touchMove", [[1, x + 30, y]]);
    timestamp += 0.2;
    await touch("touchEnd", []);
    await notification.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    await expect(notification).toBeVisible();
    // An inward release cancels rather than treating total outward distance as velocity.
    await touch("touchStart", [[1, x, y]]);
    await touch("touchMove", [[1, x + 1, y]]);
    await touch("touchMove", [[1, x + 35, y]]);
    await touch("touchMove", [[1, x + 20, y]]);
    await touch("touchEnd", []);
    await notification.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    await expect(notification).toBeVisible();
    await touch("touchStart", [[1, x, y]]);
    await touch("touchMove", [[1, x + 1, y]]);
    await touch("touchMove", [[1, x + 35, y]]);
    const displacement = await notification.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
    expect(displacement).toBeGreaterThan(8);
    expect(displacement).toBeLessThan(40);
    await notification.evaluate(el => {
      window.toastExitTarget = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          if (!el.hasAttribute("data-ending-style")) return;
          observer.disconnect();
          const transition = el.getAnimations().find(item => item instanceof CSSTransition && item.transitionProperty === "transform");
          const endTime = transition?.effect?.getComputedTiming().endTime;
          if (!transition || typeof endTime !== "number") { resolve(NaN); return; }
          transition.pause();
          transition.currentTime = endTime;
          resolve(new DOMMatrix(getComputedStyle(el).transform).m41);
          transition.play();
        });
        observer.observe(el, { attributes: true });
      });
    });
    await touch("touchEnd", []);
    expect(await page.evaluate(() => window.toastExitTarget)).toBeGreaterThan(displacement + rect.width);
    await expect(notification).toHaveCount(0);
  });

});

test("cancelled drags recover, can be grabbed again, and settle on keyboard or reduced motion", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse capture interruption; coarse recovery is covered by emulated touch.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#toast");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
  await page.getByRole("button", { name: "Archive note", exact: true }).click();
  const notification = page.locator('[data-slot="toast"]');
  await notification.hover();
  await notification.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
  const rect = (await notification.boundingBox())!;
  const x = rect.x + 60;
  const y = rect.y + 24;
  async function cancelDrag() {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 1, y);
    await page.mouse.move(x + 30, y);
    await notification.evaluate(el => {
      window.toastRecovery = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          if (el.hasAttribute("data-swiping")) return;
          observer.disconnect();
          requestAnimationFrame(() => {
            const animation = el.getAnimations().find(item => !(item instanceof CSSTransition));
            if (!animation) { resolve(null); return; }
            animation.pause();
            animation.currentTime = 0;
            resolve(new DOMMatrix(getComputedStyle(el).transform).m41);
          });
        });
        observer.observe(el, { attributes: true });
      });
    });
    await notification.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse", clientX: x + 30, clientY: y });
    await page.mouse.up();
  }
  await cancelDrag();
  const recoveredFrom = await page.evaluate(() => window.toastRecovery);
  expect(recoveredFrom).toBeGreaterThan(20);
  await page.mouse.move(x + 30, y);
  await page.mouse.down();
  await page.mouse.move(x + 31, y);
  expect(await notification.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)).toBeCloseTo(recoveredFrom!, 0);
  await page.mouse.move(x + 40, y);
  // Losing capture must cancel, even after crossing the normal dismissal threshold.
  await notification.evaluate(el => el.releasePointerCapture(1));
  await page.mouse.move(x + 45, y);
  await expect(notification).not.toHaveAttribute("data-swiping", "");
  await page.mouse.up();
  await page.keyboard.press("F6");
  expect(await notification.evaluate(el => ({ animations: el.getAnimations().length, transform: el.style.transform, transition: el.style.transition }))).toEqual({ animations: 0, transform: "", transition: "" });
  await page.keyboard.press("Shift+Tab");
  await cancelDrag();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => notification.evaluate(el => ({ animations: el.getAnimations({ subtree: true }).length, transform: el.style.transform, transition: el.style.transition }))).toEqual({ animations: 0, transform: "", transition: "" });
});

test.describe("coarse recovery geometry", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("recovery retargets when a new notification changes stack geometry", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Chromium coarse-pointer recovery regression.");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/#toast");
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeEnabled();
    await page.getByRole("button", { name: "Archive note", exact: true }).click();
    const notification = page.locator('[data-slot="toast"]').filter({ hasText: "Note archived" });
    await notification.hover();
    await notification.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    const rect = (await notification.boundingBox())!;
    const x = rect.x + 60;
    const y = rect.y + 24;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 1, y);
    await page.mouse.move(x + 30, y);
    await notification.evaluate(el => {
      window.toastRecovery = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          if (el.hasAttribute("data-swiping")) return;
          observer.disconnect();
          requestAnimationFrame(() => {
            const animation = el.getAnimations().find(item => !(item instanceof CSSTransition));
            if (!animation) { resolve(null); return; }
            animation.pause();
            animation.currentTime = 0;
            resolve(new DOMMatrix(getComputedStyle(el).transform).m41);
          });
        });
        observer.observe(el, { attributes: true });
      });
    });
    await notification.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse", clientX: x + 30, clientY: y });
    await page.mouse.up();
    expect(await page.evaluate(() => window.toastRecovery)).toBeGreaterThan(20);
    await page.getByRole("button", { name: "Save note", exact: true }).click();
    await expect(page.locator('[data-slot="toast"]')).toHaveCount(2);
    const geometry = await notification.evaluate(async el => {
      const animation = el.getAnimations().find(item => !(item instanceof CSSTransition));
      if (!animation) return null;
      const endTime = animation.effect?.getComputedTiming().endTime;
      if (typeof endTime !== "number") return null;
      animation.pause();
      animation.currentTime = endTime - 1;
      const before = new DOMMatrix(getComputedStyle(el).transform);
      animation.finish();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const after = new DOMMatrix(getComputedStyle(el).transform);
      return { beforeY: before.m42, afterY: after.m42, beforeScale: before.a, afterScale: after.a, inlineTransform: el.style.transform };
    });
    expect(geometry).not.toBeNull();
    expect(geometry!.inlineTransform).toBe("");
    expect(geometry!.beforeY).toBeCloseTo(geometry!.afterY, 0);
    expect(geometry!.beforeScale).toBeCloseTo(geometry!.afterScale, 2);
  });

});
