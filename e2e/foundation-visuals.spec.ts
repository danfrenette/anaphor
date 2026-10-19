import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const title of ["Shadows", "Spacing", "Radius"]) {
  for (const theme of ["light", "dark"]) {
    test(`${title} reference is navigable and readable in ${theme}`, async ({ page, isMobile }) => {
      await page.addInitScript(value => localStorage.setItem("anaphor-theme", value), theme);
      await page.goto("/");
      if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
      await page.getByRole("navigation", { name: "Manual index" }).getByRole("link", { name: title, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${title.toLowerCase()}$`));
      if (isMobile) await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await expect(page.locator('[data-slot="workspace-card-header"]').first()).toHaveText(`Foundations/${title}`);
      const main = page.getByRole("main");
      expect(await main.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
      if (title === "Spacing") {
        await expect(main.getByText("gap-24", { exact: true })).toBeVisible();
        await expect(main.getByText("96px", { exact: true })).toBeVisible();
      } else if (title === "Radius") {
        await expect(main.getByText("rounded-control", { exact: true })).toBeVisible();
      } else {
        await expect(main.getByText("--anaphor-shadow-menu", { exact: true })).toBeVisible();
      }
    });
  }
}
