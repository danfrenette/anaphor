import { Text, Card, CardContent, CardHeader, CardTitle, Field, FieldLabel, Input } from "@anaphor/system";
import { InputPlayground, InputSearchExample, InputValidationExample } from "./input-playground";

export function InputDemo() {
  return (
    <section id="input" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">02.02 / Control</p>
        <Text as="h2" variant="title" className="mt-8">Input</Text>
        <Text as="p" variant="description" className="mt-3">A quiet place to type. Clear feedback when you need it, room to correct when you don’t.</Text>
      </header>
      <InputPlayground />
      <Card variant="default" className="mt-6">
        <CardHeader><CardTitle as="h3" variant="heading">Inline validation</CardTitle></CardHeader>
        <CardContent>
          <InputValidationExample />
          <p className="mt-6 text-ui text-muted-foreground">Leave an incomplete address or submit to see feedback. Start editing to clear it; typing pauses never bring the error back.</p>
        </CardContent>
      </Card>
      <Card variant="default" className="mt-6">
        <CardHeader><CardTitle as="h3" variant="heading">Input with an action</CardTitle></CardHeader>
        <CardContent><InputSearchExample /></CardContent>
      </Card>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <Card variant="default" key={theme} className={theme === "dark" ? "dark" : undefined}>
            <CardHeader><CardTitle as="h3" variant="label">{theme} / States</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <Field orientation="vertical"><FieldLabel>Project name</FieldLabel><Input size="md" placeholder="Untitled project" /></Field>
              <Field orientation="vertical"><FieldLabel>Workspace ID</FieldLabel><Input size="md" readOnly defaultValue="workspace-001" /></Field>
              <Field orientation="vertical" disabled><FieldLabel>Unavailable</FieldLabel><Input size="md" placeholder="Not available" /></Field>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
