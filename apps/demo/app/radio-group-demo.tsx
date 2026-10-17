import { Field, FieldContent, FieldDescription, FieldItem, FieldLabel, Radio, RadioGroup, Section, Text } from "@anaphor/system";
import { CatalogExample } from "./catalog-example";
import { RadioGroupPlayground, RadioRequiredExample } from "./radio-group-playground";

const choiceCode = `<Field orientation="vertical">
  <FieldLabel>Notification frequency</FieldLabel>
  <RadioGroup defaultValue="daily">
    <FieldItem orientation="horizontal">
      <Radio value="daily" />
      <FieldLabel>Daily digest</FieldLabel>
    </FieldItem>
    <FieldItem orientation="horizontal">
      <Radio value="weekly" />
      <FieldLabel>Weekly digest</FieldLabel>
    </FieldItem>
  </RadioGroup>
</Field>`;

export function RadioGroupDemo() {
  return <Section id="radio-group" className="border-t border-border py-12">
    <Text as="h2" variant="title">Radio group</Text>
    <Text as="p" variant="description" className="mt-3">Choose one option from a related set. Labels explain the choices; arrow keys move selection.</Text>
    <div className="mt-10 space-y-10">
      <CatalogExample title="States" description="Selected labels use primary text; unselected labels stay quieter. Read-only choices retain their selection, while disabled choices are subdued." code={`${choiceCode}

// Keep the selection fixed with RadioGroup readOnly.
// Disable every choice with Field disabled.`}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field orientation="vertical"><FieldLabel>Default frequency</FieldLabel><RadioGroup defaultValue="daily">
            <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel></FieldItem>
            <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
          </RadioGroup></Field>
          <Field orientation="vertical"><FieldLabel>Fixed frequency</FieldLabel><RadioGroup defaultValue="daily" readOnly>
            <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel></FieldItem>
            <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
          </RadioGroup></Field>
          <Field orientation="vertical" disabled><FieldLabel>Unavailable frequency</FieldLabel><RadioGroup defaultValue="daily">
            <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel></FieldItem>
            <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
          </RadioGroup></Field>
        </div>
      </CatalogExample>
      <CatalogExample title="With supporting text" code={`<FieldItem orientation="horizontal">
  <Radio value="daily" />
  <FieldContent>
    <FieldLabel>Daily digest</FieldLabel>
    <FieldDescription>A summary once a day.</FieldDescription>
  </FieldContent>
</FieldItem>`}>
        <Field orientation="vertical" className="max-w-96"><FieldLabel>Delivery frequency</FieldLabel><RadioGroup defaultValue="daily">
          <FieldItem orientation="horizontal"><Radio value="every" /><FieldContent><FieldLabel>Every update</FieldLabel><FieldDescription>Receive each update as it arrives.</FieldDescription></FieldContent></FieldItem>
          <FieldItem orientation="horizontal"><Radio value="daily" /><FieldContent><FieldLabel>Daily digest</FieldLabel><FieldDescription>A summary once a day.</FieldDescription></FieldContent></FieldItem>
          <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldContent><FieldLabel>Weekly digest</FieldLabel><FieldDescription>A summary once a week.</FieldDescription></FieldContent></FieldItem>
        </RadioGroup></Field>
      </CatalogExample>
      <CatalogExample title="Required choice" description="Submit without a selection to see the error and move focus to the first choice. Choosing an option clears the feedback." code={`<Field orientation="vertical" name="requiredFrequency" invalid={invalid}>
  <FieldLabel>Choose a frequency</FieldLabel>
  <RadioGroup value={value} required onValueChange={next => {
    setValue(next);
    setInvalid(false);
    setSaved(false);
  }}>
    {/* FieldItem choices */}
  </RadioGroup>
  <FieldError match={invalid}>Choose a notification frequency.</FieldError>
</Field>`}>
        <div className="max-w-96"><RadioRequiredExample /></div>
      </CatalogExample>
      <CatalogExample title="Unavailable option" description="A saved choice can become unavailable. Keep it visible while allowing another choice; keyboard navigation skips it." code={`<RadioGroup defaultValue="every">
  <FieldItem orientation="horizontal">
    <Radio value="daily" /><FieldLabel>Daily digest</FieldLabel>
  </FieldItem>
  <FieldItem orientation="horizontal" disabled>
    <Radio value="every" /><FieldLabel>Every update</FieldLabel>
  </FieldItem>
  <FieldItem orientation="horizontal">
    <Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel>
  </FieldItem>
</RadioGroup>`}>
        <Field orientation="vertical" className="max-w-96"><FieldLabel>Digest availability</FieldLabel><FieldDescription>The saved choice is unavailable. Choose a digest instead.</FieldDescription><RadioGroup defaultValue="every">
          <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel></FieldItem>
          <FieldItem orientation="horizontal" disabled><Radio value="every" /><FieldLabel>Every update</FieldLabel></FieldItem>
          <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
        </RadioGroup></Field>
      </CatalogExample>
      <div>
        <h3 className="font-sans text-ui font-medium normal-case text-muted-foreground">Playground</h3>
        <p className="mt-2 text-ui text-muted-foreground">Use Controls to explore availability, read-only selection, and validation. Save a preference to try the form interaction.</p>
        <RadioGroupPlayground />
      </div>
    </div>
  </Section>;
}
