"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";

const defaultMobileQuery = "(max-width: 47.999rem)";
const mediaQueries = new Map<string, MediaQueryList>();

function getMediaQuery(query: string) {
  if (typeof window === "undefined") return null;
  const existing = mediaQueries.get(query);
  if (existing) return existing;
  const mediaQuery = window.matchMedia(query);
  mediaQueries.set(query, mediaQuery);
  return mediaQuery;
}

function useMediaQuery(query: string) {
  const subscribe = useCallback((notify: () => void) => {
    const mediaQuery = getMediaQuery(query);
    mediaQuery?.addEventListener("change", notify);
    return () => mediaQuery?.removeEventListener("change", notify);
  }, [query]);
  const getSnapshot = useCallback(() => getMediaQuery(query)?.matches ?? false, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

type AdaptiveSurfaceContextValue = {
  desktopOpen: boolean;
  mobile: boolean;
  mobileOpen: boolean;
  setDesktopOpen: (open: boolean) => void;
  setMobileOpen: (open: boolean) => void;
};

const AdaptiveSurfaceContext = createContext<AdaptiveSurfaceContextValue | null>(null);

type AdaptiveSurfaceProviderProps = {
  children: ReactNode;
  desktopOpen: boolean;
  mobileOpen: boolean;
  mobileQuery?: string;
  onDesktopOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean) => void;
};

function AdaptiveSurfaceProvider({
  children,
  desktopOpen,
  mobileOpen,
  mobileQuery = defaultMobileQuery,
  onDesktopOpenChange,
  onMobileOpenChange,
}: AdaptiveSurfaceProviderProps) {
  const mobile = useMediaQuery(mobileQuery);
  const currentOpen = mobile ? mobileOpen : desktopOpen;

  return (
    <AdaptiveSurfaceContext
      value={{
        desktopOpen,
        mobile,
        mobileOpen,
        setDesktopOpen: onDesktopOpenChange,
        setMobileOpen: onMobileOpenChange,
      }}
    >
      <Dialog.Root
        modal={mobile}
        open={currentOpen}
        onOpenChange={(nextOpen) => {
          if (mobile) onMobileOpenChange(nextOpen);
          else onDesktopOpenChange(nextOpen);
        }}
      >
        {children}
      </Dialog.Root>
    </AdaptiveSurfaceContext>
  );
}

function useAdaptiveSurface() {
  const context = useContext(AdaptiveSurfaceContext);
  if (!context) throw new Error("Adaptive surface parts must be rendered inside AdaptiveSurfaceProvider");
  return context;
}

type AdaptiveSurfacePopupProps = useRender.ComponentProps<"div"> &
  Pick<ComponentProps<typeof Dialog.Popup>, "finalFocus" | "initialFocus">;

function AdaptiveSurfacePopup({ finalFocus, initialFocus, render, ...props }: AdaptiveSurfacePopupProps) {
  const { mobile } = useAdaptiveSurface();
  const desktopPopup = useRender({ defaultTagName: "div", render, props });
  if (!mobile) return desktopPopup;
  return <Dialog.Popup data-slot="adaptive-surface-popup" finalFocus={finalFocus} initialFocus={initialFocus} render={render} {...props} />;
}

function AdaptiveSurfacePortal({ className, ...props }: ComponentProps<typeof Dialog.Portal>) {
  const { mobile } = useAdaptiveSurface();
  if (!mobile) return <>{props.children}</>;
  return <Dialog.Portal className={className ?? "contents"} {...props} />;
}

function AdaptiveSurfaceBackdrop(props: ComponentProps<typeof Dialog.Backdrop>) {
  const { mobile } = useAdaptiveSurface();
  if (!mobile) return null;
  return <Dialog.Backdrop data-slot="adaptive-surface-backdrop" {...props} />;
}

function AdaptiveSurfaceClose(props: ComponentProps<typeof Dialog.Close>) {
  const { mobile } = useAdaptiveSurface();
  if (!mobile) return null;
  return <Dialog.Close data-slot="adaptive-surface-close" {...props} />;
}

function AdaptiveSurfaceTrigger(props: ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger data-slot="adaptive-surface-trigger" {...props} />;
}

export {
  AdaptiveSurfaceBackdrop,
  AdaptiveSurfaceClose,
  AdaptiveSurfacePopup,
  AdaptiveSurfacePortal,
  AdaptiveSurfaceProvider,
  AdaptiveSurfaceTrigger,
  useAdaptiveSurface,
  type AdaptiveSurfaceProviderProps,
};
