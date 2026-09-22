import { expect, test } from "vitest";
import { magneticStep } from "../src/lib/slider-utils";

test("a partial final interval holds its endpoint until the release threshold", () => {
  expect(magneticStep(83, 85, 0, 85, 20, 0.6)).toBe(85);
  expect(magneticStep(82, 85, 0, 85, 20, 0.6)).toBe(85);
  expect(magneticStep(81.9, 85, 0, 85, 20, 0.6)).toBe(80);
  expect(magneticStep(83, 80, 0, 85, 20, 0.6)).toBe(80);
  expect(magneticStep(83.1, 80, 0, 85, 20, 0.6)).toBe(85);
});
