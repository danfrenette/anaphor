import { expect, test } from "@playwright/test";
import { selectControl } from "./playground-select";

test("card catalog exposes examples, code, and the existing playground", async ({ page }) => {
  await page.goto("/#card");
  const section = page.locator("#card");
  for (const name of ["Anatomy", "Actions & footers", "Edge-to-edge content", "Showcase", "Playground"]) {
    await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  const showcase = section.getByRole("region", { name: "Showcase", exact: true });
  await expect(showcase.getByRole("heading", { name: "Anaphor", exact: true })).toBeVisible();
  const trigger = section.getByRole("button", { name: "Show anatomy code" });
  await trigger.press("Enter");
  await expect(section.getByLabel("Anatomy code", { exact: true })).toBeVisible();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("tab", { name: "Open Card controls" }).click();
  await selectControl(page, "Variant", "showcase");
  const playground = page.locator('[aria-labelledby="card-project-title"]');
  await expect(playground).toHaveAttribute("data-variant", "showcase");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(playground).toHaveAttribute("data-variant", "default");
  await page.getByRole("button", { name: "Close controls" }).click();
  expect(await section.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
