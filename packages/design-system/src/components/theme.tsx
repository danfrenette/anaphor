"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from "next-themes";
import { useRef, useSyncExternalStore, type ComponentProps } from "react";
import { flushSync } from "react-dom";
import { cn } from "../lib/utils";

const subscribe = () => () => {};

/** Class-based themes, with system preference and a persisted user choice. */
function ThemeProvider(props: Omit<ComponentProps<typeof NextThemeProvider>, "attribute">) {
  return <NextThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange storageKey="anaphor-theme" {...props} attribute="class" />;
}

function useTheme() {
  const theme = useNextTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const transitioning = useRef(false);

  async function toggleTheme(origin?: HTMLElement, { animate = true }: { animate?: boolean } = {}) {
    if (transitioning.current) return;
    const next = theme.resolvedTheme === "dark" ? "light" : "dark";
    const apply = () => flushSync(() => theme.setTheme(next));
    if (!animate || !document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }
    transitioning.current = true;
    const rect = origin?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;
    root.dataset.themeTransition = "";
    const transition = document.startViewTransition(apply);
    let reveal: Animation | undefined;
    try {
      await transition.ready;
      reveal = root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, {
        duration: 350,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "both",
        pseudoElement: "::view-transition-new(root)",
      });
      await reveal.finished;
    } catch {
      // A hidden document or interrupted animation still commits the theme.
      transition.skipTransition();
    } finally {
      await transition.finished;
      reveal?.cancel();
      delete root.dataset.themeTransition;
      transitioning.current = false;
    }
  }

  return { ...theme, mounted, toggleTheme };
}

function ThemeToggle({ className, children, disabled, onClick, ...props }: ComponentProps<"button">) {
  const { resolvedTheme, mounted, toggleTheme } = useTheme();
  const dark = mounted && resolvedTheme === "dark";
  return <button {...props} type="button" disabled={!mounted || disabled}
    aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) void toggleTheme(event.currentTarget, { animate: event.detail !== 0 }); }}
    className={cn("transition-[color,background-color] duration-150 ease-out hover:bg-background/50 focus-visible:transition-none motion-reduce:transition-none inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-ui focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-45 [&>svg]:size-4", className)}>
    {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}{children ?? "Theme"}
  </button>;
}

export { ThemeProvider, ThemeToggle, useTheme };
