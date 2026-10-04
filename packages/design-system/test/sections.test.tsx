import { render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ContentSections, Section, useContentSections } from "@anaphor/system";

beforeEach(() => {
  // jsdom has no layout or scrolling; browser tests cover those boundaries.
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue({ length: 1, item: () => null, [Symbol.iterator]: () => [new DOMRect()][Symbol.iterator]() });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Navigation() {
  const { activeId, first } = useContentSections();
  return <><output aria-label="Active section">{activeId}</output><button onClick={first}>First section</button></>;
}

test("exposes navigation, supports remapping/disabling, and skips hidden sections", async () => {
  const user = userEvent.setup();
  function Example({ enabled = true }: { enabled?: boolean }) {
    return <ContentSections defaultScope enabled={enabled} bindings={{ next: "N", previous: null }}>
      <Navigation />
      <Section id="one" aria-label="One">One</Section>
      <Section id="hidden" aria-label="Hidden" hidden>Hidden</Section>
      <Section id="two" aria-label="Two">Two</Section>
    </ContentSections>;
  }
  const { rerender } = render(<Example />);
  await waitFor(() => expect(screen.getByLabelText("Active section")).toHaveTextContent("two"));
  await user.click(screen.getByRole("button", { name: "First section" }));
  expect(screen.getByRole("region", { name: "One" })).toHaveFocus();
  await user.keyboard("jn");
  expect(screen.getByRole("region", { name: "Two" })).toHaveFocus();
  await user.keyboard("k");
  expect(screen.getByRole("region", { name: "Two" })).toHaveFocus();
  rerender(<Example enabled={false} />);
  await user.keyboard("gg");
  expect(screen.getByRole("region", { name: "Two" })).toHaveFocus();
});

test("the focused nested group owns navigation and outside focus uses the explicit default", async () => {
  const user = userEvent.setup();
  render(<><button>Outside</button><ContentSections defaultScope>
    <Section id="outer-one" aria-label="Outer one">One</Section>
    <Section id="outer-two" aria-label="Outer two">Two</Section>
    <ContentSections>
      <Section id="inner-one" aria-label="Inner one">One</Section>
      <Section id="inner-two" aria-label="Inner two">Two</Section>
    </ContentSections>
  </ContentSections></>);
  screen.getByRole("region", { name: "Inner one" }).focus();
  await user.keyboard("gg");
  await user.keyboard("j");
  expect(screen.getByRole("region", { name: "Inner two" })).toHaveFocus();
  screen.getByRole("button", { name: "Outside" }).focus();
  await user.keyboard("gg");
  expect(screen.getByRole("region", { name: "Outer one" })).toHaveFocus();
  await user.keyboard("j");
  expect(screen.getByRole("region", { name: "Outer two" })).toHaveFocus();
});

test("navigates sections inside a supplied scroll container", async () => {
  const user = userEvent.setup();
  function Example() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    return <ContentSections scrollContainerRef={scrollContainerRef}>
      <Navigation />
      <div ref={scrollContainerRef} aria-label="Article scroll area">
        <Section id="contained" aria-label="Contained">Contained</Section>
      </div>
    </ContentSections>;
  }
  render(<Example />);
  const scrollArea = screen.getByLabelText("Article scroll area");
  const scrollTo = vi.fn();
  scrollArea.scrollTo = scrollTo;
  Object.defineProperty(scrollArea, "scrollHeight", { configurable: true, value: 1000 });
  Object.defineProperty(scrollArea, "clientHeight", { configurable: true, value: 200 });
  vi.spyOn(scrollArea, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 20));
  vi.spyOn(screen.getByRole("region", { name: "Contained" }), "getBoundingClientRect").mockReturnValue(new DOMRect(0, 120));
  await user.click(screen.getByRole("button", { name: "First section" }));
  expect(scrollTo).toHaveBeenCalledWith({ top: 100, behavior: "instant" });
  expect(window.scrollTo).not.toHaveBeenCalled();
});
