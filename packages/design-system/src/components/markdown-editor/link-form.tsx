"use client";

import { Button } from "../button";
import { Input } from "../input";

type LinkFormProps = {
  /** Ids the error message; the label and URL field add suffixes. Kept across reopening. */
  id: string;
  url: string;
  hasError: boolean;
  onUrlChange: (url: string) => void;
  /** Reports whether each input in the form comes from a pointer or the keyboard. */
  onModalityChange: (isPointerAction: boolean) => void;
  onApply: () => void;
  onRemove: () => void;
};

/** The selection bubble's URL form, shown in place of the mark buttons while editing a link. */
function LinkForm({
  id: linkErrorId,
  url,
  hasError,
  onUrlChange,
  onModalityChange,
  onApply,
  onRemove,
}: LinkFormProps) {
  return (
    <form
      onPointerDownCapture={() => onModalityChange(true)}
      onKeyDownCapture={() => onModalityChange(false)}
      onSubmit={event => {
        event.preventDefault();
        onApply();
      }}
    >
      <label id={`${linkErrorId}-label`} htmlFor={`${linkErrorId}-input`}>URL</label>
      {/* The form mounts when link editing starts; React focuses the URL as it inserts it. */}
      <Input
        autoFocus
        id={`${linkErrorId}-input`}
        size="sm"
        aria-labelledby={`${linkErrorId}-label`}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? linkErrorId : undefined}
        value={url}
        onChange={event => onUrlChange(event.target.value)}
      />
      <Button
        nativeButton
        type="submit"
        variant="ghost"
        tone="neutral"
        size="sm"
        shape="square"
        iconOnly={false}
        loading={false}
      >
        Apply
      </Button>
      {hasError && <span id={linkErrorId}>Enter a safe URL.</span>}
      <Button
        nativeButton
        type="button"
        variant="ghost"
        tone="neutral"
        size="sm"
        shape="square"
        iconOnly={false}
        loading={false}
        onClick={onRemove}
      >
        Remove link
      </Button>
    </form>
  );
}

export {
  LinkForm,
};
