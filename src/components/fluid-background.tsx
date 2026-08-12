"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_FLUID_THEME, FLUID_THEMES } from "@/lib/fluid/fluid-theme";
import { getPointerInfluence } from "@/lib/fluid/pointer-influence";
import { startFluidSafely } from "@/lib/fluid/safe-fluid";
import {
  PHONE_QUERY,
  TABLET_QUERY,
} from "@/lib/responsive/performance-profile";

export function FluidBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // static black background for anyone who asked for less motion
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia(PHONE_QUERY).matches
    ) {
      return;
    }

    const tablet = window.matchMedia(TABLET_QUERY).matches;

    // the async solver can land after unmount, so late arrivals tear
    // themselves down instead of leaving a webgl loop behind.
    let cancelled = false;
    let teardown: ((releaseContext?: boolean) => void) | null = null;

    void startFluidSafely(canvas, {
      palette: FLUID_THEMES[DEFAULT_FLUID_THEME].palette,
      getPointerInfluence,
      tuning: tablet
        ? { simResolution: 64, dyeResolution: 512, curl: 20 }
        : undefined,
    }).then((nextTeardown) => {
      if (cancelled) nextTeardown?.(true);
      else teardown = nextTeardown;
    });

    return () => {
      cancelled = true;
      teardown?.(true);
    };
  }, []);

  // h-full w-full is load-bearing here. inset-0 on its own won't stretch a
  // canvas — replaced elements keep their intrinsic 300x150, so the sim ends up
  // running in a little box in the corner.
  //
  // the filter is lifted straight from the portfolio's fluid page — saturate is
  // what gives the dye its punch, the brightness/contrast pair stops bright
  // splats blowing out to white.
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full max-sm:hidden"
      style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
    />
  );
}
