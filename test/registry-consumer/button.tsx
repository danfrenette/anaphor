import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ButtonLabel } from "./components/ui/button";
import "./styles.css";

function Consumer() {
  const [count, setCount] = useState(0);
  return <main className="p-6 font-sans">
    <h1>Registry consumer</h1>
    <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="solid" onClick={() => setCount(count + 1)}><ButtonLabel>Count {count}</ButtonLabel></Button>
    <p className="font-mono">Installed source</p>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Consumer />);
