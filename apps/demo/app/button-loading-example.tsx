"use client";

import { Button, ButtonLabel } from "@anaphor/system";
import { useEffect, useState } from "react";

export function ButtonLoadingExample({ disabledWhileLoading = false }: { disabledWhileLoading?: boolean }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <Button
      loading={loading}
      disabled={disabledWhileLoading && loading}
      onClick={() => setLoading(true)}
    >
      <ButtonLabel>Try loading</ButtonLabel>
    </Button>
  );
}
