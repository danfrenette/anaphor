import { expect, test } from "vitest";
import { contrastRatio } from "./contrast";

test("known opaque contrast ratios", () => {
  expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBe(21);
  expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBe(21);
  expect(contrastRatio([120, 120, 120], [120, 120, 120])).toBe(1);
  expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.478, 3);
});

test("composites translucent text over its actual surface", () => {
  expect(contrastRatio([0, 0, 0], [255, 255, 255], 0)).toBe(1);
  expect(contrastRatio([0, 0, 0], [255, 255, 255], 0.5)).toBeCloseTo(3.977, 3);
  expect(contrastRatio([255, 255, 255], [0, 0, 0], 0.5)).toBeCloseTo(5.281, 3);
});
