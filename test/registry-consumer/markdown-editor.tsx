import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MarkdownEditor } from "./components/ui/markdown-editor";
import "./styles.css";

function Consumer() {
  const [count, setCount] = useState(0);
  const [markdown, setMarkdown] = useState("Installed **Markdown**");
  return <main className="mx-auto max-w-workspace px-page-inset py-6 font-sans">
    <div data-testid="editorial-layout" className="mx-auto max-w-editorial"><p className="max-w-reading">Shared layout in an independent consumer.</p></div>
    <h1>Registry consumer</h1>
    <button type="button" className="h-10" onClick={() => setCount(count + 1)}>Count {count}</button>
    <MarkdownEditor presentation="field" defaultValue={markdown} onChange={setMarkdown} aria-label="Registry note" />
    <div role="group" aria-label="Registry Markdown">{markdown}</div>
    <p className="font-mono">Installed source</p>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Consumer />);
