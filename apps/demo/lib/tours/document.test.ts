import { expect, test } from "vitest";
import { validateTour } from "./document";

const secret = "playwright-agent-token";
const padded = `  ${secret}  `;

const document = {
  schemaVersion: 1,
  title: "Publish the private tour",
  overview: "Dan can read a tour that an agent published.",
  provenance: [{ repository: "danfrenette/anaphor", pullRequest: 12, revision: "a".repeat(40) }],
  sections: [{ id: "reader", heading: "What changed", body: "The tour stays private." }],
};

test("rejects a credential pasted with surrounding whitespace", () => {
  const result = validateTour({ ...document, overview: padded }, [padded]);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.diagnostics.some((item) => item.path === "overview")).toBe(true);
  expect(JSON.stringify(result.diagnostics)).not.toContain(secret);
});

test("rejects an unsupported field whose name is a credential", () => {
  const result = validateTour({ ...document, [secret]: "present" }, [secret]);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(JSON.stringify(result.diagnostics)).not.toContain(secret);
});
