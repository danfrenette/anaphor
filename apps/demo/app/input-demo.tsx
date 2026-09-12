import { Text, Card, CardContent, CardHeader, CardTitle, Field, FieldLabel, Input } from "@anaphor/system";
import { InputPlayground, InputSearchExample, InputValidationExample } from "./input-playground";

export function InputDemo() {
  return (
    <section id="input" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">02.02 / Control</p>
        <Text as="h2" variant="title" className="mt-8">Input</Text>
        <Text variant="description" className="mt-3">A quiet place to type. Clear feedback when you need it, room to correct when you don’t.</Text>
      </header>
      <InputPlayground />
      <Card className="mt-6">
        <CardHeader><CardTitle>Inline validation</CardTitle></CardHeader>
        <CardContent>
          <InputValidationExample />
          <p className="mt-6 text-ui text-muted-foreground">Leave an incomplete address or submit to see feedback. Start editing to clear it; typing pauses never bring the error back.</p>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader><CardTitle>Input with an action</CardTitle></CardHeader>
        <CardContent><InputSearchExample /></CardContent>
      </Card>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <Card key={theme} className={theme === "dark" ? "dark" : undefined}>
            <CardHeader><CardTitle variant="label">{theme} / States</CardTitle></CardHeader>
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
