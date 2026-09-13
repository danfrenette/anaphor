"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";

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
  dialogHandle: ReturnType<typeof Dialog.createHandle>;
  mobile: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean, eventDetails?: Dialog.Root.ChangeEventDetails) => void;
  setDesktopOpen: (open: boolean) => void;
  setMobileOpen: (open: boolean) => void;
};

const AdaptiveSurfaceContext = createContext<AdaptiveSurfaceContextValue | null>(null);

type AdaptiveSurfaceProviderProps = {
  children: ReactNode;
  desktopOpen: boolean;
  mobileOpen: boolean;
  mobileQuery: string;
  onDesktopOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean, eventDetails?: Dialog.Root.ChangeEventDetails) => void;
};

function AdaptiveSurfaceProvider({
  children,
  desktopOpen,
  mobileOpen,
  mobileQuery,
  onDesktopOpenChange,
  onMobileOpenChange,
}: AdaptiveSurfaceProviderProps) {
  const mobile = useMediaQuery(mobileQuery);
  const [dialogHandle] = useState(() => Dialog.createHandle());
  return (
    <AdaptiveSurfaceContext
      value={{
        desktopOpen,
        dialogHandle,
        mobile,
        mobileOpen,
        onMobileOpenChange,
        setDesktopOpen: (nextOpen) => onDesktopOpenChange(nextOpen),
        setMobileOpen: (nextOpen) => onMobileOpenChange(nextOpen),
      }}
    >
      {children}
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
  const { dialogHandle, mobile, mobileOpen, onMobileOpenChange } = useAdaptiveSurface();
  if (!mobile) return <>{props.children}</>;
  return (
    <Dialog.Root
      handle={dialogHandle}
      modal
      open={mobileOpen}
      onOpenChange={(nextOpen, eventDetails) => onMobileOpenChange(nextOpen, eventDetails)}
    >
      <Dialog.Portal className={className ?? "contents"} {...props} />
    </Dialog.Root>
  );
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
  const { dialogHandle, mobile } = useAdaptiveSurface();
  const desktopTrigger = useRender({ defaultTagName: "button", props: { "data-slot": "adaptive-surface-trigger", ...props } });
  if (!mobile) return desktopTrigger;
  return <Dialog.Trigger data-slot="adaptive-surface-trigger" handle={dialogHandle} {...props} />;
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
