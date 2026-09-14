import { Section, Text, Card, CardContent, CardHeader, CardTitle, Checkbox, Field, FieldContent, FieldDescription, FieldLabel } from "@anaphor/system";
import { CheckboxPlayground, CheckboxRequiredExample, CheckboxSelectionExample } from "./checkbox-playground";

export function CheckboxDemo() {
  return (
    <Section id="checkbox" className="border-t border-border py-12">
      <header>
        <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">02.03 / Control</p>
        <Text as="h2" variant="title" className="mt-8">Checkbox</Text>
        <Text as="p" variant="description" className="mt-3">A small, deliberate choice. A quick fill confirms selection; labels give it room to breathe.</Text>
      </header>
      <div className="mt-8"><CheckboxPlayground /></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          <Card variant="default">
            <CardHeader className="p-4 pb-1"><CardTitle as="h3" variant="heading" className="text-ui">Required choice</CardTitle></CardHeader>
            <CardContent className="p-4"><CheckboxRequiredExample /></CardContent>
          </Card>
          <Card variant="default">
            <CardHeader className="p-4 pb-1"><CardTitle as="h3" variant="heading" className="text-ui">Supporting text</CardTitle></CardHeader>
            <CardContent className="p-4">
              <Field orientation="horizontal">
                <Checkbox defaultChecked />
                <FieldContent><FieldLabel>Include a plain-text version</FieldLabel><FieldDescription>Send a simpler copy alongside the formatted email.</FieldDescription></FieldContent>
              </Field>
            </CardContent>
          </Card>
        </div>
        <Card variant="default">
          <CardHeader className="p-4 pb-1"><CardTitle as="h3" variant="heading" className="text-ui">Related choices</CardTitle></CardHeader>
          <CardContent className="p-4"><CheckboxSelectionExample /></CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between text-label tracking-[0.08em] uppercase">
          <p>State matrix</p>
          <p className="text-muted-foreground">05 states</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <Card variant="default" key={theme} className={theme === "dark" ? "@container dark" : "@container"} role="group" aria-label={`${theme} checkbox states`}>
            <CardHeader className="p-4 pb-1"><CardTitle as="h3" variant="label">{theme} / States</CardTitle></CardHeader>
            <CardContent className="grid gap-x-4 p-5 @min-[18rem]:grid-cols-2">
              <Field orientation="horizontal"><Checkbox /><FieldLabel>Unchecked</FieldLabel></Field>
              <Field orientation="horizontal"><Checkbox defaultChecked /><FieldLabel>Checked</FieldLabel></Field>
              <Field orientation="horizontal"><Checkbox checked={false} indeterminate readOnly /><FieldLabel>Mixed</FieldLabel></Field>
              <Field orientation="horizontal"><Checkbox defaultChecked readOnly /><FieldLabel>Read only</FieldLabel></Field>
              <Field orientation="horizontal" disabled><Checkbox defaultChecked /><FieldLabel>Unavailable</FieldLabel></Field>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </Section>
  );
}
