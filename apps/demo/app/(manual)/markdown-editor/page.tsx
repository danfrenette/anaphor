import { Text } from "@anaphor/system";
import { MarkdownEditorExample } from "./markdown-editor-example";

export const metadata = { title: "Markdown editor · Anaphor" };

export default function MarkdownEditorPage() {
  return <main id="content" tabIndex={-1} className="min-w-0 px-page-inset py-12">
    <div className="mx-auto max-w-[840px]">
      <div className="border-b border-border pb-8">
        <Text as="h1" variant="title">Markdown editor</Text>
        <Text as="p" variant="description" className="mt-3">Edit basic Markdown in a bounded field and read the current Markdown output.</Text>
      </div>
      <MarkdownEditorExample />
    </div>
  </main>;
}
