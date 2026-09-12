import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Text, Prose, CardTitle } from "@anaphor/system";

test("forwards refs to the variant default and explicitly selected native elements", () => {
  const span = createRef<HTMLSpanElement>();
  const heading = createRef<HTMLHeadingElement>();
  const article = createRef<HTMLElement>();
  render(<Prose as="article" ref={article} aria-label="Notes">
    <Text variant="ui" ref={span}>Reading progress</Text>
    <Text as="h2" variant="caption" ref={heading}>Details</Text>
  </Prose>);
  expect(span.current).toBe(screen.getByText("Reading progress"));
  expect(span.current?.tagName).toBe("SPAN");
  expect(heading.current).toBe(screen.getByRole("heading", { name: "Details", level: 2 }));
  expect(article.current).toBe(screen.getByRole("article", { name: "Notes" }));
});

test("card labels preserve the requested document heading level", () => {
  render(<CardTitle as="h2" variant="label">States</CardTitle>);
  expect(screen.getByRole("heading", { name: "States", level: 2 })).toBeVisible();
});
