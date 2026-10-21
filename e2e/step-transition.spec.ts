import { expect, test } from "@playwright/test";

test("ordered content advances, reverses, and follows same-step height changes", async ({ page }) => {
  await page.goto("/#step-transition");
  const section = page.locator("#step-transition");
  const surface = section.locator('[data-slot="step-transition"]');
  await expect(section.getByRole("heading", { name: "Choose the evidence" })).toBeVisible();
  const firstHeight = (await surface.boundingBox())!.height;
  await section.getByRole("button", { name: "Expand explanation" }).click();
  await expect.poll(async () => (await surface.boundingBox())!.height).toBeGreaterThan(firstHeight + 20);
  await section.getByRole("button", { name: "Continue" }).click();
  await expect(section.getByRole("heading", { name: "Explain the change" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Choose the evidence" })).toHaveCount(0);
  await section.getByRole("button", { name: "Back", exact: true }).click();
  await expect(section.getByRole("heading", { name: "Choose the evidence" })).toBeVisible();
  await expect(section.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
});

test("reduced-motion navigation settles without animated content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#step-transition");
  const section = page.locator("#step-transition");
  await section.getByRole("button", { name: "Continue" }).click();
  await expect(section.getByRole("heading", { name: "Explain the change" })).toBeVisible();
  await expect(section.locator('[data-slot="step-transition"] [inert]')).toHaveCount(0);
});


test("forward and backward travel enter from opposite sides and outgoing content is inert", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#step-transition");
  const section = page.locator("#step-transition");
  async function sample(label: string) {
    return section.evaluate(async (element, label) => {
      const surface = element.querySelector('[data-slot="step-transition"]')!;
      const before = surface.querySelector("h3")!.textContent;
      const button = [...element.querySelectorAll("button")].find(button => button.textContent === label)!;
      button.click();
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const headings = [...surface.querySelectorAll("h3")];
      const incoming = headings.find(heading => heading.textContent !== before)!;
      const outgoing = headings.find(heading => heading.textContent === before)!;
      return { incoming: incoming.getBoundingClientRect().left - surface.getBoundingClientRect().left,
        outgoing: outgoing.getBoundingClientRect().left - surface.getBoundingClientRect().left,
        inert: Boolean(outgoing.closest("[inert]")) };
    }, label);
  }
  const forward = await sample("Continue");
  expect(forward.incoming).toBeGreaterThan(20);
  expect(forward.outgoing).toBeLessThan(0);
  expect(forward.inert).toBe(true);
  await expect(section.locator('[data-slot="step-transition"] [inert]')).toHaveCount(0);
  const backward = await sample("Back");
  expect(backward.incoming).toBeLessThan(0);
  expect(backward.outgoing).toBeGreaterThan(8);
  expect(backward.inert).toBe(true);
});
