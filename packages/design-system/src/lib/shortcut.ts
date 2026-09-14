"use client";

import { createSequenceMatcher, type Hotkey } from "@tanstack/react-hotkeys";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export type ShortcutBinding = Hotkey | readonly [Hotkey, ...Hotkey[]];
export type ShortcutOptions = {
  enabled?: boolean;
  scope?: RefObject<HTMLElement | null>;
  /** Allow this scope to respond when focus is outside it. */
  defaultScope?: boolean;
  allowInInputs?: boolean;
  allowInWidgets?: boolean;
  repeat?: boolean;
  timeout?: number;
  preventDefault?: boolean;
  /** Additional ownership rule, evaluated before sequence matching. */
  when?: (event: KeyboardEvent) => boolean;
};

type Registration = {
  matcher: ReturnType<typeof createSequenceMatcher>;
  sequence: boolean;
  current: { callback: (event: KeyboardEvent) => void; options: ShortcutOptions };
};

const registrations = new Set<Registration>();
const widgets = '[role="menu"], [role="menubar"], [role="listbox"], [role="combobox"], [role="tree"], [role="grid"], [role="tablist"], [role="slider"], [data-shortcuts="off"]';

function resetSequences() {
  for (const entry of registrations) entry.matcher.reset();
}

function canHandle(entry: Registration, event: KeyboardEvent, target: Element) {
  const options = entry.current.options;
  const scope = options.scope?.current;
  if (options.enabled === false || (options.scope && !scope)) return false;
  if (scope && !scope.contains(target) && !options.defaultScope) return false;
  if (!options.allowInInputs && (target.closest('input, textarea, select') || (target instanceof HTMLElement && target.isContentEditable) || target.closest('[contenteditable]:not([contenteditable="false"])'))) return false;
  if (!options.allowInWidgets && target.closest(widgets)) return false;
  // Modal content can own shortcuts; the page underneath it cannot.
  const modal = [...target.ownerDocument.querySelectorAll('dialog[open], [aria-modal="true"], [data-shortcut-modal]')]
    .filter(element => !element.closest('[hidden], [inert], [aria-hidden="true"]')).at(-1);
  if (modal && (!scope || !modal.contains(scope) || !modal.contains(target))) return false;
  return options.when?.(event) ?? true;
}

function dispatch(event: KeyboardEvent) {
  const target = event.composedPath()[0];
  if (event.defaultPrevented || event.isComposing || !(target instanceof Element)) {
    resetSequences();
    return;
  }
  const candidates = [...registrations].filter((entry) => {
    if (canHandle(entry, event, target)) return true;
    entry.matcher.reset();
    return false;
  });
  // A focused inner scope wins over its ancestors and page-wide shortcuts.
  const depth = (entry: Registration) => {
    let scope = entry.current.options.scope?.current;
    if (!scope?.contains(target)) return 0;
    let result = 1;
    while ((scope = scope.parentElement)) result++;
    return result;
  };
  candidates.sort((a, b) => depth(b) - depth(a));
  let handled = false;
  let claimedDepth: number | null = null;
  for (const entry of candidates) {
    const scopeDepth = depth(entry);
    if (handled || (claimedDepth !== null && scopeDepth < claimedDepth)) {
      entry.matcher.reset();
      continue;
    }
    if (event.repeat && (entry.sequence || !entry.current.options.repeat)) continue;
    const complete = entry.matcher.match(event);
    if (!complete && entry.matcher.getProgress() === 0) continue;
    claimedDepth = scopeDepth;
    if (entry.current.options.preventDefault !== false) event.preventDefault();
    if (complete) {
      handled = true;
      entry.current.callback(event);
    }
  }
}

/** TanStack syntax: "Mod+B", "Shift+G", or ["G", "G"]. No provider required. */
export function useShortcut(binding: ShortcutBinding | null, callback: (event: KeyboardEvent) => void, options: ShortcutOptions = {}) {
  const current = useRef({ binding, callback, options });
  useLayoutEffect(() => { current.current = { binding, callback, options }; });
  const key = JSON.stringify(binding);
  const { enabled = true, timeout = 1000 } = options;
  useEffect(() => {
    const value = current.current.binding;
    if (!value || !enabled) return;
    const keys = typeof value === "string" ? [value] : [...value];
    const entry: Registration = {
      matcher: createSequenceMatcher(keys, { timeout }),
      sequence: keys.length > 1,
      get current() { return current.current; },
    };
    if (registrations.size === 0) {
      document.addEventListener("keydown", dispatch);
      document.addEventListener("focusin", resetSequences);
      window.addEventListener("blur", resetSequences);
    }
    registrations.add(entry);
    return () => {
      registrations.delete(entry);
      if (registrations.size === 0) {
        document.removeEventListener("keydown", dispatch);
        document.removeEventListener("focusin", resetSequences);
        window.removeEventListener("blur", resetSequences);
      }
    };
  }, [key, enabled, timeout]);
}
