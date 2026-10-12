import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { tourTestEnv } from "./tour-env";

const revision = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const title = "Publish the private tour";

const tourDocument = {
  schemaVersion: 1,
  title,
  overview: "Dan can read a tour that an agent published.",
  provenance: [
    {
      repository: "danfrenette/anaphor",
      pullRequest: 12,
      revision,
    },
  ],
  sections: [
    {
      id: "reader",
      heading: "What changed",
      body: "The manual stays public while the tour stays private.",
    },
  ],
};

function agentHeaders() {
  return { authorization: `Bearer ${tourTestEnv.TOUR_AGENT_TOKEN}` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function publishedTour(value: unknown): { id: string; url: string } {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.url !== "string") {
    throw new Error("Publication did not return a tour id and url.");
  }
  return { id: value.id, url: value.url };
}

function diagnosticsOf(value: unknown): { path: string; message: string }[] {
  if (!isRecord(value) || !Array.isArray(value.diagnostics)) return [];
  return value.diagnostics.flatMap((item) => {
    if (!isRecord(item) || typeof item.path !== "string" || typeof item.message !== "string") return [];
    return [{ path: item.path, message: item.message }];
  });
}

async function publishTour(request: APIRequestContext, document: unknown = tourDocument) {
  return request.post("/api/tours", { headers: agentHeaders(), data: document });
}

async function signIn(page: Page, name: "Sign in as Dan" | "Sign in as another account") {
  await page.getByRole("link", { name }).click();
}

test("an agent publishes a tour and Dan reads it after signing in", async ({ page, request }) => {
  const published = await publishTour(page.request);
  expect(published.status()).toBe(201);
  const body = publishedTour(await published.json());
  expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  expect(body.url).toBe(`http://127.0.0.1:3105/tour/${body.id}`);

  const signedOut = await request.get(`/api/tours/${body.id}`);
  expect(signedOut.status()).toBe(401);
  expect(signedOut.headers()["www-authenticate"] ?? "").not.toContain(tourTestEnv.TOUR_AGENT_TOKEN);
  const signedOutBody = await signedOut.text();
  expect(signedOutBody).not.toContain(title);
  expect(signedOutBody).not.toContain(revision);
  expect(signedOutBody).not.toContain(tourTestEnv.TOUR_AGENT_TOKEN);
  expect(signedOutBody).toContain("unauthenticated");

  await page.goto(`/tour/${body.id}`);
  await expect(page.getByRole("heading", { name: "Sign in to read this tour" })).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Manual index" })).toHaveCount(0);
  expect(await page.content()).not.toContain(tourTestEnv.TOUR_AGENT_TOKEN);
  expect(await page.content()).not.toContain(tourTestEnv.TOUR_SESSION_SECRET);

  await signIn(page, "Sign in as Dan");
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText("Dan can read a tour that an agent published.")).toBeVisible();
  await expect(page.getByText("danfrenette/anaphor pull request 12")).toBeVisible();
  await expect(page.getByText(revision)).toBeVisible();
  await expect(page.getByRole("heading", { name: "What changed" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Tour sections" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Manual index" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  const stored = await page.request.get(`/api/tours/${body.id}`);
  expect(stored.status()).toBe(200);
  expect(await stored.json()).toMatchObject(tourDocument);
  expect(stored.headers()["cache-control"]).toContain("no-store");
});

test("signed-out and unauthorized accounts cannot publish or read a tour", async ({ page, request }) => {
  const published = await publishTour(request);
  expect(published.status()).toBe(201);
  const { id, url } = publishedTour(await published.json());

  const missingCredential = await request.post("/api/tours", { data: tourDocument });
  expect(missingCredential.status()).toBe(401);
  const missingBody = await missingCredential.json();
  expect(missingBody).toMatchObject({ error: "unauthenticated" });
  expect(missingBody.id).toBeUndefined();
  expect(missingBody.url).toBeUndefined();

  const wrongToken = `${tourTestEnv.TOUR_AGENT_TOKEN}-wrong`;
  const wrongCredential = await request.post("/api/tours", {
    headers: { authorization: `Bearer ${wrongToken}` },
    data: tourDocument,
  });
  expect(wrongCredential.status()).toBe(401);
  expect(await wrongCredential.text()).not.toContain(wrongToken);

  await page.goto(url);
  await signIn(page, "Sign in as another account");
  await expect(page.getByRole("heading", { name: "You cannot read this tour" })).toBeVisible();
  await expect(page.getByText("not allowed to read private tours")).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);
  await expect(page.getByText(revision)).toHaveCount(0);

  const forbiddenRead = await page.request.get(`/api/tours/${id}`);
  expect(forbiddenRead.status()).toBe(403);
  const forbiddenReadBody = await forbiddenRead.text();
  expect(forbiddenReadBody).toContain("forbidden");
  expect(forbiddenReadBody).not.toContain(title);
  expect(forbiddenReadBody).not.toContain("unauthenticated");

  const headerBeatsCookie = await page.request.post("/api/tours", {
    headers: { authorization: "Bearer not-the-agent-token" },
    data: tourDocument,
  });
  expect(headerBeatsCookie.status()).toBe(401);

  const forbiddenWrite = await page.request.post("/api/tours", { data: tourDocument });
  expect(forbiddenWrite.status()).toBe(403);
  const forbiddenWriteBody = await forbiddenWrite.json();
  expect(forbiddenWriteBody).toMatchObject({ error: "forbidden" });
  expect(forbiddenWriteBody.id).toBeUndefined();

  await page.goto("/tour/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "You cannot read this tour" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This tour is unavailable" })).toHaveCount(0);
});

test("invalid publication returns diagnostics and no readable tour", async ({ page, request }) => {
  const secretOverview = {
    ...tourDocument,
    title: "Credential tour",
    overview: `prefix ${tourTestEnv.TOUR_AGENT_TOKEN} suffix`,
  };
  const leaked = await publishTour(request, secretOverview);
  expect(leaked.status()).toBe(422);
  const leakedBody = await leaked.text();
  expect(leakedBody).not.toContain(tourTestEnv.TOUR_AGENT_TOKEN);
  expect(leakedBody).toContain("overview");
  expect(leakedBody).not.toContain("Credential tour");

  const invalid = await publishTour(request, {
    schemaVersion: 2,
    title: "Partial tour should not publish",
    overview: "",
    provenance: [],
    sections: [{ id: "overview", heading: "", body: "   " }],
    unexpected: "<script>alert(1)</script>",
  });
  expect(invalid.status()).toBe(422);
  const invalidJson: unknown = await invalid.json();
  expect(invalidJson).toMatchObject({ error: "invalid_tour" });
  expect(isRecord(invalidJson) ? invalidJson.id : undefined).toBeUndefined();
  expect(isRecord(invalidJson) ? invalidJson.url : undefined).toBeUndefined();
  expect(diagnosticsOf(invalidJson).some((item) => item.path === "schemaVersion" && item.message.length > 0)).toBe(true);
  expect(JSON.stringify(invalidJson)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/);

  const secretKey = await request.post("/api/tours", {
    headers: agentHeaders(),
    data: { ...tourDocument, [tourTestEnv.TOUR_AGENT_TOKEN]: "present" },
  });
  expect(secretKey.status()).toBe(422);
  expect(await secretKey.text()).not.toContain(tourTestEnv.TOUR_AGENT_TOKEN);

  await page.goto("/tour/00000000-0000-4000-8000-000000000001");
  await signIn(page, "Sign in as Dan");
  await expect(page.getByRole("heading", { name: "This tour is unavailable" })).toBeVisible();
  await expect(page.getByText("Partial tour should not publish")).toHaveCount(0);
  await expect(page.getByText("Credential tour")).toHaveCount(0);

  const literal = await publishTour(request, {
    ...tourDocument,
    title: "Literal markup tour",
    sections: [
      {
        id: "reader",
        heading: "What changed",
        body: "Keep this literal: <script>alert(1)</script>",
      },
    ],
  });
  expect(literal.status()).toBe(201);
  const literalBody = publishedTour(await literal.json());
  let dialogs = 0;
  page.on("dialog", (dialog) => {
    dialogs += 1;
    void dialog.dismiss();
  });
  await page.goto(literalBody.url);
  await expect(page.getByText("Keep this literal: <script>alert(1)</script>")).toBeVisible();
  expect(dialogs).toBe(0);
});

test("Dan can move through tour sections from the keyboard in either theme", async ({ page }) => {
  const published = await publishTour(page.request);
  const { url } = publishedTour(await published.json());
  await page.goto(url);
  await signIn(page, "Sign in as Dan");

  const toggle = page.getByRole("button", { name: /Switch to (dark|light) theme/ });
  await expect(toggle).toBeEnabled();
  const before = await page.getByRole("heading", { level: 1 }).evaluate((element) => getComputedStyle(element).color);
  await toggle.click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect.poll(async () => page.getByRole("heading", { level: 1 }).evaluate((element) => getComputedStyle(element).color)).not.toBe(before);

  await page.getByRole("link", { name: "What changed" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "What changed" })).toBeFocused();
  await expect(page.getByRole("link", { name: "What changed" })).toHaveAttribute("aria-current", "location");
  await expect(page).toHaveURL(/#reader$/);
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("the public reference manual does not require tour authentication", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Anaphor" })).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Manual index" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in as Dan" })).toHaveCount(0);
  await expect(page.getByText("Sign in to read this tour")).toHaveCount(0);
});

test("a failed GitHub round trip explains that sign-in did not complete", async ({ page, request }) => {
  const callback = await request.get("/api/auth/github/callback", { maxRedirects: 0 });
  expect(callback.status()).toBe(307);
  expect(callback.headers().location).toContain("sign-in=failed");
  expect(callback.headers()["set-cookie"] ?? "").not.toContain("anaphor_tour_session");

  const published = await publishTour(request);
  const { url } = publishedTour(await published.json());
  await page.goto(`${url}?sign-in=failed`);
  await expect(page.getByText("GitHub sign-in did not complete. Try again with the account that is allowed to read this tour.")).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);
});

test("GitHub sign-in reports that the provider is not configured", async ({ request }) => {
  const response = await request.get("/api/auth/github?returnTo=/tour/00000000-0000-4000-8000-000000000002", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(503);
  const text = await response.text();
  expect(text).toContain("Sign-in unavailable");
  expect(text).not.toContain("github.com/login");
  expect(response.headers()["set-cookie"] ?? "").not.toContain("anaphor_tour_session");
});
