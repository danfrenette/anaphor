import { expect, test } from "@playwright/test";

for (const route of ["/studies", "/studies/signal", "/studies/field-notes"]) {
  test(`retired study ${route} is no longer a public page`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
  });
}
