"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { spring } from "motion";
import { animate } from "motion/mini";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { CheckCircle, CircleNotch, Info, Warning, X, XCircle } from "@phosphor-icons/react";
import { Button, ButtonLabel } from "./button";
import { cn } from "../lib/utils";

export const createToastManager = ToastPrimitive.createToastManager;
export const useToastManager = ToastPrimitive.useToastManager;
export const toast = createToastManager();

export type ToasterProps = ToastPrimitive.Provider.Props & {
  toastManager: NonNullable<ToastPrimitive.Provider.Props["toastManager"]>;
  position: "bottom-right" | "bottom-center" | "bottom-left" | "top-right" | "top-center" | "top-left";
  timeout: number;
  limit: number;
  viewportProps?: ToastPrimitive.Viewport.Props;
  portalProps?: ToastPrimitive.Portal.Props;
};

/** Mount once per manager. Base UI owns announcements, timers, focus and dragging. */
export function Toaster({ children, position, viewportProps, portalProps, ...props }: ToasterProps) {
  const [keyboardMotion, setKeyboardMotion] = useState(false);
  useEffect(() => {
    // Callers can create, update, or close notifications anywhere in the document.
    const keyboard = () => setKeyboardMotion(true);
    const pointer = () => setKeyboardMotion(false);
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("pointermove", pointer, true);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("pointermove", pointer, true);
    };
  }, []);
  return <ToastPrimitive.Provider {...props}>
    {children}
    <ToastPrimitive.Portal {...portalProps}>
      <ToastPrimitive.Viewport
        {...viewportProps}
        data-slot="toast-viewport"
        data-position={position}
        data-keyboard-motion={keyboardMotion || undefined}
        className={(state) => cn("anaphor-toast-viewport", typeof viewportProps?.className === "function" ? viewportProps.className(state) : viewportProps?.className)}
      >
        <ToastList position={position} />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  </ToastPrimitive.Provider>;
}

const statusIcons = new Map([
  ["success", <CheckCircle key="success" aria-hidden="true" className="anaphor-toast-icon" />],
  ["error", <XCircle key="error" aria-hidden="true" className="anaphor-toast-icon" />],
  ["warning", <Warning key="warning" aria-hidden="true" className="anaphor-toast-icon" />],
  ["info", <Info key="info" aria-hidden="true" className="anaphor-toast-icon" />],
  ["loading", <CircleNotch key="loading" aria-hidden="true" className="anaphor-toast-icon" />],
]);

function ToastList({ position }: Pick<ToasterProps, "position">) {
  const { toasts } = useToastManager();
  const swipeDirection: ToastPrimitive.Root.Props["swipeDirection"] = [position.startsWith("top") ? "up" : "down"];
  if (!position.endsWith("center")) swipeDirection.push(position.endsWith("right") ? "right" : "left");
  return toasts.map((notification) => <ToastItem key={notification.id} notification={notification} swipeDirection={swipeDirection} />);
}

function ToastItem({ notification, swipeDirection }: {
  notification: ToastPrimitive.Root.Props["toast"];
  swipeDirection: NonNullable<ToastPrimitive.Root.Props["swipeDirection"]> & string[];
}) {
  const { close } = useToastManager();
  const root = useRef<HTMLDivElement>(null);
  const recovery = useRef<ReturnType<typeof animate> | null>(null);
  const gesture = useRef<{
    id: number;
    pointerType: string;
    startX: number;
    startY: number;
    previous: { x: number; y: number; time: number };
    latest: { x: number; y: number; time: number };
  } | null>(null);
  const lifecycle = useRef(0);
  const [release, setRelease] = useState<{ transform: string; lifecycle: number } | null>(null);

  useLayoutEffect(() => {
    if (notification.transitionStatus !== "starting") return;
    const element = root.current;
    const pointer = gesture.current;
    if (element && pointer) {
      // Base UI must release its drag before a retained root starts another toast.
      element.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: pointer.id, pointerType: pointer.pointerType }));
    }
    gesture.current = null;
    lifecycle.current += 1;
    if (element) {
      delete element.dataset.flick;
      element.style.removeProperty("--toast-flick-transform");
    }
  }, [notification.transitionStatus]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!release || !element || notification.transitionStatus || release.lifecycle !== lifecycle.current) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const viewport = element.parentElement;
    const geometry = () => [element.style.getPropertyValue("--toast-index"), element.style.getPropertyValue("--toast-offset-y"), element.hasAttribute("data-expanded"), viewport?.getAttribute("data-position")].join(";");
    let lastGeometry = geometry();
    let animation: ReturnType<typeof animate>;
    const settle = () => {
      if (recovery.current !== animation) return;
      animation.cancel();
      element.style.removeProperty("transform");
      element.style.removeProperty("transition");
      recovery.current = null;
      observer.disconnect();
    };
    const recover = (from: string) => {
      // Read Base UI's live CSS target with the previous animation removed.
      element.style.transition = "none";
      const target = getComputedStyle(element).transform;
      const next = animate(element, { transform: [from, target] }, { type: spring, duration: 0.25, bounce: 0 });
      animation = next;
      recovery.current = next;
      void next.then(() => { if (animation === next) settle(); });
    };
    const observer = new MutationObserver(() => {
      const nextGeometry = geometry();
      if (nextGeometry === lastGeometry || recovery.current !== animation) return;
      lastGeometry = nextGeometry;
      const from = getComputedStyle(element).transform;
      animation.cancel();
      element.style.removeProperty("transform");
      recover(from);
    });
    observer.observe(element, { attributes: true, attributeFilter: ["style", "data-expanded"] });
    if (viewport) observer.observe(viewport, { attributes: true, attributeFilter: ["data-position"] });
    recover(release.transform);
    const reduce = () => { if (media.matches) settle(); };
    media.addEventListener("change", reduce);
    document.addEventListener("keydown", settle, true);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", reduce);
      document.removeEventListener("keydown", settle, true);
      settle();
    };
  }, [release, notification.transitionStatus]);

  function finish(event: Parameters<NonNullable<ToastPrimitive.Root.Props["onPointerUp"]>>[0]) {
    const current = gesture.current;
    if (!current) return;
    if (current.id !== event.pointerId) {
      event.preventBaseUIHandler();
      event.stopPropagation();
      return;
    }
    gesture.current = null;
    const element = event.currentTarget;
    const transform = getComputedStyle(element).transform;
    const elapsed = event.timeStamp - current.previous.time;
    const fresh = event.timeStamp - current.latest.time < 100;
    const vx = fresh && elapsed > 0 ? (event.clientX - current.previous.x) / elapsed : 0;
    const vy = fresh && elapsed > 0 ? (event.clientY - current.previous.y) / elapsed : 0;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    const direction = element.getAttribute("data-swipe-direction");
    const horizontal = direction === "right" || direction === "left";
    const sign = direction === "right" || direction === "down" ? 1 : -1;
    const distance = (horizontal ? dx : dy) * sign;
    const velocity = (horizontal ? vx : vy) * sign;
    if (event.type === "pointerup" && distance >= 8 && velocity > 0.5 && swipeDirection.some(allowed => allowed === direction)) {
      // Base UI handles distance dismissal; add recent outward velocity for short flicks.
      const outward = sign > 0 ? "calc(100% + 32px)" : "calc(-100% - 32px)";
      const travel = horizontal ? `translateX(${outward})` : `translateY(${outward})`;
      element.style.setProperty("--toast-flick-transform", `${transform} ${travel}`);
      element.dataset.flick = "";
      close(notification.id);
    } else {
      setRelease({ transform, lifecycle: lifecycle.current });
    }
  }

  return <ToastPrimitive.Root
      ref={root}
      toast={{ ...notification, actionProps: notification.actionProps && { ...notification.actionProps, children: <ButtonLabel>{notification.actionProps.children}</ButtonLabel> } }}
      data-slot="toast"
      className="anaphor-toast"
      swipeDirection={swipeDirection}
      onPointerDown={(event) => {
        if (gesture.current || !event.isPrimary) { event.preventBaseUIHandler(); event.stopPropagation(); return; }
        if (event.button !== 0 || (event.target instanceof Element && event.target.closest("button,a,input,textarea,[role=button],[data-base-ui-swipe-ignore],[data-swipe-ignore]"))) return;
        if (recovery.current) {
          const transform = getComputedStyle(event.currentTarget).transform;
          recovery.current.cancel();
          recovery.current = null;
          event.currentTarget.style.transform = transform;
        }
        event.currentTarget.style.removeProperty("transition");
        const point = { x: event.clientX, y: event.clientY, time: event.timeStamp };
        gesture.current = { id: event.pointerId, pointerType: event.pointerType, startX: point.x, startY: point.y, previous: point, latest: point };
      }}
      onPointerMove={(event) => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        current.previous = current.latest;
        current.latest = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={(event) => {
        if (gesture.current?.id !== event.pointerId) return;
        event.currentTarget.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: event.pointerId, pointerType: event.pointerType, clientX: event.clientX, clientY: event.clientY }));
      }}
    >
      <ToastPrimitive.Content className="anaphor-toast-content">
        {statusIcons.get(notification.type ?? "info") ?? statusIcons.get("info")}
        <div className="min-w-0 flex-1">
          <ToastPrimitive.Title className="font-sans text-ui font-medium normal-case">{notification.title ?? notification.description}</ToastPrimitive.Title>
          {notification.title != null && <ToastPrimitive.Description className="mt-1 text-small text-muted-foreground" />}
          {notification.actionProps && <ToastPrimitive.Action
            className="mt-3"
            render={<Button size="xs" shape="square" tone="neutral" variant="outline" loading={false} iconOnly={false} nativeButton={true} type="button" />}
          />}
        </div>
        <ToastPrimitive.Close aria-label="Dismiss notification" render={
          <Button size="xs" shape="round" tone="neutral" variant="ghost" loading={false} iconOnly={true} nativeButton={true} type="button" />
        }><X aria-hidden="true" /></ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>;
}
