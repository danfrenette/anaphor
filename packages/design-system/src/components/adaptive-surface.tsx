"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type CSSProperties,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

const mediaQueries = new Map<string, MediaQueryList>();

function getMediaQuery(query: string) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
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
  mobileModal: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean, eventDetails?: Dialog.Root.ChangeEventDetails) => void;
  setDesktopOpen: (open: boolean) => void;
  setMobileOpen: (open: boolean) => void;
};

const AdaptiveSurfaceContext = createContext<AdaptiveSurfaceContextValue | null>(null);

type AdaptiveSurfaceProviderProps = {
  children: ReactNode;
  desktopOpen: boolean;
  mobileDisablePointerDismissal?: boolean;
  mobileModal?: boolean;
  mobileOpen: boolean;
  mobileQuery: string;
  onDesktopOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean, eventDetails?: Dialog.Root.ChangeEventDetails) => void;
};

function AdaptiveSurfaceProvider({
  children,
  desktopOpen,
  mobileDisablePointerDismissal = false,
  mobileModal = true,
  mobileOpen,
  mobileQuery,
  onDesktopOpenChange,
  onMobileOpenChange,
}: AdaptiveSurfaceProviderProps) {
  const mobile = useMediaQuery(mobileQuery);
  return (
    <AdaptiveSurfaceContext
      value={{
        desktopOpen,
        mobile,
        mobileModal,
        mobileOpen,
        onMobileOpenChange,
        setDesktopOpen: (nextOpen) => onDesktopOpenChange(nextOpen),
        setMobileOpen: (nextOpen) => onMobileOpenChange(nextOpen),
      }}
    >
      <Dialog.Root
        disablePointerDismissal={mobileDisablePointerDismissal}
        modal={mobileModal}
        open={mobile && mobileOpen}
        onOpenChange={(nextOpen, eventDetails) => {
          if (mobile) onMobileOpenChange(nextOpen, eventDetails);
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
  const { mobile, mobileModal, mobileOpen } = useAdaptiveSurface();
  const desktopPopup = useRender({ defaultTagName: "div", render, props });
  if (!mobile) return desktopPopup;
  return <Dialog.Popup data-shortcut-modal={mobileModal && mobileOpen ? "" : undefined} data-slot="adaptive-surface-popup" finalFocus={finalFocus} initialFocus={initialFocus} render={render} {...props} />;
}

function AdaptiveSurfacePortal({ className, ...props }: ComponentProps<typeof Dialog.Portal>) {
  const { mobile } = useAdaptiveSurface();
  return mobile ? <Dialog.Portal className={className ?? "contents"} {...props} /> : props.children;
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

type AdaptiveSurfaceTriggerProps = Omit<ComponentProps<typeof Dialog.Trigger>, "className" | "render" | "style"> & {
  className?: string;
  render?: ReactElement;
  style?: CSSProperties;
};

function AdaptiveSurfaceTrigger({ render, ...props }: AdaptiveSurfaceTriggerProps) {
  const { mobile } = useAdaptiveSurface();
  const desktopTrigger = useRender({
    defaultTagName: "button",
    render,
    props: { "data-slot": "adaptive-surface-trigger", ...props },
  });
  if (!mobile) return desktopTrigger;
  return <Dialog.Trigger data-slot="adaptive-surface-trigger" render={render} {...props} />;
}

export {
  AdaptiveSurfaceBackdrop,
  AdaptiveSurfaceClose,
  AdaptiveSurfacePopup,
  AdaptiveSurfacePortal,
  AdaptiveSurfaceProvider,
  AdaptiveSurfaceTrigger,
  useAdaptiveSurface,
  useMediaQuery,
  type AdaptiveSurfaceProviderProps,
  type AdaptiveSurfaceTriggerProps,
};
