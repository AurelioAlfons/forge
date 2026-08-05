"use client";

import { useContext } from "react";
import {
  IntroContext,
  IntroHoldContext,
  type IntroValue,
} from "./intro-context";

/** Reads the intro phase. Throws outside the provider so a stray mount is loud. */
export function useIntro(): IntroValue {
  const value = useContext(IntroContext);
  if (!value) {
    throw new Error("useIntro must be used inside <IntroProvider>");
  }
  return value;
}

/** Only the boot loader wants this — everything else would just thrash. */
export function useIntroHoldProgress() {
  return useContext(IntroHoldContext);
}
