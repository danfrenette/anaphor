import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton, SkeletonBox, SkeletonRegion, SkeletonText } from "@anaphor/system";

describe("Skeleton", () => {
  it("hides mock content and blocks its controls until loading completes without remounting", () => {
    const content = <><h2><SkeletonText>Article title</SkeletonText></h2><SkeletonBox><button>Read article</button></SkeletonBox></>;
    const { rerender } = render(<SkeletonRegion isLoading variant="pulse" label="Loading article">{content}</SkeletonRegion>);
    expect(screen.getByRole("status")).toHaveTextContent("Loading article");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { hidden: true });
    expect(button.closest("[inert]")).not.toBeNull();
    rerender(<SkeletonRegion isLoading={false} variant="pulse" label="Loading article">{content}</SkeletonRegion>);
    expect(screen.getByRole("button", { name: "Read article" })).toBe(button);
    expect(button.closest("[inert]")).toBeNull();
    expect(screen.getByRole("heading", { name: "Article title" })).toBeVisible();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("leaves participants readable outside a loading region", () => {
    render(<><SkeletonText>Ordinary text</SkeletonText><SkeletonBox><button>Action</button></SkeletonBox><Skeleton variant="static" data-testid="shape" /></>);
    expect(screen.getByText("Ordinary text")).toBeVisible();
    expect(screen.getByRole("button", { name: "Action" })).toBeEnabled();
    expect(screen.getByTestId("shape")).toHaveAttribute("aria-hidden", "true");
  });
});
