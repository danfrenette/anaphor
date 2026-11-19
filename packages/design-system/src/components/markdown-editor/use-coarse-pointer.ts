"use client";

import { useSyncExternalStore } from "react";

const coarsePointerQuery = "(pointer: coarse)";

function subscribe(onChange: () => void) {
  if (!window.matchMedia) return () => {};

  const query = window.matchMedia(coarsePointerQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  if (!window.matchMedia) return false;

  return window.matchMedia(coarsePointerQuery).matches;
}

function getServerSnapshot() {
  return false;
}

function useCoarsePointer() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export {
  useCoarsePointer,
};
