import { MarkdownEditor, Prose, Text } from "@anaphor/system";
import { marked } from "marked";
import { MarkdownEditorExample } from "./markdown-editor-example";

export const metadata = { title: "Markdown editor · Anaphor" };

const comparisonMarkdown = [
  "# A field guide",
  "",
  "A paragraph with **emphasis** and a [link](https://anaphor.dev).",
  "",
  "A soft line",
  "continues here.",
  "",
  "## Observations",
  "",
  "- First item",
  "- Second item",
  "  - Nested item",
  "  - Another nested item",
  "",
  "Checklist:",
  "",
  "- [ ] Check the route",
  "- [x] Pack supplies",
  "  - [ ] Nested task",
  "",
  "| Item | Status | Owner |",
  "| :--- | :---: | ---: |",
  "| **Map** | Ready | Alex |",
  "| Compass | *Packed* | Sam |",
  "",
  "1. Ordered first",
  "2. Ordered second",
  "",
  "> A quotation with a little context.",
  "",
  "```ts",
  "x".repeat(120),
  "```",
  "",
  "---",
  "",
  "The final paragraph.",
].join("\n");

const codeEndingMarkdown = ["A paragraph before code.", "", "```ts", "x".repeat(120), "```"].join("\n");
const wideTableMarkdown = `| Identifier | Status |\n| --- | --- |\n| ${"wide".repeat(40)} | Ready |`;
const complexTasks = "- [ ] Ordered task\n  1. Ordered child\n\nBetween.\n\n- [ ] Unordered task\n  - Unordered child\n\nBetween.\n\n- [ ] Loose task\n\n  Second paragraph\n\n- Another item";
const renderMarkdown = (markdown: string) => marked.parse(markdown, { async: false })
  .replaceAll("<pre>", '<pre tabindex="0">')
  .replaceAll('type="checkbox"', 'type="checkbox" aria-label="Task status"')
  .replaceAll("<table>", '<div data-prose-table tabindex="0" role="region" aria-label="Table"><table>')
  .replaceAll("</table>", "</table></div>");

export default function MarkdownEditorPage() {
  return <main id="content" tabIndex={-1} className="min-w-0 px-page-inset py-12">
    <div className="mx-auto max-w-[840px]">
      <div className="border-b border-border pb-8">
        <Text as="h1" variant="title">Markdown editor</Text>
        <Text as="p" variant="description" className="mt-3">Edit Markdown in a bounded field: headings, lists, quotes, code, rules, emphasis, and links, with the current Markdown output beside it.</Text>
      </div>
      <MarkdownEditorExample />
      <section aria-label="In-place comparison" className="mt-12">
        <Text as="h2" variant="heading">In-place comparison</Text>
        <Text as="p" variant="body" className="mt-3">The same Markdown, editable and rendered.</Text>
        <div className="mt-6 grid min-w-0 gap-8 md:grid-cols-2">
          <div className="min-w-0"><Text as="h3" variant="ui" className="mb-3 font-medium">Editable</Text><MarkdownEditor presentation="in-place" defaultValue={comparisonMarkdown} aria-label="In-place note" /></div>
          <div className="min-w-0"><Text as="h3" variant="ui" className="mb-3 font-medium">Rendered</Text><Prose as="div" aria-label="Rendered note" dangerouslySetInnerHTML={{ __html: renderMarkdown(comparisonMarkdown) }} /></div>
        </div>
        <div className="mt-8 grid min-w-0 gap-8 md:grid-cols-2">
          <div className="min-w-0"><Text as="h3" variant="ui" className="mb-3 font-medium">Editable</Text><MarkdownEditor presentation="in-place" defaultValue={codeEndingMarkdown} aria-label="In-place code ending" /></div>
          <div className="min-w-0"><Text as="h3" variant="ui" className="mb-3 font-medium">Rendered</Text><Prose as="div" aria-label="Rendered code ending" dangerouslySetInnerHTML={{ __html: renderMarkdown(codeEndingMarkdown) }} /></div>
        </div>
      </section>
      <section aria-label="Complex task comparison" className="mt-12 grid min-w-0 gap-8 md:grid-cols-2">
        <MarkdownEditor presentation="in-place" defaultValue={complexTasks} aria-label="Complex tasks editor" />
        <Prose as="div" aria-label="Complex tasks rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(complexTasks) }} />
      </section>
      <section aria-label="Wide table comparison" className="mt-12">
        <Text as="h2" variant="heading">Wide table</Text>
        <MarkdownEditor presentation="in-place" defaultValue={wideTableMarkdown} aria-label="Wide table editor" />
        <Prose as="div" aria-label="Wide table rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(wideTableMarkdown) }} />
      </section>
    </div>
  </main>;
}
