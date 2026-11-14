import { ButtonLabel, TagButton, type TagButtonProps } from "@anaphor/system";
import { createRef } from "react";

const tag = { size: "xs", tone: "neutral", variant: "soft", loading: false } satisfies TagButtonProps;
<TagButton {...tag} ref={createRef<HTMLButtonElement>()} onClick={event => event.currentTarget.focus()} className={state => state.disabled ? "opacity-50" : ""}>
  <ButtonLabel>Research</ButtonLabel>
</TagButton>;
// @ts-expect-error The pill owns its round shape.
<TagButton {...tag} shape="square" />;
// @ts-expect-error A tag action cannot submit a form.
<TagButton {...tag} type="submit" />;
// @ts-expect-error TagButton is a native action with no render override.
<TagButton {...tag} render={<a href="#origin" />} />;
// @ts-expect-error Text-bearing tag actions own their iconOnly configuration.
<TagButton {...tag} iconOnly={true} />;
const { loading, ...withoutLoading } = tag;
void loading;
// @ts-expect-error Loading remains an explicit state choice.
<TagButton {...withoutLoading} />;
