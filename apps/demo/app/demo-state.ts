"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { ButtonControls } from "./button-playground";

export type CardControls = { mono: boolean; description: boolean; action: boolean; footer: boolean };
export const cardDefaults: CardControls = { mono: false, description: true, action: true, footer: true };
export type InputControls = { size: "sm" | "md" | "lg"; type: "text" | "email" | "password" | "search"; disabled: boolean; readOnly: boolean; invalid: boolean };
export const inputDefaults: InputControls = { size: "md", type: "text", disabled: false, readOnly: false, invalid: false };
type DemoState = {
  input: InputControls;
  setInput: Dispatch<SetStateAction<InputControls>>;
  button: ButtonControls;
  setButton: Dispatch<SetStateAction<ButtonControls>>;
  card: CardControls;
  setCard: Dispatch<SetStateAction<CardControls>>;
};
export const DemoContext = createContext<DemoState | null>(null);

export function useDemoControls() {
  const state = useContext(DemoContext);
  if (!state) throw new Error("Demo controls must be inside DemoControlsProvider");
  return state;
}
