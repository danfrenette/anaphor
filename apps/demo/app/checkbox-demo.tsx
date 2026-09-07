import { Card, CardContent, CardHeader, CardTitle, Checkbox, Field, FieldLabel } from "@design-language/system";
import { CheckboxPlayground, CheckboxRequiredExample, CheckboxSelectionExample } from "./checkbox-playground";

export function CheckboxDemo() {
  return (
    <section id="checkbox" className="scroll-mt-8 border-t border-border py-12">
      <header>
        <p className="font-mono text-label tracking-[0.08em] text-muted-foreground uppercase">02.03 / Control</p>
        <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Checkbox</h2>
        <p className="mt-3 max-w-[60ch] text-pretty text-body text-muted-foreground">A small, deliberate choice. A quick fill confirms selection; labels give it room to breathe.</p>
      </header>
      <div className="mt-8 grid items-start gap-4 sm:grid-cols-2">
        <div className="grid gap-4">
          <CheckboxPlayground />
          <Card>
            <CardHeader className="p-4 pb-1"><CardTitle className="text-ui">Required choice</CardTitle></CardHeader>
            <CardContent className="p-4"><CheckboxRequiredExample /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="p-4 pb-1"><CardTitle className="text-ui">Related choices</CardTitle></CardHeader>
          <CardContent className="p-4"><CheckboxSelectionExample /></CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between font-mono text-label tracking-[0.08em] uppercase">
          <p>State matrix</p>
          <p className="text-muted-foreground">05 states</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <Card key={theme} className={theme === "dark" ? "@container dark" : "@container"} role="group" aria-label={`${theme} checkbox states`}>
            <CardHeader className="p-4 pb-1"><CardTitle className="font-mono text-label text-muted-foreground uppercase">{theme} / States</CardTitle></CardHeader>
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
