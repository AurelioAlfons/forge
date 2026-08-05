"use client";

import { useEffect, useRef } from "react";
import { initFluid } from "@/lib/fluid/fluid";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PROJECTS_FLUID_PALETTE = [
  { h: 0.65, s: 1, v: 0.9 }, // cobalt blue
  { h: 0.65, s: 1, v: 0.9 },
  { h: 0.65, s: 1, v: 0.9 },
  { h: 0.7, s: 1, v: 0.72 }, // indigo
  { h: 0.78, s: 0.95, v: 0.88 }, // violet
] as const;

export function ProjectsInterlude() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let pointerX = -1;
    let pointerY = -1;
    let teardown: ((releaseContext?: boolean) => void) | null = null;

    function trackPointer(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
    }

    function pointerIsOverProjects() {
      const rect = section!.getBoundingClientRect();
      return pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom
        ? 1
        : 0;
    }

    function syncMotionPreference() {
      teardown?.(false);
      teardown = null;
      window.removeEventListener("pointermove", trackPointer);

      if (motionQuery.matches) {
        canvas!.hidden = true;
        return;
      }

      canvas!.hidden = false;
      window.addEventListener("pointermove", trackPointer, { passive: true });
      teardown = initFluid(canvas!, {
        palette: PROJECTS_FLUID_PALETTE,
        getPointerInfluence: pointerIsOverProjects,
        transparent: true,
        initialSplats: 0,
        idleSplats: false,
        tuning: {
          simResolution: 128,
          dyeResolution: 1024,
          densityDissipation: 1,
          velocityDissipation: 0.2,
          curl: 30,
          splatRadius: 0.25,
          splatForce: 6000,
        },
      });
    }

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);
    return () => {
      motionQuery.removeEventListener("change", syncMotionPreference);
      window.removeEventListener("pointermove", trackPointer);
      teardown?.(true);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Projects"
      data-projects-interlude
      className="pointer-events-none absolute inset-0 z-20 bg-white"
      style={{ transform: "translateY(100%)" }}
    >
      <canvas
        ref={canvasRef}
        data-projects-fluid
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
      />
      <h2 className="sr-only">Projects</h2>
    </section>
  );
}
