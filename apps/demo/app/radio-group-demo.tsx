import { Field, FieldDescription, FieldItem, FieldLabel, Radio, RadioGroup, Section, Text } from "@anaphor/system";
import { RadioGroupPlayground, RadioRequiredExample } from "./radio-group-playground";

export function RadioGroupDemo() {
  return <Section id="radio-group" className="border-t border-border py-12">
    <Text as="h2" variant="title">Radio group</Text>
    <Text as="p" variant="description" className="mt-3">Choose one option from a related set. Labels explain the choices; arrow keys move selection.</Text>
    <div className="mt-8"><RadioGroupPlayground /></div>
    <Text as="h3" variant="heading" className="mt-8">Required choice</Text>
    <RadioRequiredExample />
    <div className="mt-8 grid gap-8 sm:grid-cols-2">
      <div><Text as="h3" variant="heading">Read only</Text>
        <Field orientation="vertical" className="mt-4"><FieldLabel>Fixed frequency</FieldLabel><RadioGroup defaultValue="daily" readOnly>
          <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel></FieldItem>
          <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
        </RadioGroup></Field>
      </div>
      <div><Text as="h3" variant="heading">Unavailable</Text>
        <Field orientation="vertical" disabled className="mt-4"><FieldLabel>Unavailable frequency</FieldLabel><RadioGroup defaultValue="daily">
          <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel></FieldItem>
          <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
        </RadioGroup></Field>
      </div>
    </div>
    <Text as="h3" variant="heading" className="mt-8">Unavailable option</Text>
    <Field orientation="vertical" className="mt-4"><FieldLabel>Digest availability</FieldLabel><FieldDescription>The saved choice is unavailable. Choose a digest instead.</FieldDescription><RadioGroup defaultValue="every">
      <FieldItem orientation="horizontal"><Radio value="daily" /><FieldLabel>Daily digest</FieldLabel></FieldItem>
      <FieldItem orientation="horizontal" disabled><Radio value="every" /><FieldLabel>Every update</FieldLabel></FieldItem>
      <FieldItem orientation="horizontal"><Radio value="weekly" /><FieldLabel>Weekly digest</FieldLabel></FieldItem>
    </RadioGroup></Field>
  </Section>;
}
