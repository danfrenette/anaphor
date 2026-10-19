import { Section, Text, Checkbox, Field, FieldContent, FieldDescription, FieldLabel } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { CheckboxPlayground, CheckboxRequiredExample, CheckboxSelectionExample } from "./checkbox-playground";

export function CheckboxDemo() {
  return (
    <Section id="checkbox" className="border-t border-border py-12">
      <Text as="h2" variant="title">Checkbox</Text>
      <Text as="p" variant="description" className="mt-3">Choose one or more options. Labels explain the choice; a mixed state represents a partial selection.</Text>
      <div className="mt-10 space-y-10">
        <CatalogExample title="States" code={`<Field orientation="horizontal">
  <Checkbox defaultChecked />
  <FieldLabel>Checked</FieldLabel>
</Field>

<Field orientation="horizontal">
  <Checkbox checked={false} indeterminate readOnly />
  <FieldLabel>Mixed</FieldLabel>
</Field>

<Field orientation="horizontal" disabled>
  <Checkbox defaultChecked />
  <FieldLabel>Unavailable</FieldLabel>
</Field>`}>
          <div role="group" aria-label="Checkbox states" className="grid gap-x-6 bg-background sm:grid-cols-2">
            <Field orientation="horizontal"><Checkbox /><FieldLabel>Unchecked</FieldLabel></Field>
            <Field orientation="horizontal"><Checkbox defaultChecked /><FieldLabel>Checked</FieldLabel></Field>
            <Field orientation="horizontal"><Checkbox checked={false} indeterminate readOnly /><FieldLabel>Mixed</FieldLabel></Field>
            <Field orientation="horizontal"><Checkbox defaultChecked readOnly /><FieldLabel>Read only</FieldLabel></Field>
            <Field orientation="horizontal" disabled><Checkbox defaultChecked /><FieldLabel>Unavailable</FieldLabel></Field>
          </div>
        </CatalogExample>

        <CatalogExample title="Supporting text" code={`<Field orientation="horizontal">
  <Checkbox defaultChecked />
  <FieldContent>
    <FieldLabel>Include a plain-text version</FieldLabel>
    <FieldDescription>
      Send a simpler copy alongside the formatted email.
    </FieldDescription>
  </FieldContent>
</Field>`}>
          <Field orientation="horizontal" className="max-w-96">
            <Checkbox defaultChecked />
            <FieldContent><FieldLabel>Include a plain-text version</FieldLabel><FieldDescription>Send a simpler copy alongside the formatted email.</FieldDescription></FieldContent>
          </Field>
        </CatalogExample>

        <CatalogExample title="Related choices" description="Select all reflects the group: unchecked, checked, or mixed when only some choices are selected." code={`const channels = ["Product updates", "Design notes", "Community events"];
const [selected, setSelected] = useState(channels.slice(0, 1));

<Field orientation="horizontal">
  <Checkbox
    checked={selected.length === channels.length}
    indeterminate={selected.length > 0 && selected.length < channels.length}
    onCheckedChange={checked => setSelected(checked ? channels : [])} />
  <FieldLabel>Select all</FieldLabel>
</Field>
<FieldGroup>
  {channels.map(channel => (
    <Field key={channel} orientation="horizontal">
      <Checkbox checked={selected.includes(channel)}
        onCheckedChange={checked => setSelected(current => checked
          ? [...current, channel]
          : current.filter(value => value !== channel))} />
      <FieldLabel>{channel}</FieldLabel>
    </Field>
  ))}
</FieldGroup>`}>
          <div className="max-w-96"><CheckboxSelectionExample /></div>
        </CatalogExample>

        <CatalogExample title="Required choice" description="The required attribute participates in native form validation. This standalone example does not submit a form or show an error on blur." code={`<Field orientation="horizontal">
  <Checkbox name="agreement" required />
  <FieldContent>
    <FieldLabel>I agree to the example terms</FieldLabel>
    <FieldDescription>Required when submitting a form.</FieldDescription>
  </FieldContent>
</Field>`}>
          <div className="max-w-96"><CheckboxRequiredExample /></div>
        </CatalogExample>

        <div>
          <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
          <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore selection, mixed state, and availability.</p>
          <CheckboxPlayground />
        </div>
      </div>
    </Section>
  );
}
