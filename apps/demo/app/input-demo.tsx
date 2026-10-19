import { Section, Text, Field, FieldLabel, FieldFeedback, Input } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { InputPlayground, InputSearchExample, InputValidationExample } from "./input-playground";

export function InputDemo() {
  return (
    <Section id="input" className="border-t border-border py-12">
      <Text as="h2" variant="title">Input</Text>
      <Text as="p" variant="description" className="mt-3">A quiet place to type. Clear feedback when you need it, room to correct when you don’t.</Text>
      <div className="mt-10 space-y-10">
        <CatalogExample title="Sizes" code={`<Field orientation="vertical">
  <FieldLabel>Project name</FieldLabel>
  <Input size="md" placeholder="Untitled project" />
</Field>
// Sizes: sm, md, lg`}>
          <div className="grid max-w-90 gap-5">
            {([['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] as const).map(([size, label]) => (
              <Field key={size} orientation="vertical">
                <FieldLabel>{label}</FieldLabel>
                <Input size={size} placeholder="Untitled project" />
              </Field>
            ))}
          </div>
        </CatalogExample>

        <CatalogExample title="States" description="Compare fixed states here; try the validation example below for feedback that responds to editing." code={`<Field orientation="vertical">
  <FieldLabel>Workspace ID</FieldLabel>
  <Input size="md" readOnly defaultValue="workspace-001" />
</Field>

<Field orientation="vertical" disabled>
  <FieldLabel>Unavailable</FieldLabel>
  <Input size="md" placeholder="Not available" />
</Field>

<Field orientation="vertical" invalid>
  <FieldLabel>Project slug</FieldLabel>
  <Input size="md" defaultValue="My project" />
  <FieldFeedback invalid={true}
    hint="Use lowercase letters and hyphens."
    error="Use lowercase letters and hyphens, such as my-project." />
</Field>`}>
          <div className="grid max-w-90 gap-5">
            <Field orientation="vertical"><FieldLabel>Project name</FieldLabel><Input size="md" placeholder="Untitled project" /></Field>
            <Field orientation="vertical"><FieldLabel>Workspace ID</FieldLabel><Input size="md" readOnly defaultValue="workspace-001" /><p className="text-small text-muted-foreground">Read-only values can still be selected and copied.</p></Field>
            <Field orientation="vertical" disabled><FieldLabel>Unavailable</FieldLabel><Input size="md" placeholder="Not available" /></Field>
            <Field orientation="vertical" invalid>
              <FieldLabel>Project slug</FieldLabel>
              <Input size="md" defaultValue="My project" />
              <FieldFeedback invalid={true} hint="Use lowercase letters and hyphens." error="Use lowercase letters and hyphens, such as my-project." />
            </Field>
          </div>
        </CatalogExample>

        <CatalogExample title="Validation" description="Validate on blur or submit. Clear the error when editing resumes, and keep the form in place." code={`const [invalid, setInvalid] = useState(false);

<Field orientation="vertical" invalid={invalid}>
  <FieldLabel>Email address</FieldLabel>
  <Input size="md" type="email" required
    onBlur={event => setInvalid(!event.currentTarget.validity.valid)}
    onChange={() => setInvalid(false)} />
  <FieldFeedback invalid={invalid}
    hint="Used only for this example. Nothing is sent."
    error="Enter a complete email address, such as you@example.com." />
</Field>
// On submit, check validity and focus the field if invalid.`}>
          <div className="max-w-90"><InputValidationExample /></div>
        </CatalogExample>

        <CatalogExample title="With an action" code={`<Field orientation="vertical" name="query">
  <FieldLabel>Search the manual</FieldLabel>
  <div className="flex flex-wrap gap-2">
    <Input size="md" type="search" className="flex-1 basis-40" />
    <Button nativeButton={true} type="submit"
      variant="solid" tone="neutral" size="md" shape="square"
      iconOnly={false} loading={false}>
      <ButtonLabel>Search</ButtonLabel>
    </Button>
  </div>
</Field>`}>
          <div className="max-w-90"><InputSearchExample /></div>
        </CatalogExample>

        <div>
          <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
          <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore sizes, input types, and states.</p>
          <InputPlayground />
        </div>
      </div>
    </Section>
  );
}
