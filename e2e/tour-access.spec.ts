import { test, expect } from "@playwright/test";

test("deployed-mode application does not expose unauthenticated local tours", async ({ request }) => {
  const id = "00000000-0000-4000-8000-000000000001";
  expect((await request.get(`/local-tour/${id}`)).status()).toBe(404);
  expect((await request.get(`/api/local-tours/${id}`)).status()).toBe(404);
  expect((await request.get(`/api/local-tours/${id}/revisions/1/assets/recording`)).status()).toBe(404);
});
