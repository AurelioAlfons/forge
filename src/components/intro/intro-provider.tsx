"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FAN_HOLD_MS,
  FAN_MAX_MS,
  REDUCED_MOTION_QUERY,
} from "@/lib/pc-sequence/config";
import { useMediaQuery } from "@/components/pc-sequence/use-media-query";
import {
  IntroContext,
  IntroHoldContext,
  type IntroPhase,
  type IntroValue,
} from "./intro-context";

/** Owns the intro for the whole page. The player and the page timeline are
 *  siblings of the pc sequence, not children, so the phase has to live above
 *  all three. */
export function IntroProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [bootPhase, setBootPhase] = useState<IntroPhase>("booting");
  const [holdProgress, setHoldProgress] = useState(0);

  // reduced motion has no intro at all, so it never enters the machine
  const phase: IntroPhase = reducedMotion ? "ready" : bootPhase;
  const firstFrameReadyRef = useRef(false);
  const releaseScrollRef = useRef<(() => void) | null>(null);

  // nobody grabs the scrollbar mid-reveal. released by hand rather than by
  // cleanup, because scrolltrigger has to measure an already-unlocked page.
  useLayoutEffect(() => {
    if (reducedMotion) return;

    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverflowY = document.body.style.overflowY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflowY = "hidden";

    releaseScrollRef.current = () => {
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflowY = previousBodyOverflowY;
      releaseScrollRef.current = null;
    };

    return () => releaseScrollRef.current?.();
  }, [reducedMotion]);

  // the fan beat: hold until it has had its moment AND frame 01 can draw,
  // but never past the cap — a stalled download can't trap anyone
  useLayoutEffect(() => {
    if (reducedMotion || bootPhase !== "booting") return;

    const startedAt = performance.now();
    let rafId = 0;

    function tick(now: number) {
      const elapsed = now - startedAt;
      setHoldProgress(Math.min(1, elapsed / FAN_HOLD_MS));

      const beatDone = elapsed >= FAN_HOLD_MS && firstFrameReadyRef.current;
      if (beatDone || elapsed >= FAN_MAX_MS) {
        setBootPhase("revealing");
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [bootPhase, reducedMotion]);

  const markFirstFrameReady = useCallback(() => {
    firstFrameReadyRef.current = true;
  }, []);

  const markRevealComplete = useCallback(() => {
    // lock goes off first and by hand — scrolltrigger has to measure the page
    // at its real height, and a react effect would land a beat too late
    releaseScrollRef.current?.();
    setBootPhase("ready");
  }, []);

  const value = useMemo<IntroValue>(
    () => ({ phase, reducedMotion, markFirstFrameReady, markRevealComplete }),
    [markFirstFrameReady, markRevealComplete, phase, reducedMotion],
  );

  return (
    <IntroContext.Provider value={value}>
      <IntroHoldContext.Provider value={holdProgress}>
        {children}
      </IntroHoldContext.Provider>
    </IntroContext.Provider>
  );
}
