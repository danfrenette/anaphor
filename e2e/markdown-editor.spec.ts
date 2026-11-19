import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { prepareContentSnapshot } from "./content-snapshot";

for (const theme of ["light", "dark"]) test(`formatting bubble baseline and accessibility: ${theme}`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.pressSequentially("Format this text");
  await page.keyboard.press("Shift+ArrowLeft");
  const bubble = page.getByRole("toolbar", { name: "Formatting" });
  await expect(bubble).toBeVisible();
  for (const name of ["Bold", "Italic", "Strikethrough", "Inline code", "Link"]) {
    await expect(bubble.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await checkAccessibility(page, '[aria-label="Field states"]');
  await expect(bubble).toHaveScreenshot(`markdown-bubble-${theme}.png`, { animations: "disabled", caret: "hide" });
  await bubble.getByRole("button", { name: "Link" }).click();
  await expect(page.getByRole("textbox", { name: "URL" })).toBeFocused();
  await checkAccessibility(page, '[aria-label="Field states"]');
});

for (const theme of ["light", "dark"]) test(`bubble keyboard navigation, focus and accessibility: ${theme}`, async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard navigation is verified on desktop.");
  await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.pressSequentially("hello");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowLeft");
  const bubble = page.getByRole("toolbar", { name: "Formatting" });
  await expect(bubble).toBeVisible();
  await page.keyboard.press("Alt+F10");
  await expect(bubble.getByRole("button", { name: "Bold" })).toBeFocused();
  await expect(bubble).toBeVisible();
  await checkAccessibility(page, '[aria-label="Field states"]');
  await page.keyboard.press("Space");
  await expect(bubble.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("**hello**");
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("hello");
  await page.keyboard.press("ArrowRight");
  await expect(bubble.getByRole("button", { name: "Italic" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(bubble.getByRole("button", { name: "Bold" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(bubble.getByRole("button", { name: "Link" })).toBeFocused();
  await page.keyboard.press("Home");
  await page.keyboard.press("Escape");
  await expect(editor).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe("hello");
  await page.keyboard.press("ControlOrMeta+K");
  await expect(page.getByRole("textbox", { name: "URL" })).toBeFocused();
  await checkAccessibility(page, '[aria-label="Field states"]');
  await page.keyboard.press("Escape");
  await expect(editor).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe("hello");
  await page.keyboard.press("Alt+F10");
  await expect(bubble.getByRole("button", { name: "Bold" })).toBeFocused();
  await page.keyboard.press("Tab");
  const bubbleHasFocus = () => page.evaluate(() => {
    const toolbar = document.querySelector('[role="toolbar"][aria-label="Formatting"]');
    return toolbar?.contains(document.activeElement) ?? false;
  });
  await expect.poll(bubbleHasFocus).toBe(false);
  await expect(bubble).toBeHidden();
});

test("task checkboxes have separate 44px touch targets", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Coarse-pointer hit testing is covered on mobile WebKit.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("[ ] First");
  await editor.press("Enter");
  await editor.pressSequentially("Second");
  await editor.press("Enter");
  await editor.pressSequentially("Third");
  const boxes = editor.getByRole("checkbox");
  await expect(boxes).toHaveCount(3);
  console.log(JSON.stringify(await boxes.evaluateAll(inputs => inputs.map(input => {
    const rect = input.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }))));
  for (let index = 0; index < 3; index++) {
    const box = boxes.nth(index);
    await box.scrollIntoViewIfNeeded();
    const result = await box.evaluate(input => {
      const rect = input.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const offsets = [-21.5, 0, 21.5];
      const hits = offsets.flatMap(x => offsets.map(y => {
        const hit = document.elementFromPoint(center.x + x, center.y + y);
        return hit === input || hit?.closest("label")?.contains(input) === true;
      }));
      const label = input.closest("label")!;
      const labelRect = label.getBoundingClientRect();
      return { center, hits, label: { x: labelRect.x, y: labelRect.y, width: labelRect.width, height: labelRect.height } };
    });
    console.log(JSON.stringify({ index, ...result }));
    expect(result.hits).toEqual(Array(9).fill(true));
    for (const [x, y] of [[-21.5, -21.5], [21.5, 21.5]]) {
      const before = await boxes.evaluateAll(inputs => inputs.map(input => input instanceof HTMLInputElement && input.checked));
      await page.touchscreen.tap(result.center.x + x!, result.center.y + y!);
      const after = await boxes.evaluateAll(inputs => inputs.map(input => input instanceof HTMLInputElement && input.checked));
      expect(after).toEqual(before.map((checked, item) => item === index ? !checked : checked));
    }
  }
  const nested = page.getByRole("textbox", { name: "In-place note", exact: true }).getByRole("checkbox");
  await expect(nested).toHaveCount(3);
  for (let index = 0; index < 3; index++) {
    const box = nested.nth(index);
    await box.scrollIntoViewIfNeeded();
    const hits = await box.evaluate(input => {
      const rect = input.getBoundingClientRect();
      const offsets = [-21.5, 0, 21.5];
      return offsets.flatMap(x => offsets.map(y => {
        const hit = document.elementFromPoint(rect.left + rect.width / 2 + x, rect.top + rect.height / 2 + y);
        return hit === input || hit?.closest("label")?.contains(input) === true;
      }));
    });
    console.log(JSON.stringify({ nested: index, hits }));
    expect(hits, `nested task ${index}`).toEqual(Array(9).fill(true));
  }
});

for (const theme of ["light", "dark"]) {
  test(`bubble excludes code and opaque selections: ${theme}`, async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard selection is verified on desktop.");
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.goto("/markdown-editor");
    const editor = page.getByRole("textbox", { name: "Research note" });
    const paragraph = editor.locator("p").first();
    await paragraph.click();
    await page.keyboard.press("Shift+ArrowLeft");
    const bubble = page.getByRole("toolbar", { name: "Formatting" });
    await expect(bubble).toBeVisible();
    const code = editor.locator("pre code");
    await code.click();
    await page.keyboard.press("Shift+ArrowLeft");
    await expect.poll(() => page.evaluate(() => {
      const selection = window.getSelection();
      return !!selection?.toString() && !!selection.anchorNode?.parentElement?.closest("pre");
    })).toBe(true);
    await expect(bubble).toBeHidden();

    const existing = page.getByRole("textbox", { name: "Existing post" });
    const block = existing.getByText("[^1]: The note text.", { exact: true });
    await block.click();
    await expect(bubble).toBeHidden();
  });

  test(`bubble excludes image and non-editable selections: ${theme}`, async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard selection is verified on desktop.");
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.goto("/markdown-editor");
    const inPlace = page.getByRole("textbox", { name: "In-place note", exact: true });
    const image = inPlace.getByRole("img", { name: "Landscape study" });
    await image.scrollIntoViewIfNeeded();
    await inPlace.evaluate(element => {
      const image = element.querySelector('img[alt="Landscape study"]')!;
      const range = document.createRange();
      range.setStartBefore(image);
      range.collapse(true);
      if (element instanceof HTMLElement) element.focus();
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => image.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
    const bubble = page.getByRole("toolbar", { name: "Formatting" });
    await expect(bubble).toBeHidden();
    await page.keyboard.press("Backspace");
    await expect(image).toHaveCount(0);

    const editor = page.getByRole("textbox", { name: "Notes", exact: true });
    await editor.click();
    await editor.pressSequentially("Selected text");
    await page.keyboard.press("Shift+ArrowLeft");
    await expect(bubble).toBeVisible();
    await page.getByRole("button", { name: "Read-only", exact: true }).click();
    await expect(editor).toHaveAttribute("aria-readonly", "true");
    const text = editor.locator("p");
    const box = (await text.boundingBox())!;
    await page.mouse.move(box.x + 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).not.toBe("");
    await expect(bubble).toBeHidden();

    await page.getByRole("button", { name: "Read-only", exact: true }).click();
    await page.getByRole("button", { name: "Disabled", exact: true }).click();
    await expect(editor).toHaveAttribute("aria-disabled", "true");
    await editor.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element.querySelector("p")!);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe("Selected text");
    await expect(bubble).toBeHidden();
  });
}

test("shortcuts work immediately after a keyboard selection", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard navigation is verified on desktop.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.pressSequentially("text");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Alt+F10");
  await expect(page.getByRole("button", { name: "Bold", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.keyboard.press("ControlOrMeta+K");
  await expect(page.getByRole("textbox", { name: "URL" })).toBeFocused();
});

test("link shortcut works before the selection bubble appears", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard navigation is verified on desktop.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.pressSequentially("text");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("ControlOrMeta+K");
  await expect(page.getByRole("textbox", { name: "URL" })).toBeFocused();
});

for (const [name, markdown] of [
  ["Bold", "**hello**"],
  ["Italic", "*hello*"],
  ["Strikethrough", "~~hello~~"],
  ["Inline code", "`hello`"],
] as const) {
  test(`pointer selection and ${name} produce Markdown`, async ({ page, isMobile }) => {
    test.skip(isMobile, "Pointer dragging is verified on desktop.");
    await page.goto("/markdown-editor");
    const editor = page.getByRole("textbox", { name: "Notes", exact: true });
    await editor.click();
    await editor.pressSequentially("hello");
    const box = (await editor.locator("p").boundingBox())!;
    const textWidth = await editor.locator("p").evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect().width;
    });
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + textWidth - 1, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe("hello");
    const button = page.getByRole("button", { name, exact: true });
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText(markdown);
  });
}

test("bubble remains reachable at both edges of a scrolled field", async ({ page, isMobile }) => {
  test.skip(isMobile, "The scrolling field edge test uses desktop selection.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  for (let i = 0; i < 20; i++) {
    await editor.pressSequentially(`Line ${i}`);
    if (i < 19) await page.keyboard.press("Enter");
  }
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  for (const index of [0, 19]) {
    const line = editor.locator("p").nth(index);
    await line.scrollIntoViewIfNeeded();
    await line.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await assertBubbleGeometry(page);
    expect(await frame.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await editor.focus();
  }
  const comparison = page.getByRole("textbox", { name: "In-place note", exact: true });
  await comparison.scrollIntoViewIfNeeded();
  await comparison.locator("p").first().click();
  await page.keyboard.press("Shift+ArrowLeft");
  await assertBubbleGeometry(page);
});

async function assertBubbleGeometry(page: Page) {
  const bubble = page.getByRole("toolbar", { name: "Formatting" });
  await expect(bubble).toBeVisible();
  const box = (await bubble.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  for (const name of ["Bold", "Italic", "Strikethrough", "Inline code", "Link"]) {
    const button = bubble.getByRole("button", { name, exact: true });
    const bounds = (await button.boundingBox())!;
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label"),
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    );
    expect(hit).toBe(name);
  }
}

test("link bubble adds, edits, rejects unsafe URLs and removes links", async ({ page, isMobile }) => {
  test.skip(isMobile, "Link editing is exercised with desktop keyboard and pointer.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await editor.click();
  await editor.pressSequentially("hello");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowLeft");
  const link = page.getByRole("button", { name: "Link", exact: true });
  await link.click();
  let url = page.getByRole("textbox", { name: "URL" });
  await url.fill("example.com");
  await url.press("Enter");
  await expect(output).toHaveText("[hello](https://example.com)");
  await link.click();
  url = page.getByRole("textbox", { name: "URL" });
  await expect(url).toHaveValue("https://example.com");
  await url.fill("java&#115;cript:alert(1)");
  await url.press("Enter");
  await expect(url).toHaveAttribute("aria-invalid", "true");
  await expect(output).toHaveText("[hello](https://example.com)");
  await url.fill("https://other.example");
  await url.press("Enter");
  await expect(output).toHaveText("[hello](https://other.example)");
  await link.click();
  await page.getByRole("button", { name: "Remove link" }).click();
  await expect(output).toHaveText("hello");
  await page.keyboard.press("ControlOrMeta+Z");
  await expect(output).toHaveText("[hello](https://other.example)");
});

test("link form dismissal on focus leaving resets the toolbar", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard selection is verified on desktop.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.pressSequentially("hello");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowLeft");
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "URL" })).toBeFocused();
  await page.getByRole("button", { name: "Toggle autofocus example" }).click();
  await expect(page.getByRole("toolbar", { name: "Formatting" })).toBeHidden();
  await editor.click();
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Alt+F10");
  await expect(page.getByRole("button", { name: "Bold", exact: true })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "URL" })).toBeHidden();
});

for (const method of ["keyboard", "pointer"] as const) test(`link ${method} apply restores focus`, async ({ page, isMobile }) => {
  test.skip(isMobile, "Focus behavior is verified on desktop.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.pressSequentially("hello");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowLeft");
  await page.getByRole("button", { name: "Link", exact: true }).click();
  const url = page.getByRole("textbox", { name: "URL" });
  await url.fill("https://example.com");
  if (method === "keyboard") {
    await url.press("Enter");
    await expect(page.getByRole("button", { name: "Link", exact: true })).toBeFocused();
  } else {
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(editor).toBeFocused();
  }
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("[hello](https://example.com)");
});

test("a multi-cell selection does not expose formatting", async ({ page, isMobile }) => {
  test.skip(isMobile, "Cell dragging is verified on desktop.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Table note" });
  await editor.scrollIntoViewIfNeeded();
  const cells = editor.locator("td");
  const start = (await cells.nth(0).boundingBox())!;
  const end = (await cells.nth(1).boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole("toolbar", { name: "Formatting" })).toHaveCount(0);
});

test("formatting bubble escapes the field scroller and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.pressSequentially("Selection to format");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe("t");
  const bubble = page.getByRole("toolbar", { name: "Formatting" });
  await expect(bubble).toBeVisible();
  await assertBubbleGeometry(page);
  expect(await bubble.evaluate(element => getComputedStyle(element).transitionDuration)).toBe("0s");
  expect(await bubble.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
});

test("touch selection positions the bubble below text and buttons are tappable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch placement is tested on mobile WebKit.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.tap();
  await editor.pressSequentially("Touch selection");
  const selectionBox = await editor.evaluate(element => {
    const text = element.querySelector("p")!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
    const rect = range.getBoundingClientRect();
    return { bottom: rect.bottom };
  });
  const bubble = page.getByRole("toolbar", { name: "Formatting" });
  await expect(bubble).toBeVisible();
  expect((await bubble.boundingBox())!.y).toBeGreaterThanOrEqual(selectionBox.bottom);
  const bold = bubble.getByRole("button", { name: "Bold" });
  const box = (await bold.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
  await bold.tap();
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("**Touch** selection");
});

test("Chromium drops an image file through the demo handler", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "File drop is verified in Chromium.");
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  await editor.scrollIntoViewIfNeeded();
  const prevented = await editor.evaluate(element => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array([137, 80, 78, 71])], "diagram.png", { type: "image/png" }));
    const rect = element.getBoundingClientRect();
    const event = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: transfer,
      clientX: rect.left + 20,
      clientY: rect.top + 20,
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  const image = editor.getByRole("img", { name: "diagram.png" });
  await expect(image).toHaveAttribute("src", /^blob:/);
  await expect(page.getByLabel("Current Markdown", { exact: true })).toContainText("![diagram.png](blob:");
});

test("Chromium maps a positioned pending image drop through edits", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "File drop is verified in Chromium.");
  await page.goto("/markdown-editor-fixture");
  const editor = page.getByRole("textbox", { name: "Drop fixture" });
  const prevented = await editor.evaluate(element => {
    const text = element.querySelector("p")!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 2);
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    const transfer = new DataTransfer();
    transfer.items.add(new File(["image"], "diagram.png", { type: "image/png" }));
    const event = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: transfer,
      clientX: rect.x,
      clientY: rect.y + rect.height / 2,
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(page.getByRole("button", { name: "Complete upload" })).toBeEnabled();
  await editor.focus();
  await page.keyboard.press("Home");
  await page.keyboard.type("x");
  await expect(page.getByRole("group", { name: "Drop Markdown" })).toHaveText("xabcd");
  await page.getByRole("button", { name: "Complete upload" }).click();
  await expect(editor.getByRole("img", { name: "diagram.png" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Drop Markdown" })).toHaveText("xab![diagram.png](/icon.svg)cd");
});

for (const key of ["Backspace", "Delete"]) test(`arrow selects an image and ${key} removes it`, async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "In-place note", exact: true });
  const image = editor.getByRole("img", { name: "Landscape study" });
  await image.scrollIntoViewIfNeeded();
  await editor.evaluate(element => {
    const image = element.querySelector('img[alt="Landscape study"]')!;
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStartBefore(image);
    range.collapse(true);
    if (element instanceof HTMLElement) element.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => image.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await expect(page.getByRole("toolbar", { name: "Formatting" })).toHaveCount(0);
  await page.keyboard.press(key);
  await expect(image).toHaveCount(0);
});

test("Chromium pastes real clipboard HTML and undoes it in one step", async ({ page, browserName, context }) => {
  test.skip(browserName !== "chromium", "WebKit cannot grant clipboard permissions in Playwright.");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:3105" });
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await page.evaluate(async () => {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob(['<h2 style="font-weight:900">Clipboard heading</h2><p>Text with <strong>bold</strong>.</p>'], { type: "text/html" }),
      "text/plain": new Blob(["Clipboard heading\nText with bold."], { type: "text/plain" }),
    })]);
  });
  await editor.click();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(editor.getByRole("heading", { name: "Clipboard heading" })).toBeVisible();
  await expect(output).toHaveText("## Clipboard heading\n\nText with **bold**.");
  await page.keyboard.press("ControlOrMeta+Z");
  await expect(output).toHaveText("");
});

test("Chromium never loads resources from pasted HTML", async ({ page, browserName, context }) => {
  test.skip(browserName !== "chromium", "Clipboard permissions require Chromium.");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:3105" });
  const requests: string[] = [];
  await page.route("**/*", async route => {
    if (new URL(route.request().url()).host !== "127.0.0.1:3105") {
      requests.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  for (const [html, visible] of [
    ['<img src="https://paste-image.invalid/a.png" alt="image">', "image"],
    ['<img srcset="https://paste-srcset.invalid/a.png 2x" alt="srcset">', "srcset"],
    ['<picture><source srcset="https://paste-picture.invalid/a.png"><img alt="picture"></picture>', "picture"],
    ['<table><tr><td><img src="https://paste-table.invalid/a.png" alt="table"></td></tr></table>', "table"],
    ['<div style="background-image:url(https://paste-css.invalid/a.png)">background</div>', "background"],
  ] as const) {
    await page.goto("/markdown-editor");
    const editor = page.getByRole("textbox", { name: "Notes" });
    await page.evaluate(async html => navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob(["text"], { type: "text/plain" }),
    })]), html);
    await editor.click();
    await page.keyboard.press("ControlOrMeta+V");
    await expect(editor).toHaveText(visible);
    expect(requests).toEqual([]);
  }
});

test("typing a task item exposes a named checkbox and toggles Markdown", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("[ ] Review notes");
  const checkbox = editor.getByRole("checkbox", { name: /Review notes/i });
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toContainText("[x] Review notes");
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toContainText("[ ] Review notes");
});

test("checked task trigger and checkbox state transitions", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("[x] Review notes");
  const checkbox = editor.getByRole("checkbox", { name: /Review notes/i });
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await expect(checkbox).toBeChecked();
  await checkbox.focus();
  const before = await output.textContent();
  const readOnly = page.getByRole("button", { name: "Read-only", exact: true });
  await readOnly.evaluate((button: HTMLButtonElement) => button.click());
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(output).toHaveText(before!);
  await readOnly.evaluate((button: HTMLButtonElement) => button.click());
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  await expect(output).toContainText("[ ] Review notes");
  await checkbox.focus();
  await page.getByRole("button", { name: "Disabled", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(checkbox).not.toBeFocused();
});

for (const theme of ["light", "dark"]) test(`disabled task checkbox uses disabled treatment: ${theme}`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("[x] Review notes");
  const checkbox = editor.getByRole("checkbox", { name: /Review notes/i });
  await page.getByRole("button", { name: "Disabled", exact: true }).click();
  const colors = await checkbox.evaluate(element => {
    const sample = document.createElement("span");
    sample.style.cssText = "background:var(--anaphor-input-disabled);color:var(--anaphor-font-tertiary)";
    element.parentElement!.append(sample);
    const expected = getComputedStyle(sample);
    const result = {
      background: getComputedStyle(element, "::before").backgroundColor,
      mark: getComputedStyle(element, "::after").borderBottomColor,
      disabled: expected.backgroundColor,
      muted: expected.color,
    };
    sample.remove();
    return result;
  });
  expect(colors.background).toBe(colors.disabled);
  expect(colors.mark).toBe(colors.muted);
  await page.getByRole("button", { name: "Disabled", exact: true }).click();
  await checkbox.uncheck();
  await page.getByRole("button", { name: "Disabled", exact: true }).click();
  const unchecked = await checkbox.evaluate(element => ({
    background: getComputedStyle(element, "::before").backgroundColor,
    mark: getComputedStyle(element, "::after").content,
  }));
  expect(unchecked.background).toBe(colors.disabled);
  expect(unchecked.mark).toBe("none");
});

for (const theme of ["light", "dark"]) test(`read-only task marks match rendered status indicators: ${theme}`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("[x] Review notes");
  const checkbox = editor.getByRole("checkbox", { name: /Review notes/i });
  const readOnly = page.getByRole("button", { name: "Read-only", exact: true });
  const rendered = page.getByLabel("Rendered note");
  const paint = (element: Element) => {
    const box = getComputedStyle(element, "::before");
    const mark = getComputedStyle(element, "::after");
    return { fill: box.backgroundColor, border: box.borderColor, mark: mark.content, markColor: mark.borderBottomColor };
  };
  for (const checked of [true, false]) {
    if (!checked) await checkbox.uncheck();
    await readOnly.click();
    const staticBox = rendered.locator(`input[type="checkbox"]${checked ? ":checked" : ":not(:checked)"}`).first();
    expect(await checkbox.evaluate(paint)).toEqual(await staticBox.evaluate(paint));
    await readOnly.click();
  }
});

test("table cells edit independently and Tab exits at both boundaries", async ({ page, browserName }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Table note" });
  const output = page.getByLabel("Table Markdown");
  const cells = editor.locator("th, td");
  await expect(cells).toHaveCount(4);
  await cells.nth(2).click();
  await page.keyboard.press("End");
  await page.keyboard.type("!");
  await expect(output).toContainText("Alpha!");
  await expect(output).toHaveText("\n| Name   | Value |\n| :------ | -----: |\n| Alpha! | Beta  |\n");
  await expect(cells.nth(0)).toHaveText("Name");
  await expect(cells.nth(1)).toHaveText("Value");
  await expect(cells.nth(3)).toHaveText("Beta");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => window.getSelection()?.anchorNode?.parentElement?.closest("td")?.textContent)).toBe("Beta");
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => window.getSelection()?.anchorNode?.parentElement?.closest("td")?.textContent)).toBe("Alpha!");
  await page.keyboard.press("Tab");
  await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
  await expect(editor.locator("tr")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "After table" })).toBeFocused();
  await cells.last().click();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => window.getSelection()?.anchorNode?.parentElement?.closest("th")?.textContent)).toBe("Name");
  await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Shift+Tab" : "Shift+Tab");
  await expect(editor.locator("tr")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Before table" })).toBeFocused();
});

async function selectEditorContents(editor: Locator) {
  await editor.evaluate(element => {
    const selection = window.getSelection();
    if (!selection) throw new Error("Selection unavailable");
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  });
}

async function checkAccessibility(page: Page, include?: string) {
  const scan = () => {
    const builder = new AxeBuilder({ page });
    return include ? builder.include(include) : builder;
  };
  const tags = ["wcag2a", "wcag2aa", "wcag22aa"];
  const general = await scan().withTags(tags).disableRules("scrollable-region-focusable").analyze();
  const editableScrollRegions = '[data-slot="markdown-editor"] [role="textbox"]:not([aria-readonly="true"]) pre, [data-slot="markdown-editor"] [role="textbox"]:not([aria-readonly="true"]) div:has(> table)';
  const scrollable = await scan()
    .exclude(editableScrollRegions)
    .withRules("scrollable-region-focusable")
    .analyze();
  expect([...general.violations, ...scrollable.violations]).toEqual([]);
}

test("wide tables stay within the page and remain keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/markdown-editor");
  const section = page.getByRole("region", { name: "Wide table comparison" });
  const editor = page.getByRole("textbox", { name: "Wide table editor" });
  const rendered = page.getByLabel("Wide table rendered");
  for (const root of [editor, rendered]) {
    const table = root.locator("table");
    await expect(table).toBeVisible();
    const geometry = await table.evaluate(element => {
      const wrapper = element.parentElement!;
      return {
        scrolls: wrapper.scrollWidth > wrapper.clientWidth,
        insideViewport: wrapper.getBoundingClientRect().right <= document.documentElement.clientWidth,
      };
    });
    expect(geometry).toEqual({ scrolls: true, insideViewport: true });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const heights = await Promise.all([editor, rendered].map(root => root.evaluate(element => element.getBoundingClientRect().height)));
  expect(Math.abs(heights[0]! - heights[1]!)).toBeLessThanOrEqual(1);
  await expect(rendered.getByRole("region", { name: "Table" })).toHaveAttribute("tabindex", "0");
  await checkAccessibility(page, '[aria-label="Wide table comparison"]');
  await expect(section).toBeVisible();
});

test("in-place opaque block undo and keyboard gap", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "In-place opaque note" });
  const output = page.getByLabel("In-place opaque Markdown");
  await editor.getByText("<!-- Field note -->").click();
  await editor.press("Delete");
  await expect(output).not.toContainText("<!-- Field note -->");
  await editor.press("ControlOrMeta+z");
  await expect(output).toContainText("<!-- Field note -->");
  await editor.getByText("<!-- Field note -->").click();
  await editor.press("ArrowDown");
  await page.keyboard.type("x");
  await expect(output).toHaveText("## A loaded note\n\nLoaded with `setMarkdown`.\n\n<!-- Field note -->\n\nx");
});

test("page space below the in-place editor does not focus it", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "In-place opaque note" });
  await editor.getByText("A loaded note").click();
  await page.getByLabel("Space below the editor", { exact: true }).click();
  await expect(editor).not.toBeFocused();
});

test("in-place keyboard and mouse focus indicators", async ({ page, browserName }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Read-only in-place note" });
  const editable = page.getByRole("textbox", { name: "In-place opaque note" });
  const outline = (element: Element) => getComputedStyle(element).outline;
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    await editable.focus();
    const editableOutline = await editable.evaluate(outline);
    expect(await editable.evaluate(element => getComputedStyle(element).outlineStyle)).toBe("none");
    await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
    await expect(editor).toBeFocused();
    const keyboardOutline = await editor.evaluate(outline);
    expect(await editor.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
    await editable.click();
    await editor.click();
    await expect(editor).toBeFocused();
    const mouseOutline = await editor.evaluate(outline);
    expect(await editor.evaluate(element => getComputedStyle(element).outlineStyle)).toBe("none");
    console.log(JSON.stringify({ dark, keyboardOutline, mouseOutline, editableOutline }));
  }
});

for (const theme of ["light", "dark"]) test(`comparison labels and Markdown code ending remain visible: ${theme}`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
  await page.goto("/markdown-editor");
  const section = page.getByRole("region", { name: "In-place comparison" });
  await expect(section.getByText("Editable", { exact: true }).first()).toBeVisible();
  await expect(section.getByText("Rendered", { exact: true }).first()).toBeVisible();
  const editor = page.getByRole("textbox", { name: "In-place code ending" });
  const rendered = page.getByLabel("Rendered code ending");
  for (const root of [editor, rendered]) {
    const code = root.locator("pre");
    await expect(code).toContainText("x".repeat(120));
    expect(await code.evaluate(element => ({
      whiteSpace: getComputedStyle(element).whiteSpace,
      overflow: element.scrollWidth > element.clientWidth,
    }))).toEqual({ whiteSpace: "pre", overflow: true });
  }
  await editor.locator("p").first().click();
  await page.keyboard.press("End");
  await page.keyboard.type("x");
  for (const root of [editor, rendered]) await expect(root.locator(":scope > pre:last-child")).toBeVisible();
  const heights = await Promise.all([editor, rendered].map(root => root.evaluate(element => element.getBoundingClientRect().height)));
  console.log(JSON.stringify({ endingWithCodeHeights: heights }));
  expect(Math.abs(heights[0]! - heights[1]!)).toBeLessThanOrEqual(1);
  const blocks = await Promise.all([editor, rendered].map(root => root.locator("pre").evaluate(element => element.getBoundingClientRect().height)));
  expect(Math.abs(blocks[0]! - blocks[1]!)).toBeLessThanOrEqual(1);
});

test("ordinary lists retain bullets around non-task checkboxes", async ({ page }) => {
  await page.goto("/markdown-editor");
  const styles = await page.getByLabel("Complex tasks rendered").evaluate(root => {
    const container = document.createElement("div");
    container.innerHTML = `<ul><li><p><input type="checkbox"> enabled</p></li></ul><ul><li><p data-prose-exclude><input type="checkbox" disabled> excluded</p></li></ul><ul><li><p><span>before</span> <input type="checkbox" disabled> later</p></li></ul><ul><li><input type="checkbox" disabled> task</li></ul>`;
    root.append(container);
    container.insertAdjacentHTML("beforeend", `<ul><li>before</li><li><input type="checkbox" disabled> task</li><li>after</li><li>another</li></ul>`);
    return [...container.querySelectorAll("ul")].map(list => ({
      style: getComputedStyle(list).listStyleType,
      padding: getComputedStyle(list).paddingInlineStart,
      items: [...list.children].map(item => getComputedStyle(item).listStyleType),
    }));
  });
  for (const item of styles.slice(0, 3)) {
    expect(item.style).toBe("disc");
    expect(parseFloat(item.padding)).toBeGreaterThan(0);
    expect(item.items).toEqual(["disc"]);
  }
  expect(styles[3]!.items).toEqual(["none"]);
  expect(styles[4]!.items).toEqual(["disc", "none", "disc", "disc"]);
});

for (const theme of ["light", "dark"]) {
  test(`mixed task list gap: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.goto("/markdown-editor");
    await page.evaluate(() => document.fonts.ready);
    const measure = (root: Element) => {
      const origin = root.getBoundingClientRect();
      return [...root.querySelectorAll("li")].map(item => {
        const text = item.querySelector(":scope > div > p") ?? item;
        const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const index = node.textContent!.search(/\S/);
          if (index < 0) continue;
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          const glyph = range.getBoundingClientRect();
          return { marker: getComputedStyle(item).listStyleType !== "none", x: glyph.left - origin.left, top: glyph.top - origin.top };
        }
        throw new Error("Missing item text");
      });
    };
    const editor = await page.getByRole("textbox", { name: "Mixed tasks editor" }).evaluate(measure);
    const rendered = await page.getByLabel("Mixed tasks rendered").evaluate(measure);
    console.log(JSON.stringify({ theme, width: page.viewportSize()?.width, editor, rendered }));
    expect(editor).toHaveLength(3);
    expect(rendered).toHaveLength(3);
    expect(editor.map(item => item.marker)).toEqual([true, false, true]);
    expect(rendered.map(item => item.marker)).toEqual([true, false, true]);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(editor[i]!.x - rendered[i]!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(editor[i]!.top - rendered[i]!.top)).toBeLessThanOrEqual(24);
    }
  });
  test(`complex task geometry: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.goto("/markdown-editor");
    await page.evaluate(() => document.fonts.ready);
    const measure = (root: Element) => {
      const origin = root.getBoundingClientRect();
      return [...root.querySelectorAll('input[type="checkbox"]')].map(input => {
        const item = input.closest("li")!;
        const box = input.getBoundingClientRect();
        const itemBox = item.getBoundingClientRect();
        const walker = document.createTreeWalker(item.querySelector(":scope > div > p") ?? item, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const index = node.textContent!.search(/\S/);
          if (index < 0) continue;
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          const glyph = range.getBoundingClientRect();
          const nested = item.querySelector("ol, ul, p + p")?.getBoundingClientRect();
          return {
            top: itemBox.top - origin.top,
            height: itemBox.height,
            boxTop: box.top - origin.top,
            boxHeight: box.height,
            textX: glyph.left - origin.left,
            textTop: glyph.top - origin.top,
            nestedTop: nested ? nested.top - origin.top : -1,
            nestedX: nested ? nested.left - origin.left : -1,
          };
        }
        throw new Error("Missing task text");
      });
    };
    const editor = await page.getByRole("textbox", { name: "Complex tasks editor" }).evaluate(measure);
    const rendered = await page.getByLabel("Complex tasks rendered").evaluate(measure);
    console.log(JSON.stringify({ theme, width: page.viewportSize()?.width, editor, rendered }));
    expect(editor).toHaveLength(5);
    expect(rendered).toHaveLength(5);
    const otherPosition = (root: Element) => {
      const origin = root.getBoundingClientRect();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim() !== "other") continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return { x: rect.left - origin.left, top: rect.top - origin.top };
      }
      throw new Error("Missing other item");
    };
    const otherEditor = await page.getByRole("textbox", { name: "Complex tasks editor" }).evaluate(otherPosition);
    const otherRendered = await page.getByLabel("Complex tasks rendered").evaluate(otherPosition);
    console.log(JSON.stringify({ otherEditor, otherRendered }));
    expect(Math.abs(otherEditor.x - otherRendered.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(otherEditor.top - otherRendered.top)).toBeLessThanOrEqual(1);
    for (const item of [editor[4]!, rendered[4]!]) {
      expect(Math.abs(item.boxTop - item.textTop)).toBeLessThanOrEqual(3);
      expect(item.nestedTop).toBeGreaterThan(item.textTop + item.boxHeight);
    }
    for (let i = 0; i < 5; i++) {
      for (const key of ["top", "height", "boxTop", "boxHeight", "textX", "textTop", "nestedTop", "nestedX"] as const) {
        expect(Math.abs(editor[i]![key] - rendered[i]![key]), `task ${i} ${key}`).toBeLessThanOrEqual(1);
      }
    }
  });
  test(`in-place comparison baseline: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.goto("/markdown-editor");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("textbox", { name: "In-place note", exact: true })).toBeVisible();
    await prepareContentSnapshot(page);
    const comparison = page.getByRole("region", { name: "In-place comparison" });
    await expect(comparison).toHaveScreenshot(`markdown-in-place-${theme}.png`, { animations: "disabled", caret: "hide" });
  });

  test(`in-place parity: ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
    await page.goto("/markdown-editor");
    await page.evaluate(() => document.fonts.ready);
    const editor = page.getByRole("textbox", { name: "In-place note", exact: true });
    const prose = page.getByLabel("Rendered note");
    await expect(editor).toBeVisible();
    await expect(editor.getByRole("img", { name: "Landscape study" })).toBeVisible();
    await expect(prose.getByRole("img", { name: "Landscape study" })).toBeVisible();
    await editor.focus();
    const chrome = await editor.evaluate(element => {
      const layers = [element, element.parentElement, element.parentElement?.parentElement];
      return layers
        .filter((node): node is HTMLElement => node instanceof HTMLElement)
        .map(node => {
          const style = getComputedStyle(node);
          return {
            background: style.backgroundColor,
            border: style.borderTopWidth,
            padding: style.padding,
            outline: style.outlineStyle,
            minHeight: style.minHeight,
            maxHeight: style.maxHeight,
            overflow: style.overflowY,
          };
        });
    });
    for (const style of chrome) {
      expect(style).toEqual({
        background: "rgba(0, 0, 0, 0)",
        border: "0px",
        padding: "0px",
        outline: "none",
        minHeight: "0px",
        maxHeight: "none",
        overflow: "visible",
      });
    }
    await editor.blur();
    const selectors = [
      "h1",
      ":scope > p:nth-of-type(1)",
      ":scope > p:nth-of-type(2)",
      "h2",
      ":scope > ul",
      "ul ul",
      ":scope > ol",
      "blockquote",
      "pre",
      "hr",
      ":scope > p:has(img[src])",
      "img[src]",
      ":scope > p:last-child",
    ];
    const measure = (root: Element, queries: string[]) => {
      const rootRect = root.getBoundingClientRect();
      return queries.map(selector => {
        const element = root.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          selector,
          top: rect.top - rootRect.top,
          height: rect.height,
          marginTop: style.marginTop,
          marginBottom: style.marginBottom,
        };
      });
    };
    const actual = await editor.evaluate(measure, selectors);
    const expected = await prose.evaluate(measure, selectors);
    const detail = (root: Element) => {
      const top = root.getBoundingClientRect().top;
      const items = [...root.querySelectorAll('input[type="checkbox"]')].map(input => input.closest("li")!);
      const rows = [...root.querySelectorAll("tr")];
      return [...items, ...rows].map(element => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top - top, height: rect.height };
      });
    };
    const editorDetails = await editor.evaluate(detail);
    const proseDetails = await prose.evaluate(detail);
    const cellPositions = (root: Element) => [...root.querySelectorAll("th, td")].map(cell => {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      const text = walker.nextNode();
      if (!text) throw new Error("Missing cell text");
      const range = document.createRange();
      range.selectNodeContents(text);
      const left = root.getBoundingClientRect().left;
      const bounds = cell.getBoundingClientRect();
      return {
        align: getComputedStyle(cell).textAlign,
        left: bounds.left - left,
        right: bounds.right - left,
        text: range.getBoundingClientRect().left - left,
      };
    });
    const editorCells = await editor.evaluate(cellPositions);
    const proseCells = await prose.evaluate(cellPositions);
    console.log(JSON.stringify({ theme, width: page.viewportSize()?.width, editorCells, proseCells }));
    expect(editorCells).toHaveLength(9);
    for (let i = 0; i < editorCells.length; i++) {
      expect(proseCells[i]!.align).toBe(editorCells[i]!.align);
      for (const key of ["left", "right", "text"] as const) {
        expect(Math.abs(editorCells[i]![key] - proseCells[i]![key])).toBeLessThanOrEqual(1);
      }
    }
    console.log(JSON.stringify({ theme, width: page.viewportSize()?.width, editorDetails, proseDetails }));
    expect(editorDetails).toHaveLength(6);
    expect(proseDetails).toHaveLength(6);
    const checkboxStyle = (root: Element) => [...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].map(input => {
      const style = getComputedStyle(input);
      return {
        checked: input.checked,
        background: style.backgroundColor,
        border: style.borderColor,
        width: style.width,
        height: style.height,
      };
    });
    expect(await editor.evaluate(checkboxStyle)).toEqual(await prose.evaluate(checkboxStyle));
    const checkboxOffsets = (root: Element) => [...root.querySelectorAll('input[type="checkbox"]')].map(input => (
      input.getBoundingClientRect().left - root.getBoundingClientRect().left
    ));
    const editorOffsets = await editor.evaluate(checkboxOffsets);
    const proseOffsets = await prose.evaluate(checkboxOffsets);
    for (let i = 0; i < editorOffsets.length; i++) expect(Math.abs(editorOffsets[i]! - proseOffsets[i]!)).toBeLessThanOrEqual(1);
    const checkboxVertical = (root: Element) => [...root.querySelectorAll('input[type="checkbox"]')].map(input => {
      const rect = input.getBoundingClientRect();
      return { top: rect.top - root.getBoundingClientRect().top, height: rect.height };
    });
    const editorVertical = await editor.evaluate(checkboxVertical);
    const proseVertical = await prose.evaluate(checkboxVertical);
    console.log(JSON.stringify({ theme, width: page.viewportSize()?.width, editorVertical, proseVertical }));
    for (let i = 0; i < editorVertical.length; i++) {
      expect(Math.abs(editorVertical[i]!.top - proseVertical[i]!.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(editorVertical[i]!.height - proseVertical[i]!.height)).toBeLessThanOrEqual(1);
    }
    const taskGlyphs = (root: Element) => [...root.querySelectorAll('input[type="checkbox"]')].map(input => {
      const item = input.closest("li")!;
      const walker = document.createTreeWalker(item.querySelector(":scope > div > p") ?? item, NodeFilter.SHOW_TEXT);
      let text: Node | null;
      while ((text = walker.nextNode())) {
        const index = text.textContent!.search(/\S/);
        if (index >= 0) {
          const range = document.createRange();
          range.setStart(text, index);
          range.setEnd(text, index + 1);
          return range.getBoundingClientRect().left - root.getBoundingClientRect().left;
        }
      }
      throw new Error("Missing task text");
    });
    const editorGlyphs = await editor.evaluate(taskGlyphs);
    const proseGlyphs = await prose.evaluate(taskGlyphs);
    console.log(JSON.stringify({ theme, width: page.viewportSize()?.width, editorGlyphs, proseGlyphs }));
    for (let i = 0; i < editorGlyphs.length; i++) expect(Math.abs(editorGlyphs[i]! - proseGlyphs[i]!)).toBeLessThanOrEqual(1);
    const remarkDetails = await prose.evaluate(root => {
      const clone = root.cloneNode(true);
      if (!(clone instanceof HTMLElement)) throw new Error("Expected a Prose element");
      clone.style.cssText = `position: fixed; visibility: hidden; width: ${root.getBoundingClientRect().width}px;`;
      for (const input of clone.querySelectorAll('input[type="checkbox"]')) {
        input.closest("li")?.classList.add("task-list-item");
        input.closest("ul")?.classList.add("contains-task-list");
      }
      document.body.append(clone);
      const top = clone.getBoundingClientRect().top;
      const left = clone.getBoundingClientRect().left;
      const result = [...clone.querySelectorAll('input[type="checkbox"]')].map(input => {
        const item = input.closest("li")!;
        const rect = item.getBoundingClientRect();
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
        let text: Node | null;
        let glyphLeft = NaN;
        while ((text = walker.nextNode())) {
          const index = text.textContent!.search(/\S/);
          if (index < 0) continue;
          const range = document.createRange();
          range.setStart(text, index);
          range.setEnd(text, index + 1);
          glyphLeft = range.getBoundingClientRect().left - left;
          break;
        }
        return { top: rect.top - top, height: rect.height, checkboxLeft: input.getBoundingClientRect().left - left, glyphLeft };
      });
      clone.remove();
      return result;
    });
    for (let i = 0; i < remarkDetails.length; i++) {
      expect(Math.abs(remarkDetails[i]!.top - proseDetails[i]!.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(remarkDetails[i]!.height - proseDetails[i]!.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(remarkDetails[i]!.checkboxLeft - proseOffsets[i]!)).toBeLessThanOrEqual(1);
      expect(Math.abs(remarkDetails[i]!.glyphLeft - editorGlyphs[i]!)).toBeLessThanOrEqual(1);
    }
    for (let i = 0; i < editorDetails.length; i++) {
      expect(Math.abs(editorDetails[i]!.top - proseDetails[i]!.top), `detail ${i} top`).toBeLessThanOrEqual(1);
      expect(Math.abs(editorDetails[i]!.height - proseDetails[i]!.height), `detail ${i} height`).toBeLessThanOrEqual(1);
    }
    await checkAccessibility(page, '[aria-label="In-place comparison"]');
    console.log(JSON.stringify({ theme, actual, expected }));
    for (let i = 0; i < selectors.length; i++) {
      expect(Math.abs(actual[i]!.top - expected[i]!.top), `${selectors[i]} top`).toBeLessThanOrEqual(1);
      expect(Math.abs(actual[i]!.height - expected[i]!.height), `${selectors[i]} height`).toBeLessThanOrEqual(1);
    }
    expect(actual[0]!.marginTop).toBe(expected[0]!.marginTop);
    expect(actual.at(-1)?.marginBottom).toBe(expected.at(-1)?.marginBottom);
    expect(Math.abs((await editor.boundingBox())!.height - (await prose.boundingBox())!.height)).toBeLessThanOrEqual(1);
    await editor.getByText("The final paragraph.").click();
    await page.keyboard.press("End");
    await page.keyboard.type("x");
    expect(Math.abs((await editor.boundingBox())!.height - (await prose.boundingBox())!.height)).toBeLessThanOrEqual(1);
    for (const root of [editor, prose]) {
      const soft = root.getByText("A soft line continues here.");
      const softHeight = (await soft.boundingBox())!.height;
      const lineHeight = await soft.evaluate(element => parseFloat(getComputedStyle(element).lineHeight));
      expect(softHeight).toBeCloseTo(lineHeight, 0);
      const code = root.locator("pre");
      await expect(code).toContainText("x".repeat(120));
      expect(await code.evaluate(element => ({
        whiteSpace: getComputedStyle(element).whiteSpace,
        overflows: element.scrollWidth > element.clientWidth,
      }))).toEqual({ whiteSpace: "pre", overflows: true });
    }
  });
}

test("the manual field shows starting Markdown and its current output", async ({ page, isMobile }) => {
  await page.goto("/markdown-editor");

  const editor = page.getByRole("textbox", { name: "Research note" });
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("aria-multiline", "true");
  await expect(editor.getByRole("heading", { name: "Field notes" })).toBeVisible();
  const output = page.getByLabel("Current Markdown", { exact: true });
  await expect(output).toContainText("## Field notes");
  await expect(output).toContainText("**bold**");
  await expect(output).toContainText("*italic*");

  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  const link = page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: "Markdown editor", exact: true });
  await expect(link).toHaveAttribute("href", "/markdown-editor");
  await expect(link).toHaveAttribute("aria-current", "page");
});

test("typed consecutive spaces stay visible and remain in Markdown", async ({ page, browserName }, testInfo) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("Alpha  beta   gamma");

  const output = page.getByLabel("Field states Markdown", { exact: true });
  const expected = browserName === "webkit" ? "Alpha \u00a0beta \u00a0 gamma" : "Alpha\u00a0 beta\u00a0 \u00a0gamma";
  await expect.poll(() => output.textContent()).toBe(expected);
  const widths = await editor.evaluate(element => {
    const textNode = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = textNode.nextNode();
    while (node && (!node.textContent?.includes("Alpha") || !node.textContent.includes("gamma"))) node = textNode.nextNode();
    if (!node) throw new Error("Typed text is not visible");
    const range = document.createRange();
    const measure = (start: number, length: number) => {
      range.setStart(node, start);
      range.setEnd(node, start + length);
      return range.getBoundingClientRect().width;
    };
    const style = getComputedStyle(element);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas measurement is unavailable");
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const content = node.textContent ?? "";
    const alpha = content.indexOf("Alpha");
    const beta = content.indexOf("beta", alpha + 1);
    const gamma = content.indexOf("gamma", beta + 1);
    if (alpha < 0 || beta < 0 || gamma < 0) throw new Error("Whitespace measurement words are missing");
    const firstStart = alpha + "Alpha".length;
    const secondStart = beta + "beta".length;
    return {
      one: context.measureText(" ").width,
      two: measure(firstStart, beta - firstStart),
      three: measure(secondStart, gamma - secondStart),
    };
  });
  expect(widths.two).toBeGreaterThan(widths.one * 1.75);
  expect(widths.three).toBeGreaterThan(widths.one * 2.75);
  await editor.screenshot({ path: testInfo.outputPath("consecutive-spaces.png") });
});

test("a typed line break stays inside a paragraph", async ({ page, browserName }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("Alpha");
  await editor.press(browserName === "webkit" ? "ControlOrMeta+Enter" : "Shift+Enter");
  await editor.pressSequentially("Beta");

  await expect.poll(() => editor.evaluate(element => {
    if (!(element instanceof HTMLElement)) throw new Error("The editor must be an HTML element");
    return element.innerText;
  })).toBe("Alpha\nBeta");
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await expect.poll(() => output.textContent()).toBe("Alpha  \nBeta");
});

test("a soft line break in starting Markdown does not force a visual break", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  const paragraph = editor.getByText("This soft line wraps like rendered Markdown.", { exact: true });
  await expect(paragraph).toBeVisible();

  const lineHeight = await paragraph.evaluate(element => Number.parseFloat(getComputedStyle(element).lineHeight));
  const bounds = await paragraph.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.height).toBeCloseTo(lineHeight, 1);
});

test("typed formatting works in the browser", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await editor.click();
  await editor.pressSequentially("### Browser");
  await expect.poll(() => output.textContent()).toBe("### Browser");
  await selectEditorContents(editor);
  await editor.press("ControlOrMeta+B");
  await expect.poll(() => output.textContent()).toBe("### **Browser**");
});

test("the editor keeps keyboard focus order and passes accessibility checks", async ({ page, browserName }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });
  const existingPost = page.getByRole("textbox", { name: "Existing post" });
  const tabForward = browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
  const tabBackward = browserName === "webkit" && process.platform === "darwin" ? "Alt+Shift+Tab" : "Shift+Tab";
  await editor.focus();
  await expect(editor).toBeFocused();
  await page.keyboard.press(tabForward);
  await expect(existingPost).toBeFocused();
  await page.keyboard.press(tabForward);
  await expect(page.getByRole("button", { name: "Read-only" })).toBeFocused();
  await page.keyboard.press(tabBackward);
  await expect(existingPost).toBeFocused();
  await page.keyboard.press(tabBackward);
  await expect(editor).toBeFocused();

  const code = page.getByRole("textbox", { name: "In-place code ending" }).locator("pre");
  await expect(code).not.toHaveAttribute("tabindex");

  await checkAccessibility(page);
});

test("the manual page mounts without hydration warnings or browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/markdown-editor");
  await expect(page.getByRole("textbox", { name: "Research note" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Markdown editor", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the starting fixture renders every supported construct formatted", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });

  await expect(editor.getByRole("heading", { name: "Field notes" })).toBeVisible();
  await expect(editor.getByRole("list").filter({ hasText: "Bullet one" })).toBeVisible();
  await expect(editor.getByText("Nested", { exact: true })).toBeVisible();
  await expect(editor.getByRole("blockquote")).toContainText("A quote");
  await expect(editor.locator("pre code")).toContainText("const x = 1;");
  await expect(editor.locator("pre code")).toHaveClass(/language-ts/);
  await expect(editor.locator("hr")).toBeVisible();
  await expect(editor.getByRole("link", { name: "link" })).toHaveAttribute("href", "https://anaphor.dev");
  await expect(editor.getByText("strike", { exact: true })).toBeVisible();
  await expect(editor.getByText("code", { exact: true })).toBeVisible();

  const output = page.getByLabel("Current Markdown", { exact: true });
  await expect(output).toContainText("```ts");
  await expect(output).toContainText("> A quote");
  await expect(output).toContainText("[link](https://anaphor.dev)");
});

test("a fenced code block keeps white-space: pre and scrolls instead of wrapping", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Research note" });

  await expect(editor.locator("pre").first()).toBeVisible();
  expect(await editor.locator("pre").first().evaluate(element => getComputedStyle(element).whiteSpace)).toBe("pre");

  const emptyEditor = page.getByRole("textbox", { name: "Notes" });
  await emptyEditor.click();
  await emptyEditor.pressSequentially("``` ");
  await emptyEditor.pressSequentially(`const x = ${"a".repeat(160)};`);
  const pre = emptyEditor.locator("pre");
  await expect(pre).toBeVisible();
  const { whiteSpace, scrolls } = await pre.evaluate(element => ({
    whiteSpace: getComputedStyle(element).whiteSpace,
    scrolls: element.scrollWidth > element.clientWidth,
  }));
  expect(whiteSpace).toBe("pre");
  expect(scrolls).toBe(true);
});

test("the existing post hides front matter and shows opaque blocks in both themes", async ({ page }, testInfo) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Existing post" });

  await expect(editor.getByRole("heading", { name: "An existing post" })).toBeVisible();
  await expect(editor).not.toContainText('title: "An existing post"');
  await expect(editor).not.toContainText("draft: true");

  const block = editor.getByText("[^1]: The note text.", { exact: true });
  await expect(block).toBeVisible();

  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    const fontFamily = await block.evaluate(element => getComputedStyle(element).fontFamily);
    expect(fontFamily).toContain("mono");
    await block.screenshot({ path: testInfo.outputPath(`opaque-block-${dark ? "dark" : "light"}.png`) });
  }
});

test("opaque inline source follows the Prose code size token", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Existing post" });
  const source = editor.getByText("[^1]", { exact: true });
  await expect(source).toBeVisible();
  expect(await source.evaluate(element => getComputedStyle(element).fontSize)).toBe("14px");
  await editor.evaluate(element => element.style.setProperty("--text-prose-code", "1em"));
  expect(await source.evaluate(element => getComputedStyle(element).fontSize)).toBe("16px");
});

test("an opaque block is selected and deleted as a whole", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Existing post" });
  const output = page.getByLabel("Existing post Markdown", { exact: true });

  const block = editor.getByText("[^1]: The note text.", { exact: true });
  await expect(block).toHaveText("[^1]: The note text.");
  await block.click();
  await editor.press("Delete");

  await expect(block).toHaveCount(0);
  await expect(output).not.toContainText("[^1]: The note text.");
  await expect(output).toContainText("Raw HTML");
  await expect(output).toContainText("A note with a footnote.[^1]");

  await editor.press("ControlOrMeta+z");
  await expect(block).toBeVisible();
  await expect(output).toContainText("[^1]: The note text.");
});

test("an opaque block's text cannot be edited in place", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Existing post" });
  const output = page.getByLabel("Existing post Markdown", { exact: true });
  const block = editor.getByText("[^1]: The note text.", { exact: true });

  await block.click();
  await editor.press("z");
  await expect(block).toHaveCount(0);
  await expect(output).not.toContainText("[^1]: The note text.");
});

for (const theme of ["light", "dark"]) test(`updates the placeholder after mount: ${theme}`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
  await page.goto("/markdown-editor-fixture");
  const editor = page.getByRole("textbox", { name: "Placeholder fixture" });
  const content = () => editor.locator("p").first().evaluate(element => getComputedStyle(element, "::before").content);
  await expect.poll(content).toBe('"First placeholder"');
  await page.getByRole("button", { name: "Change placeholder" }).click();
  await expect.poll(content).toBe('"Second placeholder"');
  await editor.click();
  await editor.pressSequentially("Draft");
  await expect.poll(content).not.toBe('"Second placeholder"');
});

test("the empty field shows the placeholder and keeps one Prose line of content", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const placeholder = () => editor.locator("p").first().evaluate(element => getComputedStyle(element, "::before").content);
  await expect.poll(placeholder).toBe('"Write a note…"');

  const { contentHeight, lineHeight } = await editor.evaluate(element => {
    if (!(element instanceof HTMLElement)) throw new Error("The editor must be an HTML element");
    return {
      contentHeight: element.offsetHeight,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
    };
  });
  expect(contentHeight).toBeLessThan(lineHeight * 1.5);

  await editor.click();
  await editor.pressSequentially("Draft");
  await expect.poll(placeholder).not.toBe('"Write a note…"');
});

test("the field inside Field is named by its label and associated with its feedback", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await expect(editor).toHaveAttribute("aria-labelledby", "notes-label");
  await expect(editor).toHaveAttribute("aria-describedby", "notes-feedback");

  await page.getByRole("button", { name: "Error" }).click();
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(frame).toHaveAttribute("data-invalid", "true");
  await expect(frame).not.toHaveAttribute("aria-invalid");
});

test("the field passes accessibility checks in both themes", async ({ page }) => {
  await page.goto("/markdown-editor");
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    await checkAccessibility(page, '[aria-label="Field states"]');
  }
});

test("read-only prevents typing but allows focus", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Read-only" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  await expect(editor).toHaveAttribute("aria-readonly", "true");

  await editor.click();
  await expect(editor).toBeFocused();
  await editor.pressSequentially("ignored");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("");
});

test("overflowing code is keyboard accessible across read-only transitions", async ({ page, browserName }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("```", { delay: 0 });
  await editor.press("Enter");
  await editor.pressSequentially("x".repeat(150), { delay: 0 });
  const code = editor.locator("pre");
  await expect(code).not.toHaveAttribute("tabindex");
  expect(await code.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Read-only", exact: true }).click();
  await expect(code).toHaveAttribute("tabindex", "0");
  await editor.focus();
  await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
  await expect(code).toBeFocused();
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    await checkAccessibility(page, '[role="textbox"][aria-readonly="true"]');
  }
  await page.getByRole("button", { name: "Read-only", exact: true }).click();
  await expect(code).not.toHaveAttribute("tabindex");
});

test("read-only autofocus and frame padding focus the editor", async ({ page, isMobile }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Toggle autofocus example" }).click();
  const editor = page.getByRole("textbox", { name: "Read-only autofocus example" });
  await expect(editor).toBeFocused();
  await expect.poll(() => editor.evaluate(element => {
    const selection = window.getSelection();
    if (!selection?.anchorNode) return "";
    const range = document.createRange();
    range.selectNodeContents(element);
    range.setEnd(selection.anchorNode, selection.anchorOffset);
    return range.toString();
  })).toBe("Read-only example");
  await page.getByRole("button", { name: "Read-only", exact: true }).click();
  const notes = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: notes });
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  if (!box) throw new Error("Frame has no bounding box");
  if (isMobile) await page.touchscreen.tap(box.x + 5, box.y + 5);
  else await page.mouse.click(box.x + 5, box.y + 5);
  await expect(notes).toBeFocused();
});

test("read-only text can be selected and copied", async ({ page, context, browserName }) => {
  if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  await page.getByRole("button", { name: "Read-only", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.press("ControlOrMeta+a");
  expect(await page.evaluate(() => window.getSelection()?.toString())).toContain("A loaded note");
  const copied = page.evaluate(() => new Promise<boolean>((resolve) => {
    document.addEventListener("copy", (event) => {
      queueMicrotask(() => resolve(event.defaultPrevented));
    }, { once: true });
  }));
  await editor.press("ControlOrMeta+c");
  expect(await copied).toBe(false);
  if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("A loaded note");
});

test("dragging inside a field selects text without padding focus interference", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  const text = page.getByRole("textbox", { name: "Notes" }).getByText("A loaded note");
  await text.scrollIntoViewIfNeeded();
  const box = await text.boundingBox();
  if (!box) throw new Error("Text has no bounding box");
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  expect((await page.evaluate(() => window.getSelection()?.toString()))?.toLowerCase()).toContain("loaded note");
});

test("an opaque block in a field is selected whole and padding focuses after it", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  const block = editor.getByText("<!-- Field note -->");
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await editor.focus();
  await block.click();
  await editor.press("Delete");
  await expect(output).not.toContainText("<!-- Field note -->");
  await editor.press("ControlOrMeta+z");
  await expect(output).toContainText("<!-- Field note -->");
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  if (!box) throw new Error("Frame has no bounding box");
  await page.mouse.click(box.x + box.width - 5, box.y + box.height - 5);
  await expect(editor).toBeFocused();
  await page.keyboard.type("x");
  await expect(output).toHaveText("## A loaded note\n\nLoaded with `setMarkdown`.\n\n<!-- Field note -->\n\nx");
});

test("padding after a final code block starts a paragraph", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("``` ");
  await editor.pressSequentially("code");
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  if (!box) throw new Error("Frame has no bounding box");
  await page.mouse.click(box.x + box.width - 5, box.y + box.height - 5);
  await expect(editor).toBeFocused();
  await page.keyboard.type("x");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("```\ncode\n```\n\nx");
});

test("keyboard reaches the gap after a final opaque block", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Load another note" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.focus();
  await editor.getByText("<!-- Field note -->").click();
  await editor.press("ArrowDown");
  await page.keyboard.type("x");
  const output = page.getByLabel("Field states Markdown", { exact: true });
  await expect(output).toHaveText("## A loaded note\n\nLoaded with `setMarkdown`.\n\n<!-- Field note -->\n\nx");
});

test("keyboard reaches the gap after a final code block", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  await editor.click();
  await editor.pressSequentially("``` code");
  await editor.press("ArrowRight");
  await page.keyboard.type("x");
  await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText("```\ncode\n```\n\nx");
});

test("frame matches Input states and surfaces in both themes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  const input = page.getByRole("textbox", { name: "Input comparison" });
  const styles = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      border: style.borderTopColor,
      outline: style.outlineColor,
      outlineWidth: style.outlineWidth,
      background: style.backgroundColor,
    };
  };
  for (const dark of [false, true]) {
    await page.locator("html").evaluate((element, value) => element.classList.toggle("dark", value), dark);
    const normal = {
      frame: await frame.evaluate(styles),
      input: await input.evaluate(styles),
      page: await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor),
    };
    expect(normal.frame.border).toBe(normal.input.border);
    expect(normal.frame.background).toBe(normal.input.background);
    expect(normal.frame.background).toBe(normal.page);
    await editor.focus();
    const focusFrame = await frame.evaluate(styles);
    await input.focus();
    const focusInput = await input.evaluate(styles);
    expect(focusFrame.border).toBe(focusInput.border);
    expect(focusFrame.outline).toBe(focusInput.outline);
    expect(focusFrame.outlineWidth).toBe(focusInput.outlineWidth);
    await page.getByRole("button", { name: "Error", exact: true }).click();
    const invalidFrame = await frame.evaluate(styles);
    const invalidInput = await input.evaluate(styles);
    expect(invalidFrame.border).toBe(invalidInput.border);
    await page.getByRole("button", { name: "Error", exact: true }).click();
    await page.getByRole("button", { name: "Disabled", exact: true }).click();
    const disabledFrame = await frame.evaluate(styles);
    const disabledInput = await input.evaluate(styles);
    expect(disabledFrame.background).toBe(disabledInput.background);
    const token = await frame.evaluate(element => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--anaphor-input-disabled)";
      element.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    expect(disabledFrame.background).toBe(token);
    console.log(JSON.stringify({
      theme: dark ? "dark" : "light",
      normal,
      focusFrame,
      focusInput,
      invalidFrame,
      invalidInput,
      disabledFrame,
      disabledInput,
      token,
    }));
    await page.getByRole("button", { name: "Disabled", exact: true }).click();
  }
});

test("disabled removes focus and interaction", async ({ page }) => {
  await page.goto("/markdown-editor");
  await page.getByRole("button", { name: "Disabled" }).click();
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });
  await expect(editor).toHaveAttribute("aria-disabled", "true");
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await expect(editor).not.toHaveAttribute("tabindex");

  const box = await frame.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(editor).not.toBeFocused();
});

test("setMarkdown loads and discards notes without firing a change", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const output = page.getByLabel("Field states Markdown", { exact: true });

  await editor.click();
  await editor.pressSequentially("Unsaved edit");
  await expect(output).toContainText("Unsaved edit");

  await page.getByRole("button", { name: "Load another note" }).click();
  await expect(editor.getByRole("heading", { name: "A loaded note" })).toBeVisible();
  await expect(output).toContainText("setMarkdown");

  await editor.press("ControlOrMeta+z");
  await expect(editor.getByRole("heading", { name: "A loaded note" })).toBeVisible();

  await page.getByRole("button", { name: "Discard edits" }).click();
  const placeholder = () => editor.locator("p").first().evaluate(element => getComputedStyle(element, "::before").content);
  await expect.poll(placeholder).toBe('"Write a note…"');
});

test("the field keeps the input boundary and grows from the minimum to the maximum then scrolls", async ({ page }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });

  expect(await frame.evaluate(element => getComputedStyle(element).minHeight)).toBe("96px");
  expect(await frame.evaluate(element => getComputedStyle(element).maxHeight)).toBe("288px");
  expect(await frame.evaluate(element => element.getBoundingClientRect().height)).toBe(96);

  await editor.click();
  for (let i = 1; i <= 15; i += 1) {
    if (i > 1) await editor.press("Enter");
    await editor.pressSequentially(`Line ${i}`);
  }
  const grown = await frame.evaluate(element => ({
    height: element.getBoundingClientRect().height,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(grown.height).toBe(288);
  expect(grown.scrollHeight).toBeGreaterThan(grown.clientHeight);
});

test("clicking padding places the caret at the end", async ({ page, isMobile }) => {
  await page.goto("/markdown-editor");
  const editor = page.getByRole("textbox", { name: "Notes" });
  const frame = page.locator('[data-slot="markdown-editor"]').filter({ has: editor });

  for (const position of ["top-left", "middle-right", "bottom-right"]) {
    await page.getByRole("button", { name: "Discard edits" }).click();
    await editor.click();
    await page.keyboard.type("Draft");
    await page.getByRole("button", { name: "Read-only", exact: true }).focus();
    await frame.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
    const box = await frame.boundingBox();
    if (!box) throw new Error("Frame has no bounding box");
    const x = position === "top-left" ? box.x + 5 : box.x + box.width - 5;
    const y = position === "top-left" ? box.y + 5 : position === "middle-right" ? box.y + box.height / 2 : box.y + box.height - 5;
    if (isMobile) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await expect(editor).toBeFocused();
    await page.keyboard.type(position);
    await expect(page.getByLabel("Field states Markdown", { exact: true })).toHaveText(`Draft${position}`);
  }
});
