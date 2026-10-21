import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaViewer, type MediaViewerItem } from "@anaphor/system";
import { expect, test } from "vitest";

const items: [MediaViewerItem, MediaViewerItem] = [
  { id: "one", sourceKey: "one-v1", kind: "image", src: "/one.png", alt: "First capture", width: 1200, height: 800, title: "First", annotations: <p>First note</p>, evidence: <p>First receipt</p> },
  { id: "two", sourceKey: "two-v1", kind: "image", src: "/two.png", alt: "Second capture", width: 400, height: 900, title: "Second" },
];
function Example({ media = items }: { media?: readonly MediaViewerItem[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("one");
  return <><button onClick={() => setOpen(true)}>Open media</button><MediaViewer open={open} onOpenChange={setOpen} items={media} activeItemId={active} onActiveItemChange={setActive} initialPanel="annotations" /></>;
}

test("finite navigation keeps focus return and image sizing per open session", async () => {
  const user = userEvent.setup();
  render(<Example />);
  const opener = screen.getByRole("button", { name: "Open media" });
  await user.click(opener);
  expect(await screen.findByRole("dialog", { name: "First" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Actual size" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(screen.getByRole("button", { name: "Actual size" })).toHaveAttribute("aria-pressed", "true");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(opener).toHaveFocus());
  await user.click(opener);
  expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute("aria-pressed", "true");
});

test("one supporting panel exposes the same supplied explanation after image failure", async () => {
  const user = userEvent.setup();
  render(<Example media={items.slice(0, 1)} />);
  await user.click(screen.getByRole("button", { name: "Open media" }));
  expect(await screen.findByText("First note")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  fireEvent.error(screen.getByAltText("First capture"));
  expect(screen.getByText("Image unavailable.")).toBeVisible();
  expect(screen.getByText("First note")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Retry image" }));
  expect(screen.getByAltText("First capture")).toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Evidence" }));
  expect(screen.getByText("First receipt")).toBeVisible();
  expect(screen.queryByText("First note")).not.toBeInTheDocument();
});

test("invalid image dimensions and missing active source retain an explicit usable dialog", async () => {
  const user = userEvent.setup();
  const invalid: MediaViewerItem[] = [{ ...items[0], kind: "image", src: "/bad.png", alt: "Invalid", width: 0, height: 100 }];
  const view = render(<Example media={invalid} />);
  await user.click(screen.getByRole("button", { name: "Open media" }));
  expect(await screen.findByText("Image dimensions unavailable.")).toBeVisible();
  expect(screen.getByText("First note")).toBeVisible();
  view.rerender(<Example media={[]} />);
  expect(screen.getByRole("dialog", { name: "Media unavailable" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Close media viewer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("replacement source resets actual size and arrows in annotation inputs do not navigate", async () => {
  const user = userEvent.setup();
  const media: [MediaViewerItem, MediaViewerItem] = [{ ...items[0], annotations: <input aria-label="Annotation search" /> }, items[1]];
  const view = render(<Example media={media} />);
  await user.click(screen.getByRole("button", { name: "Open media" }));
  await user.click(screen.getByRole("button", { name: "Actual size" }));
  const input = screen.getByRole("textbox", { name: "Annotation search" });
  await user.click(input);
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("dialog", { name: "First" })).toBeVisible();
  view.rerender(<Example media={[{ ...media[0], sourceKey: "replacement" }, media[1]]} />);
  expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute("aria-pressed", "true");
});

test("consumes each reveal once after loading and preserves panning across item visits", async () => {
  const user = userEvent.setup();
  const media: [MediaViewerItem, MediaViewerItem] = [{ ...items[0], kind: "image", src: "/one.png", alt: "First capture", width: 1200, height: 800, reveal: { x: 0.75, y: 0.75, key: "note-1" } }, items[1]];
  const view = render(<Example media={media} />);
  await user.click(screen.getByRole("button", { name: "Open media" }));
  const image = screen.getByAltText("First capture");
  const viewport = screen.getByLabelText("First image inspection");
  Object.defineProperties(image, { clientWidth: { value: 1200 }, clientHeight: { value: 800 } });
  Object.defineProperties(viewport, { clientWidth: { value: 400 }, clientHeight: { value: 300 } });
  expect(viewport.scrollLeft).toBe(0);
  fireEvent.load(image);
  expect(viewport.scrollLeft).toBe(700);
  viewport.scrollLeft = 100;
  viewport.scrollTop = 50;
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(viewport.scrollLeft).toBe(100);
  const first = media[0];
  if (first.kind !== "image") throw new Error("Image fixture required");
  view.rerender(<Example media={[{ ...first, reveal: { x: 0.75, y: 0.75, key: "note-1" } }, media[1]]} />);
  expect(viewport.scrollLeft).toBe(100);
  view.rerender(<Example media={[{ ...first, reveal: { x: 0.75, y: 0.75, key: "note-2" } }, media[1]]} />);
  expect(viewport.scrollLeft).toBe(700);
});

test("hiding the supporting panel returns focus to its console tab", async () => {
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Open media" }));
  await user.click(screen.getByRole("button", { name: "Hide details" }));
  expect(screen.getByRole("button", { name: "Show details" })).toHaveFocus();
});
