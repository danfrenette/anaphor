"use client";

import { MorphSurface } from "@design-language/system";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DemoContext, cardDefaults, inputDefaults } from "./demo-state";
import { ButtonControlFields, buttonDefaults, Check, Select } from "./button-playground";

type ComponentId = "button" | "card" | "input";

export function DemoControlsProvider({ children }: { children: ReactNode }) {
  const [button, setButton] = useState(buttonDefaults);
  const [input, setInput] = useState(inputDefaults);
  const [card, setCard] = useState(cardDefaults);
  const [active, setActive] = useState<ComponentId | null>(null);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (dragging.current || panel.current?.querySelector('[role="region"]')?.contains(document.activeElement)) return;
      const line = window.innerHeight / 3;
      const current = (["button", "card", "input"] as const).find((id) => {
        const bounds = document.getElementById(id)?.getBoundingClientRect();
        return bounds && bounds.top <= line && bounds.bottom > line;
      });
      setActive(current ?? null);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const release = () => { dragging.current = false; schedule(); };
    refresh.current = schedule;
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  return (
    <DemoContext value={{ button, setButton, card, setCard, input, setInput }}>
      {children}
      {active && (
        <div
          ref={panel}
          className="fixed right-4 bottom-4 z-30"
          onPointerDown={() => { dragging.current = true; }}
          onBlur={() => refresh.current()}
        >
          <MorphSurface open={open} onOpenChange={setOpen} icon={<SlidersHorizontal />} title={`${active.charAt(0).toUpperCase() + active.slice(1)} controls`}>
            {active === "button" ? <ButtonControlFields /> : active === "input" ? (
              <div className="grid gap-3">
                <Select label="Size" value={input.size} options={["sm", "md", "lg"]} onChange={(size) => setInput((current) => ({ ...current, size: size }))} />
                <Select label="Type" value={input.type} options={["text", "email", "password", "search"]} onChange={(type) => setInput((current) => ({ ...current, type: type }))} />
                {(["disabled", "readOnly", "invalid"] as const).map((key) => (
                  <Check key={key} label={key === "readOnly" ? "Read only" : key.charAt(0).toUpperCase() + key.slice(1)} checked={input[key]} onChange={(value) => setInput((current) => ({ ...current, [key]: value }))} />
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                <Select label="Title font" value={card.mono ? "mono" : "sans"} options={["sans", "mono"]} onChange={(value) => setCard((current) => ({ ...current, mono: value === "mono" }))} />
                {(["description", "action", "footer"] as const).map((key) => (
                  <Check key={key} label={key === "action" ? "Header action" : key.charAt(0).toUpperCase() + key.slice(1)} checked={card[key]} onChange={(value) => setCard((current) => ({ ...current, [key]: value }))} />
                ))}
              </div>
            )}
            <button className="mt-4 min-h-11 rounded-md px-2 font-mono text-label uppercase" type="button" onClick={() => active === "button" ? setButton(buttonDefaults) : active === "card" ? setCard(cardDefaults) : setInput(inputDefaults)}>Reset controls</button>
          </MorphSurface>
        </div>
      )}
    </DemoContext>
  );
}
