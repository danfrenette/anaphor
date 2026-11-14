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
const renderMarkdown = (markdown: string) => marked.parse(markdown, { async: false }).replaceAll("<pre>", '<pre tabindex="0">');

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
    </div>
  </main>;
}
