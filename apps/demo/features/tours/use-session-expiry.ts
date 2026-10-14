"use client";

import { useEffect, useState } from "react";
import { focusManager } from "@tanstack/react-query";

export function useSessionExpiry(
  expiresAt: number,
  onExpire: () => void,
  enabled: boolean,
) {
  const [mountedAt] = useState(Date.now);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(onExpire, Math.max(0, expiresAt - Date.now()));
    const unsubscribe = focusManager.subscribe((focused) => {
      if (focused && Date.now() >= expiresAt) onExpire();
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [enabled, expiresAt, onExpire]);

  return expiresAt <= mountedAt;
}
