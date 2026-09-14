import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useAnimatedScroll } from "../src/lib/use-animated-scroll";

type AnimationRequest = { onUpdate: (value: number) => void; onComplete: () => void; stop: ReturnType<typeof vi.fn> };
const motion = vi.hoisted(() => {
  const requests: AnimationRequest[] = [];
  return { requests, unsubscribe: vi.fn() };
});
vi.mock("motion", () => ({
  scroll: () => motion.unsubscribe,
  animate: (_from: number, _to: number, callbacks: { onUpdate: (value: number) => void; onComplete: () => void }) => {
    const request = { ...callbacks, stop: vi.fn() };
    motion.requests.push(request);
    return request;
  },
}));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); motion.requests.length = 0; });

function setup() {
  const media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", () => media);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4000);
  const element = document.createElement("section");
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 1000, 100, 100));
  const onScroll = vi.fn();
  const hook = renderHook(() => useAnimatedScroll(onScroll));
  const go = () => act(() => hook.result.current.scrollTo(element, { offset: 88, duration: 0.1, ease: [0.77, 0, 0.175, 1] }));
  return { ...hook, go, media, onScroll };
}

test("retargeting ignores stale animation updates and completion", () => {
  const { result, go, onScroll } = setup();
  go(); go();
  const [old, current] = motion.requests;
  if (!old || !current) throw new Error("Expected two scroll requests");
  expect(old.stop).toHaveBeenCalledOnce();
  act(() => { old.onUpdate(200); old.onComplete(); });
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(result.current.isScrolling()).toBe(true);
  expect(onScroll).not.toHaveBeenCalled();
  act(() => current.onComplete());
  expect(result.current.isScrolling()).toBe(false);
  expect(onScroll).toHaveBeenCalledOnce();
});

test("manual input stops movement and unmount releases Motion observation", () => {
  const { result, go, unmount } = setup();
  go();
  act(() => window.dispatchEvent(new Event("wheel")));
  expect(result.current.isScrolling()).toBe(false);
  expect(motion.requests[0]?.stop).toHaveBeenCalledOnce();
  go(); unmount();
  expect(motion.requests[1]?.stop).toHaveBeenCalledOnce();
  expect(motion.unsubscribe).toHaveBeenCalled();
});

test("changing reduced motion stops an in-flight request", () => {
  const { result, go, media } = setup();
  go();
  act(() => { media.matches = true; media.dispatchEvent(new Event("change")); });
  expect(result.current.isScrolling()).toBe(false);
  expect(motion.requests[0]?.stop).toHaveBeenCalledOnce();
  go();
  expect(motion.requests).toHaveLength(1);
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 912, behavior: "instant" });
});
