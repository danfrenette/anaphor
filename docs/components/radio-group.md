# Radio Group

RadioGroup and Radio provide one choice from a related set. The manual demonstrates
notification frequency: Every update, Daily digest, or Weekly digest.
[ANAPHOR-234](https://linear.app/anaphor/issue/ANAPHOR-234/radio-group) owns the scope.

```tsx
import { Radio, RadioGroup } from "@anaphor/system";

<RadioGroup name="frequency" defaultValue="daily" aria-label="Notification frequency">
  <label><Radio value="every" />Every update</label>
  <label><Radio value="daily" />Daily digest</label>
  <label><Radio value="weekly" />Weekly digest</label>
</RadioGroup>
```

Use `defaultValue` for uncontrolled state, or `value` and `onValueChange` for
consumer-owned state. Generic value/callback inference, refs, `inputRef`, `render`,
state-aware `className`, `disabled`, `readOnly`, `required`, and native form
association are preserved. For a native button, supply `nativeButton` and
`render={<button type="button" />}`. With wrapping labels, use Base UI's render
callback pattern to keep the hidden input outside the label when rendering a button.

The built-in indicator is a dot. RadioGroup's initial layout is vertical; callers
can change it through `className`. Each radio needs a unique value and accessible
label, and the group needs its own name. No size/variant, mixed state, card-choice,
segmented-control, compatibility alias, or CheckboxGroup paint gesture is added.

## Field composition

One Field owns group validation and the form name. FieldItem separates each
option's label and description. Its `orientation` is required, like Field's.
FieldContent provides Checkbox's familiar horizontal supporting-text layout.

```tsx
import {
  Field, FieldItem, FieldContent, FieldLabel, FieldDescription, FieldError,
  RadioGroup, Radio,
} from "@anaphor/system";

<Field orientation="vertical" name="frequency">
  <FieldLabel>Notification frequency</FieldLabel>
  <RadioGroup defaultValue="daily" required>
    <FieldItem orientation="horizontal">
      <Radio value="daily" />
      <FieldContent>
        <FieldLabel>Daily digest</FieldLabel>
        <FieldDescription>A summary once a day.</FieldDescription>
      </FieldContent>
    </FieldItem>
    <FieldItem orientation="horizontal">
      <Radio value="weekly" />
      <FieldLabel>Weekly digest</FieldLabel>
    </FieldItem>
  </RadioGroup>
  <FieldError />
</Field>
```

Field's `validate`, `validationMode`, and externally controlled `invalid` apply
to the group value. Its name takes precedence over RadioGroup's. Native FormData
contains the selected enabled value once; an unselected or disabled group adds
no value. `required` supplies native constraints. The manual's required example
uses a local submit handler for explicit feedback and does not persist settings.

Disabled Field, RadioGroup, FieldItem, and Radio states block selection and are
skipped by keyboard focus. Read-only choices retain focus access and selection.
Arrows select enabled options, Space selects the focused option, and Tab leaves
the group. Selection and the dot are immediate; color feedback follows Checkbox's
reduced-motion treatment.

## Appearance and distribution

The 20px circle uses Checkbox's 2px boundary, theme and mark tokens, validation and
disabled states, visible focus, expanded touch target, and forced-color treatment.
No new color tokens are introduced.

Install `danfrenette/anaphor/radio-group` with shadcn for native-label composition.
Also install `danfrenette/anaphor/field` for the Field example, or install `ui` for
the complete system. Registry items supply their runtime and source dependencies.

[Base UI Radio Group](https://base-ui.com/react/components/radio-group) owns
selection, keyboard, and forms. [Coss Radio Group](https://coss.com/ui/docs/components/radio-group)
informs the thin RadioGroup/Radio structure and built-in indicator; Checkbox is
the visual reference. The wrapper corrects Base UI 1.9.0's disabled selected item
remaining in Tab order while preserving consumer render composition.

Use the [verification recipe](../verification/radio-group.md) for package,
manual-browser, and installed-source checks.
