import { expectTypeOf, it } from "vitest";
import type { ComponentPropsWithoutRef } from "react";
import type * as Effect from "effect/Effect";
import type { EdgeProps, GraphControls, GraphProps, NodeProps, PulseUnavailable } from "./index";

it("accepts native div props while requiring node identity and supported surfaces", () => {
  expectTypeOf<NodeProps>().toExtend<ComponentPropsWithoutRef<"div">>();
  expectTypeOf<{ nodeId: string; id: string; variant: "surface" }>().toExtend<NodeProps>();
  expectTypeOf<{ children: string }>().not.toExtend<NodeProps>();
  expectTypeOf<{ nodeId: string; variant: "card" }>().not.toExtend<NodeProps>();
  expectTypeOf<NodeProps>().not.toHaveProperty("ref");
});

it("keeps graph controls small and pulse failures typed", () => {
  expectTypeOf<keyof GraphControls>().toEqualTypeOf<"pulse" | "clearGlows">();
  expectTypeOf<ReturnType<GraphControls["pulse"]>>().toEqualTypeOf<Effect.Effect<void, PulseUnavailable>>();
  expectTypeOf<{ edgeId: string; from: string }>().not.toExtend<EdgeProps>();
  expectTypeOf<{ children: string; pulseSpeed: string }>().not.toExtend<GraphProps>();
});
