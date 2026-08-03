"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_FLUID_THEME, FLUID_THEMES } from "@/lib/fluid/fluid-theme";
import { initFluid } from "@/lib/fluid/fluid";

export function FluidBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // static black background for anyone who asked for less motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // handing react the teardown directly is the whole trick — it runs on
    // unmount and between strictmode's double-invoke in dev
    return initFluid(canvas, {
      palette: FLUID_THEMES[DEFAULT_FLUID_THEME].palette,
    });
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
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
    />
  );
}
