import { expect, test } from "@playwright/test";

for (const preference of [
  { name: "saved dark", saved: "dark", system: "light", expected: "dark" },
  { name: "system dark", saved: null, system: "dark", expected: "dark" },
  { name: "saved light", saved: "light", system: "dark", expected: "light" },
] as const) {
  test(`foundations preserve ${preference.name} before and after hydration`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.emulateMedia({ colorScheme: preference.system, reducedMotion: "reduce" });
    await page.addInitScript(saved => {
      if (saved === null) localStorage.removeItem("anaphor-theme");
      else localStorage.setItem("anaphor-theme", saved);
    }, preference.saved);

    let releaseHydration = () => {};
    const hydration = new Promise<void>(resolve => { releaseHydration = resolve; });
    await page.route("**/_next/**/*.js", async route => {
      await hydration;
      await route.continue();
    });

    const active = page.getByTestId(`foundation-${preference.expected}`);
    const oppositeTheme = preference.expected === "dark" ? "light" : "dark";
    const opposite = page.getByTestId(`foundation-${oppositeTheme}`);
    let before: { x: number; y: number; width: number; height: number } | null = null;
    try {
      await page.goto("/foundations", { waitUntil: "commit" });
      await expect(active).toBeVisible();
      await expect(opposite).toBeHidden();
      await expect(active.getByRole("heading", { name: `${preference.expected} theme` })).toBeVisible();
      await expect(page.getByRole("heading", { name: `${oppositeTheme} theme` })).toHaveCount(0);
      await page.evaluate(() => Promise.all(Array.from(document.fonts, face => face.load())));
      before = await active.locator("dl").first().boundingBox();
      expect(before?.height).toBeGreaterThan(500);
    } finally {
      releaseHydration();
    }

    await expect(page.getByRole("button", { name: `Switch to ${oppositeTheme} theme` })).toBeEnabled();
    await expect(active).not.toContainText("Measuring…");
    await expect(active.getByTestId("contrast-result").first()).toContainText("Pass");
    const after = await active.locator("dl").first().boundingBox();
    expect(after).toEqual(before);

    const compare = page.getByRole("checkbox", { name: "Compare themes" });
    await compare.check();
    await expect(opposite).toBeVisible();
    await expect(opposite).not.toContainText("Measuring…");
    await expect(opposite.getByTestId("contrast-result").last()).toContainText("Exception");
    await compare.uncheck();
    await expect(opposite).toBeHidden();

    if (preference.saved === null) {
      await page.emulateMedia({ colorScheme: "light" });
      await expect(opposite).toBeVisible();
      await expect(active).toBeHidden();
      expect(await page.evaluate(() => localStorage.getItem("anaphor-theme"))).toBeNull();
    } else {
      await page.getByRole("button", { name: `Switch to ${oppositeTheme} theme` }).click();
      await expect(opposite).toBeVisible();
      await expect(active).toBeHidden();
      await page.getByRole("button", { name: `Switch to ${preference.expected} theme` }).click();
      await expect(active).toBeVisible();
      await expect(opposite).toBeHidden();
    }
    expect(errors).toEqual([]);
  });
}
