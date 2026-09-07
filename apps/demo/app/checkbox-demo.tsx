import { Card, CardContent, CardHeader, CardTitle, Checkbox, Field, FieldDescription, FieldLabel } from "@design-language/system";
import { CheckboxPlayground, CheckboxRequiredExample, CheckboxSelectionExample } from "./checkbox-playground";

export function CheckboxDemo() {
  return (
    <section id="checkbox" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <p className="text-label tracking-[0.08em] text-muted-foreground uppercase">02.03 / Control</p>
        <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Checkbox</h2>
        <p className="mt-3 prose-reading text-pretty">A small, deliberate choice. A quick fill confirms selection; labels give it room to breathe.</p>
      </header>
      <div className="mt-8"><CheckboxPlayground /></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="p-4 pb-1"><CardTitle className="text-ui">Required choice</CardTitle></CardHeader>
            <CardContent className="p-4"><CheckboxRequiredExample /></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-1"><CardTitle className="text-ui">Supporting text</CardTitle></CardHeader>
            <CardContent className="p-4">
              <Field className="gap-0">
                <FieldLabel className="flex min-h-8 items-center gap-3 pointer-coarse:min-h-11"><Checkbox defaultChecked />Include a plain-text version</FieldLabel>
                <FieldDescription className="pl-8 text-pretty">Send a simpler copy alongside the formatted email.</FieldDescription>
              </Field>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="p-4 pb-1"><CardTitle className="text-ui">Related choices</CardTitle></CardHeader>
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
          <Card key={theme} className={theme === "dark" ? "@container dark" : "@container"} role="group" aria-label={`${theme} checkbox states`}>
            <CardHeader className="p-4 pb-1"><CardTitle className="text-label text-muted-foreground uppercase font-normal">{theme} / States</CardTitle></CardHeader>
            <CardContent className="grid gap-x-4 p-5 @min-[18rem]:grid-cols-2">
              <Field><FieldLabel className="flex min-h-11 items-center gap-3"><Checkbox />Unchecked</FieldLabel></Field>
              <Field><FieldLabel className="flex min-h-11 items-center gap-3"><Checkbox defaultChecked />Checked</FieldLabel></Field>
              <Field><FieldLabel className="flex min-h-11 items-center gap-3"><Checkbox checked={false} indeterminate readOnly />Mixed</FieldLabel></Field>
              <Field><FieldLabel className="flex min-h-11 items-center gap-3"><Checkbox defaultChecked readOnly />Read only</FieldLabel></Field>
              <Field disabled><FieldLabel className="flex min-h-11 items-center gap-3"><Checkbox defaultChecked />Unavailable</FieldLabel></Field>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </section>
  );
}
