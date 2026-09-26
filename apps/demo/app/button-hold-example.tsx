"use client";

import { Trash } from "@phosphor-icons/react";
import { Button, ButtonLabel, HoldButton } from "@anaphor/system";
import { useState } from "react";

export function ButtonHoldExample() {
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return (
      <div className="flex flex-wrap items-center gap-3" role="status">
        <span className="text-ui text-muted-foreground">Example item deleted.</span>
        <Button nativeButton={true} type="button" iconOnly={false} loading={false} variant="ghost" tone="neutral" shape="square" size="md" onClick={() => setDeleted(false)}><ButtonLabel>Restore item</ButtonLabel></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <HoldButton
        duration={2000}
        shape="square"
        size="md"
        onHoldComplete={() => setDeleted(true)}
        aria-describedby="hold-delete-help"
      >
        <Trash aria-hidden="true" /><ButtonLabel>Hold to delete</ButtonLabel>
      </HoldButton>
      <p id="hold-delete-help" className="text-small text-muted-foreground">
        Press and hold for 2 seconds. Release early to cancel.
      </p>
    </div>
  );
}
