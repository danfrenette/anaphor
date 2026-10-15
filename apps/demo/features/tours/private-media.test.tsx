import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AxiosError } from "axios";
import { PrivateQueries } from "./private-access";
import { PrivateTour } from "./private-tour";
import { storedTour } from "./document";

const network = vi.hoisted(() => ({ get: vi.fn(), head: vi.fn(), post: vi.fn() }));
vi.mock("axios", async (original) => {
  const actual = await original<typeof import("axios")>();
  return { ...actual, default: { ...actual.default, create: () => network } };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

test("a denied evidence request clears the private reader", async () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  const error = new AxiosError("Access denied");
  error.response = { status: 403, data: {}, statusText: "Forbidden", headers: {}, config: { headers: error.config?.headers ?? new (await import("axios")).AxiosHeaders() } };
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  network.head.mockRejectedValue(error);
  network.get.mockResolvedValue({ data: { owner: "dan", expiresAt } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
  const initial = storedTour.parse({id:"12345678-1234-4234-8234-123456789abc",revision:1,url:"https://example.com/tour",document:{version:2,title:"Sensitive review",overview:"Private evidence.",prs:[{url:"https://github.com/example/app/pull/1",base:"a".repeat(40),head:"b".repeat(40)}],sections:[{id:"read",title:"Read",paragraphs:["Private content."],evidenceIds:["check"]}],evidence:[{id:"check",criterion:"read",expected:"Read proof",observed:"Proof exists",action:"Open receipt",result:"pass",target:"Private reader",context:"Owner",testedAt:"2026-10-15T00:00:00Z",required:true,sources:[{pr:"https://github.com/example/app/pull/1",head:"b".repeat(40)}],assetIds:["receipt"]}],assets:[{id:"receipt",mediaType:"text/plain",sha256:"a".repeat(64),bytes:1,caption:"Private receipt",description:"Receipt contents",provenance:"Test fixture"}]}});
  render(<PrivateQueries><PrivateTour initial={initial} expiresAt={expiresAt} /></PrivateQueries>);
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Sensitive review" })).not.toBeInTheDocument());
  expect(screen.getByRole("heading", { name: "Sign in to Anaphor" })).toBeVisible();
});
