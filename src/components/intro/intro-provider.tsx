"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readCapabilities,
  shellCapabilities,
} from "@/lib/performance/capabilities";
import { settingsForCapabilities } from "@/lib/responsive/performance-profile";
import { IntroContext, type IntroPhase } from "./intro-context";

// the shell is usable from html; the poster only opens the optional effects gate.
export function IntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>("shell");
  const [capabilities, setCapabilities] = useState(shellCapabilities);
  const markEnhanced = useCallback(() => setPhase("enhanced"), []);
  useEffect(() => {
    const sync = () => setCapabilities(readCapabilities());
    const queries = [
      matchMedia("(pointer: coarse)"),
      matchMedia("(prefers-reduced-motion: reduce)"),
    ];
    sync();
    window.addEventListener("resize", sync, { passive: true });
    queries.forEach((query) => query.addEventListener("change", sync));
    return () => {
      window.removeEventListener("resize", sync);
      queries.forEach((query) => query.removeEventListener("change", sync));
    };
  }, []);
  const value = useMemo(
    () => ({ phase, capabilities, markEnhanced }),
    [phase, capabilities, markEnhanced],
  );
  const settings = settingsForCapabilities(capabilities);
  return (
    <IntroContext.Provider value={value}>
      <div
        data-experience-mode={settings.staticContent ? "static" : "animated"}
        data-performance-profile={settings.profile}
        data-shell-phase={phase}
      >
        {children}
      </div>
    </IntroContext.Provider>
  );
}
