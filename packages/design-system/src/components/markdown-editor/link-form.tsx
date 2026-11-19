"use client";

import { Button } from "../button";
import { Input } from "../input";

type LinkFormProps = {
  id: string;
  url: string;
  hasError: boolean;
  onUrlChange: (url: string) => void;
  onModalityChange: (isPointerAction: boolean) => void;
  onApply: () => void;
  onRemove: () => void;
};

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
