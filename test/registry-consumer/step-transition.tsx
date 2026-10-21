import { useState } from "react";
import { createRoot } from "react-dom/client";
import { StepTransition } from "./components/ui/step-transition";
import "./styles.css";

function Consumer() {
  const [count, setCount] = useState(0);
  return <main className="mx-auto max-w-workspace px-page-inset py-6 font-sans">
    <div data-testid="editorial-layout" className="mx-auto max-w-editorial"><p className="max-w-reading">Shared layout in an independent consumer.</p></div>
    <button className="h-10" onClick={() => setCount(count + 1)}>Count {count}</button>
    <p className="font-mono">Installed source</p>
    <StepTransition value={String(count)} direction="forward" animate>
      <p>Current step {count}</p>
    </StepTransition>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Consumer />);
