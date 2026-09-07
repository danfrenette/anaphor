import { Card, CardContent, CardHeader, CardTitle, Field, FieldLabel, Input } from "@design-language/system";
import { InputPlayground, InputValidationExample } from "./input-playground";

export function InputDemo() {
  return (
    <section id="input" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <p className="font-mono text-label tracking-[0.08em] text-muted-foreground uppercase">02.02 / Control</p>
        <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Input</h2>
        <p className="mt-3 max-w-[70ch] text-body text-muted-foreground">A quiet place to type. Clear feedback when you need it, room to correct when you don’t.</p>
      </header>
      <InputPlayground />
      <Card className="mt-6">
        <CardHeader><CardTitle>Inline validation</CardTitle></CardHeader>
        <CardContent>
          <InputValidationExample />
          <p className="mt-6 text-ui text-muted-foreground">Leave an incomplete address or submit to see feedback. Start editing to clear it; typing pauses never bring the error back.</p>
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <Card key={theme} className={theme === "dark" ? "dark" : undefined}>
            <CardHeader><CardTitle className="font-mono text-label uppercase">{theme} / States</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <Field><FieldLabel>Project name</FieldLabel><Input placeholder="Untitled project" /></Field>
              <Field><FieldLabel>Workspace ID</FieldLabel><Input readOnly defaultValue="workspace-001" /></Field>
              <Field disabled><FieldLabel>Unavailable</FieldLabel><Input placeholder="Not available" /></Field>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
