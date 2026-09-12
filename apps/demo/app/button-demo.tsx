import { Text, Button, ButtonLabel, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anaphor/system";
import { ArrowRight, Trash } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { ButtonPlayground } from "./button-playground";
import { ButtonLoadingExample } from "./button-loading-example";

const variants = ["solid", "destructive", "outline", "ghost"] as const;

export function ButtonDemo() {
  return (
    <section id="button" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase">
          <p>02.01 / Control</p>
          <p>Status / Stable</p>
        </div>
        <Text as="h2" variant="title" className="mt-8">Button</Text>
        <Text variant="description" className="mt-3">
          Triggers an immediate action. Use one primary action per surface.
        </Text>
      </header>

      <ButtonPlayground>
        <div className="mt-10">
          <div className="flex items-center justify-between text-label tracking-[0.08em] uppercase">
            <p>State matrix</p>
            <p className="text-muted-foreground">04 states</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card role="group" aria-label="Loading transition example">
            <CardHeader>
              <CardTitle>Loading</CardTitle>
              <CardDescription>Keeps its color while the spinner enters and exits.</CardDescription>
            </CardHeader>
            <CardContent><ButtonLoadingExample /></CardContent>
          </Card>
          <Card role="group" aria-label="Disabled loading transition example">
            <CardHeader>
              <CardTitle>Loading + disabled</CardTitle>
              <CardDescription>Adds the gray disabled treatment while loading.</CardDescription>
            </CardHeader>
            <CardContent><ButtonLoadingExample disabledWhileLoading /></CardContent>
          </Card>
        </div>
        <p className="mt-3 text-ui text-muted-foreground">Click either button to try a 1.5-second action. Both return to idle automatically.</p>

        <Card className="mt-10">
          <CardHeader><CardTitle variant="label">Behavior</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
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
            <Button nativeButton={false} render={<a href="#card" />} tone="neutral" variant="outline">
              <ButtonLabel>Explore Card</ButtonLabel>
            </Button>
          </CardContent>
        </Card>

        <Card className="dark mt-10">
          <CardHeader>
            <CardTitle variant="label">Theme study / Dark</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {variants.map((variant) => (
              <Button key={variant} variant={variant}>
                <ButtonLabel>{variant.charAt(0).toUpperCase() + variant.slice(1)}</ButtonLabel>
              </Button>
            ))}
          </CardContent>
        </Card>
      </ButtonPlayground>
    </section>
  );
}

function State({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Card role="group" aria-label={`${label} button example`} className="flex min-h-36 flex-col items-center justify-center gap-5 p-4">
      {children}
      <p className="text-label text-muted-foreground uppercase">{label}</p>
    </Card>
  );
}
