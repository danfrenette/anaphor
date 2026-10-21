import { MediaViewer } from "./components/ui/media-viewer";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ButtonLabel } from "./components/ui/button";
import "./styles.css";

function Consumer() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  return <main className="mx-auto max-w-workspace px-page-inset py-6 font-sans">
    <div data-testid="editorial-layout" className="mx-auto max-w-editorial"><p className="max-w-reading">Shared layout in an independent consumer.</p></div>
    <h1>Registry consumer</h1>
    <Button iconOnly={false} loading={false} nativeButton type="button" shape="square" size="md" tone="accent" variant="solid" onClick={() => setCount(count + 1)}><ButtonLabel>Count {count}</ButtonLabel></Button>
    <p className="font-mono">Installed source</p>
    <button onClick={() => setOpen(true)}>Inspect registry media</button>
    <MediaViewer open={open} onOpenChange={setOpen} activeItemId="example" onActiveItemChange={() => {}} initialPanel="annotations"
      items={[{id:"example",sourceKey:"v1",kind:"image",src:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='gray'/%3E%3C/svg%3E",width:800,height:600,alt:"Example",title:"Registry media",annotations:<p>Installed supporting details.</p>}]} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<Consumer />);
