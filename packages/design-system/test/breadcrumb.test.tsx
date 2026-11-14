import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type FormEvent } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbButton, BreadcrumbCurrent, BreadcrumbSeparator } from "@anaphor/system";
import { expect, test, vi } from "vitest";

test("native links, passive current text and decorative separators form a labeled path", async () => {
  const user = userEvent.setup();
  const linkRef = createRef<HTMLAnchorElement>();
  render(<Breadcrumb aria-label="Library path"><BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink ref={linkRef} href="/library">Library</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbCurrent aria-current="page">Research</BreadcrumbCurrent></BreadcrumbItem>
  </BreadcrumbList></Breadcrumb>);
  const path = screen.getByRole("navigation", { name: "Library path" });
  expect(within(path).getAllByRole("listitem")).toHaveLength(2);
  const link = within(path).getByRole("link", { name: "Library" });
  expect(link).toHaveAttribute("href", "/library");
  expect(linkRef.current).toBe(link);
  expect(within(path).getByText("Research")).toHaveAttribute("aria-current", "page");
  expect(within(path).getByText("/")).toHaveAttribute("aria-hidden", "true");
  await user.tab();
  expect(link).toHaveFocus();
  await user.tab();
  expect(document.body).toHaveFocus();
});

test("current buttons activate by keyboard and pointer without submitting; disabled ancestors are skipped", async () => {
  const user = userEvent.setup();
  const browse = vi.fn();
  const disabledBrowse = vi.fn();
  const submit = vi.fn((event: FormEvent) => event.preventDefault());
  const ref = createRef<HTMLButtonElement>();
  render(<form onSubmit={submit}><Breadcrumb aria-label="Chapter path"><BreadcrumbList>
    <BreadcrumbItem><BreadcrumbButton disabled onClick={disabledBrowse}>Unavailable chapter</BreadcrumbButton></BreadcrumbItem>
    <BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbButton ref={ref} aria-label="1.2 Sampling" aria-current="location" onClick={browse}>1.2</BreadcrumbButton></BreadcrumbItem>
  </BreadcrumbList></Breadcrumb></form>);
  const current = screen.getByRole("button", { name: "1.2 Sampling" });
  expect(ref.current).toBe(current);
  expect(current).toHaveAttribute("aria-current", "location");
  await user.tab();
  expect(current).toHaveFocus();
  await user.keyboard("{Enter} ");
  await user.click(current);
  expect(browse).toHaveBeenCalledTimes(3);
  await user.click(screen.getByRole("button", { name: "Unavailable chapter" }));
  expect(disabledBrowse).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
