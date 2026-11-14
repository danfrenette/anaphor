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
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  async function sample(label: string) {
    const before = await section.locator("h3").last().textContent();
    const restingLeft = (await section.locator("h3").last().boundingBox())!.x;
    await section.getByRole("button", { name: label, exact: true }).evaluate((button: HTMLButtonElement) => button.click());
    await expect(section.locator('[data-slot="step-transition"] [inert]')).toHaveCount(1);
    await page.clock.runFor(100);
    return section.evaluate((element, { before, restingLeft }) => {
      const surface = element.querySelector('[data-slot="step-transition"]')!;
      const headings = [...surface.querySelectorAll("h3")];
      const incoming = headings.find(heading => heading.textContent !== before)!;
      const outgoing = headings.find(heading => heading.textContent === before)!;
      return { incoming: incoming.getBoundingClientRect().left - restingLeft,
        outgoing: outgoing.getBoundingClientRect().left - restingLeft,
        inert: Boolean(outgoing.closest("[inert]")) };
    }, { before, restingLeft });
  }
  const forward = await sample("Continue");
  expect(forward.incoming).toBeGreaterThan(0);
  expect(forward.outgoing).toBeLessThan(0);
  expect(forward.inert).toBe(true);
  await page.clock.runFor(1000);
  await expect(section.locator('[data-slot="step-transition"] [inert]')).toHaveCount(0);
  const backward = await sample("Back");
  expect(backward.incoming).toBeLessThan(0);
  expect(backward.outgoing).toBeGreaterThan(0);
  expect(backward.inert).toBe(true);
});

test("rapid reversal settles on the latest step and scaled ancestors do not clip content", async ({ page }) => {
  await page.goto("/#step-transition");
  const section = page.locator("#step-transition");
  const surface = section.locator('[data-slot="step-transition"]');
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  for (const label of ["Continue", "Back", "Continue"]) {
    await section.getByRole("button", { name: label, exact: true }).evaluate((button: HTMLButtonElement) => button.click());
    await expect(section.getByRole("heading", { name: label === "Back" ? "Choose the evidence" : "Explain the change" })).toBeVisible();
    await page.clock.runFor(80);
  }
  await page.clock.runFor(1000);
  await page.clock.resume();
  await expect(section.getByRole("heading", { name: "Explain the change" })).toBeVisible();
  await expect(surface.locator("[inert]")).toHaveCount(0);
  await section.evaluate(el => { el.style.transform = "scale(0.8)"; });
  await section.getByRole("button", { name: "Expand explanation" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(section.getByRole("button", { name: "Hide explanation" })).toBeVisible();
  await expect.poll(() => surface.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  await section.evaluate(el => { el.style.transform = ""; });
  const bounds = await surface.evaluate(el => ({ height: el.clientHeight, content: el.scrollHeight }));
  expect(bounds.height).toBeGreaterThanOrEqual(bounds.content - 1);
});
