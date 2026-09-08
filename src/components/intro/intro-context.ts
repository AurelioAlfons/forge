"use client";

import { createContext } from "react";
import type { Capabilities } from "@/lib/performance/capabilities";

export type IntroPhase = "shell" | "enhanced";

export type IntroValue = {
  phase: IntroPhase;
  capabilities: Capabilities;
  markEnhanced: () => void;
};

export const IntroContext = createContext<IntroValue | null>(null);
