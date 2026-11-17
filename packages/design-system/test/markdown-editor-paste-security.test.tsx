import { createRef } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Marked } from "marked";

// A fresh renderer: the shared `marked` instance is the one @tiptap/markdown configures.
const marked = new Marked();
import { beforeEach, expect, test, vi } from "vitest";
import { MarkdownEditor, type MarkdownEditorHandle } from "@anaphor/system";

beforeEach(() => {
  vi.stubGlobal("ClipboardEvent", Event);
  const rect = new DOMRect(0, 0, 10, 20);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => rect });
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => Object.assign([rect], { item: () => rect }) });
  Object.defineProperty(window, "scrollBy", { configurable: true, value: () => {} });
});

const vectors = ["&#106;avascript:", "java&#x73;cript:", "&#x6A;avascript:", "jav&#9;ascript:", "java&NewLine;script:", "data&#58;text/html,x", "JAVASCRIPT:", "\u0001javascript:", " javascript:", "vbscript:", "data:text/html,x"];
const paths = ["html", "inline", "reference", "autolink", "url", "url-rich", "selection", "selection-rich"];

test.each(vectors.flatMap(vector => paths.map(path => [vector, path])))('unsafe destination %j via %s', async (vector, path) => {
  const user = userEvent.setup();
  const ref = createRef<MarkdownEditorHandle>();
  const selected = path.startsWith("selection");
  render(<MarkdownEditor ref={ref} presentation="field" defaultValue={selected ? "selected" : ""} aria-label="Security paste" />);
  const editor = await screen.findByRole("textbox", { name: "Security paste" });
  editor.focus();
  if (selected) {
    await user.keyboard("{Control>}a{/Control}");
    expect(window.getSelection()?.toString()).toBe("selected");
  }
  const text = path === "inline" ? `[label](${vector})` : path === "reference" ? `[label][ref]\n\n[ref]: ${vector}` : path === "autolink" ? `<${vector}>` : vector;
  const html = path === "html" || path.endsWith("rich") ? `<a href="${vector}">label</a>` : "";
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { getData: (type: string) => type === "text/plain" ? text : type === "text/html" ? html : "", files: [], types: html ? ["text/plain", "text/html"] : ["text/plain"] } });
  act(() => { editor.dispatchEvent(event); });
  const markdown = ref.current!.getMarkdown();
  const parsed = new DOMParser().parseFromString(await marked.parse(markdown), "text/html");
  const links = [...parsed.querySelectorAll<HTMLAnchorElement>("a[href]")];
  if (process.env.SECURITY_MATRIX) console.log("SECURITY_MATRIX", JSON.stringify({ vector, path, markdown, hrefs: links.map(link => link.getAttribute("href")) }));
  for (const link of links) expect(["http:", "https:", "ftp:", "ftps:", "mailto:", "tel:", "callto:", "sms:", "cid:", "xmpp:"]).toContain(link.protocol);
  cleanup();
});
