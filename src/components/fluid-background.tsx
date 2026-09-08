"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_FLUID_THEME, FLUID_THEMES } from "@/lib/fluid/fluid-theme";
import { getPointerInfluence } from "@/lib/fluid/pointer-influence";
import { startFluidWhenVisible } from "@/lib/fluid/safe-fluid";
import { useIntro } from "@/components/intro/use-intro";
import { usePerformanceSettings } from "@/components/responsive/use-performance-profile";

export function FluidBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { phase } = useIntro();
  const { ambientFluid, profile } = usePerformanceSettings();

  useEffect(() => {
    const canvas = ref.current;
    const section = document.getElementById("pc-sequence");
    if (!canvas || !section || !ambientFluid || phase !== "enhanced") return;
    return startFluidWhenVisible(canvas, section, {
      palette: FLUID_THEMES[DEFAULT_FLUID_THEME].palette,
      getPointerInfluence,
      tuning: { simResolution: 64, dyeResolution: 256, curl: 20 },
    });
  }, [ambientFluid, phase, profile]);

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
      key={`${profile}-${ambientFluid}`}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full max-sm:hidden"
      style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
    />
  );
}
