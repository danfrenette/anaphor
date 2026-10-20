import { Diff } from "./components/ui/diff";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ButtonLabel } from "./components/ui/button";
import "./styles.css";

function Consumer() {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  return <main className="mx-auto max-w-workspace px-page-inset py-6 font-sans">
    <div data-testid="editorial-layout" className="mx-auto max-w-editorial"><p className="max-w-reading">Shared layout in an independent consumer.</p></div>
    <h1>Registry consumer</h1>
    <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="solid" onClick={() => setCount(count + 1)}><ButtonLabel>Count {count}</ButtonLabel></Button>
    <p className="font-mono">Installed source</p>
    <Diff source={{ kind: "files", before: { name: "example.ts", contents: "const count = 1;\n" }, after: { name: "example.ts", contents: "const count = 2;\n" } }} layout="unified" wrap={true} controls={true} context="collapsed" maxHeight={240} annotations={{ notes: [{ id: "count", title: "Raise the initial count", body: "New readers begin with two items.", presentation: "popover", range: { side: "after", start: 1, end: 1 } }], activeNoteId, onActiveNoteChange: setActiveNoteId }} />
  </main>;
}

createRoot(document.getElementById("root")!).render(<Consumer />);
