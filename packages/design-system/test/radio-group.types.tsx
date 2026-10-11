import { FieldItem, Radio, RadioGroup, type RadioGroupProps, type RadioProps } from "@anaphor/system";
import { createRef } from "react";
import { expectTypeOf } from "vitest";

const group = createRef<HTMLDivElement>();
const control = createRef<HTMLSpanElement>();
const input = createRef<HTMLInputElement>();
<RadioGroup value={1} ref={group} inputRef={input} onValueChange={(value, details) => {
  expectTypeOf(value).toEqualTypeOf<number>();
  details.cancel();
}}><Radio value={1} ref={control} inputRef={input} /></RadioGroup>;

const numericGroup: RadioGroupProps<number> = { defaultValue: 1, onValueChange: value => { expectTypeOf(value).toEqualTypeOf<number>(); } };
const numericRadio: RadioProps<number> = { value: 1 };
<RadioGroup {...numericGroup}><Radio {...numericRadio} nativeButton render={<button type="button" />} /></RadioGroup>;
// @ts-expect-error Values follow the consumer's declared type.
<RadioGroup<number> value="weekly" />;
// @ts-expect-error Each radio requires an identifying value.
<Radio />;
<FieldItem orientation="horizontal" disabled />;
// @ts-expect-error Field layout is explicitly configured like Field itself.
<FieldItem />;
