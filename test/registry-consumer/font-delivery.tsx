import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ButtonLabel } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Text } from "./components/ui/text";
import "./styles.css";

function Consumer() {
  const [count, setCount] = useState(0);
  return <main className="mx-auto max-w-workspace px-page-inset py-6 font-sans">
    <div data-testid="editorial-layout" className="mx-auto max-w-editorial">
      <Card variant="default"><CardContent>
        <Text as="h1" variant="title"><span data-font-sample>Font delivery</span></Text>
        <Text as="p" variant="body"><span data-font-sample>Inter variable, normal weight.</span></Text>
        <Text as="p" variant="body"><em data-font-sample>True italic keeps its own face.</em></Text>
        <Text as="p" variant="code"><span data-font-sample>Magda Clean Mono 0123456789</span></Text>
        <Button iconOnly={false} loading={false} nativeButton={true} type="button" shape="square" size="md" tone="accent" variant="solid" onClick={() => setCount(count + 1)}><ButtonLabel>Count {count}</ButtonLabel></Button>
      </CardContent></Card>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Consumer />);
