import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("danger text meets AA on page and card backgrounds in both themes", async ({ page }) => {
  await page.goto("/#input");
  for (const dark of [false, true]) {
    for (const background of ["--dl-background", "--dl-foreground"]) {
      await page.evaluate(({ dark, background }) => {
        document.documentElement.classList.toggle("dark", dark);
        document.getElementById("contrast-probe")?.remove();
        const sample = document.createElement("div");
        sample.id = "contrast-probe";
        sample.style.cssText = `position:fixed;inset:0 auto auto 0;z-index:9999;padding:20px;font-size:14px;background:var(${background});color:var(--dl-danger-text);`;
        sample.textContent = "Enter a complete email address.";
        document.body.append(sample);
      }, { dark, background });
      const result = await new AxeBuilder({ page }).include("#contrast-probe").withRules(["color-contrast"]).analyze();
      expect(result.violations).toEqual([]);
      expect(result.incomplete).toEqual([]);
      expect(result.passes.some((rule) => rule.id === "color-contrast" && rule.nodes.length > 0)).toBe(true);
    }
  }
});
