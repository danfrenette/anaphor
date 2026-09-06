import { Button, ButtonLabel } from "@design-language/system";
import { ArrowRight, Trash } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { ButtonPlayground } from "./button-playground";

const variants = ["solid", "destructive", "outline", "ghost"] as const;

export function ButtonDemo() {
  return (
    <section id="button" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 font-mono text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>02.01 / Control</p>
          <p>Status / Stable</p>
        </div>
        <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Button</h2>
        <p className="mt-3 max-w-[70ch] text-body text-muted-foreground">
          Triggers an immediate action. Use one primary action per surface.
        </p>
      </header>

      <ButtonPlayground>
        <div className="mt-10">
          <div className="flex items-center justify-between font-mono text-label tracking-[0.08em] uppercase">
            <p>State matrix</p>
            <p className="text-muted-foreground">04 states</p>
          </div>
          <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            <State label="Default">
              <Button><ButtonLabel>Execute</ButtonLabel></Button>
            </State>
            <State label="Focus">
              <Button className="outline-2 outline-offset-2 outline-ring"><ButtonLabel>Execute</ButtonLabel></Button>
            </State>
            <State label="Loading">
              <Button loading><ButtonLabel>Execute</ButtonLabel></Button>
            </State>
            <State label="Disabled">
              <Button disabled><ButtonLabel>Execute</ButtonLabel></Button>
            </State>
          </div>
        </div>

        <div className="mt-10">
          <p className="font-mono text-label tracking-[0.08em] uppercase">Behavior</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border border-border p-6">
            <Button variant="outline">
              <ArrowRight aria-hidden="true" />
              <ButtonLabel>Composed</ButtonLabel>
            </Button>
            <Button variant="destructive">
              <Trash aria-hidden="true" />
              <ButtonLabel>Delete item</ButtonLabel>
            </Button>
            <Button shape="round" iconOnly aria-label="Continue">
              <ArrowRight aria-hidden="true" />
            </Button>
            <Button render={<button data-composed="true" />} tone="neutral" variant="outline">
              <ButtonLabel>Render prop</ButtonLabel>
            </Button>
          </div>
        </div>

        <div className="dark mt-10 bg-background p-6 text-foreground">
          <div className="flex items-center justify-between font-mono text-label tracking-[0.08em] uppercase">
            <p>Theme study / Dark</p>
            <p className="text-muted-foreground">Contrast / AA</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 border border-border bg-muted p-6">
            {variants.map((variant) => (
              <Button key={variant} variant={variant}>
                <ButtonLabel>{variant.charAt(0).toUpperCase() + variant.slice(1)}</ButtonLabel>
              </Button>
            ))}
          </div>
        </div>
      </ButtonPlayground>
    </section>
  );
}

function State({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={`${label} button example`} className="flex min-h-36 flex-col items-center justify-center gap-5 bg-muted p-4">
      {children}
      <p className="font-mono text-label text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
