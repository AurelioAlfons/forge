"use client";

import { createContext } from "react";

export type IntroPhase = "booting" | "revealing" | "ready";

export type IntroValue = {
  phase: IntroPhase;
  reducedMotion: boolean;
  /** the pc sequence calls this the moment frame 01 can actually be drawn */
  markFirstFrameReady: () => void;
  /** the reveal timeline's onComplete */
  markRevealComplete: () => void;
};

export const IntroContext = createContext<IntroValue | null>(null);

/** The fan sweep ticks every frame, so it gets its own channel — otherwise the
 *  whole page re-renders 60 times a second while the loader is up. */
export const IntroHoldContext = createContext(0);
