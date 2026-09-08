"use client";
import { useContext } from "react";
import { IntroContext, type IntroValue } from "./intro-context";

// keep a missing provider loud instead of silently losing the enhancement gate.
export function useIntro(): IntroValue {
  const value = useContext(IntroContext);
  if (!value) throw new Error("useIntro must be used inside <IntroProvider>");
  return value;
}
