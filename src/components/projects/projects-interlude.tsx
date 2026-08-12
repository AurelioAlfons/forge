"use client";

import { useEffect, useRef, type RefObject } from "react";
import { startFluidSafely } from "@/lib/fluid/safe-fluid";
import {
  PROJECTS_STAGE_COLOR,
  carouselScale,
} from "@/lib/projects/carousel-config";
import { useMediaQuery } from "@/components/pc-sequence/use-media-query";
import { usePerformanceProfile } from "@/components/responsive/use-performance-profile";
import { HeroShutterText } from "@/components/ui/hero-shutter-text";
import { ProjectsCarousel, type CarouselHandle } from "./projects-carousel";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// no sliding edge anymore. a glow grows out of the fan until the frame blows
// out, then the panel fades up underneath it. both are the same white by then,
// so there's no seam to hide.
//
// fan sits at the stage centre, same assumption the skills honeycomb makes.
// the colour stop travels too, opacity alone just looks like a fade.
const BLOOM_GRADIENT =
  "radial-gradient(circle at 50% 50%," +
  " var(--accent, #ff7a3d) 0%," +
  ` color-mix(in srgb, var(--accent, #ff7a3d) 45%, ${PROJECTS_STAGE_COLOR})` +
  " calc(var(--projects-bloom-spread, 8%) * 0.45)," +
  ` ${PROJECTS_STAGE_COLOR} var(--projects-bloom-spread, 8%),` +
  ` ${PROJECTS_STAGE_COLOR} 100%)`;
const PROJECTS_FLUID_PALETTE = [
  { h: 0.65, s: 1, v: 0.9 }, // cobalt blue
  { h: 0.65, s: 1, v: 0.9 },
  { h: 0.65, s: 1, v: 0.9 },
  { h: 0.7, s: 1, v: 0.72 }, // indigo
  { h: 0.78, s: 0.95, v: 0.88 }, // violet
] as const;

type ProjectsInterludeProps = {
  carouselRef: RefObject<CarouselHandle | null>;
};

export function ProjectsInterlude({ carouselRef }: ProjectsInterludeProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const profile = usePerformanceProfile();

  // the carousel's own cards are sized in real px regardless of viewport, so
  // this scale factor is what actually shrinks them to fit a phone
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    function applyScale() {
      section!.style.setProperty(
        "--carousel-scale",
        String(carouselScale(section!.clientWidth)),
      );
    }

    applyScale();
    const observer = new ResizeObserver(applyScale);
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let pointerX = -1;
    let pointerY = -1;
    let teardown: ((releaseContext?: boolean) => void) | null = null;
    let requestId = 0;

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
      const currentRequest = ++requestId;
      teardown?.(false);
      teardown = null;
      window.removeEventListener("pointermove", trackPointer);

      if (motionQuery.matches || profile === "phone") {
        canvas!.hidden = true;
        return;
      }

      canvas!.hidden = true;
      window.addEventListener("pointermove", trackPointer, { passive: true });
      void startFluidSafely(canvas!, {
        palette: PROJECTS_FLUID_PALETTE,
        getPointerInfluence: pointerIsOverProjects,
        transparent: true,
        initialSplats: 0,
        idleSplats: false,
        tuning: {
          simResolution: profile === "tablet" ? 64 : 128,
          dyeResolution: profile === "tablet" ? 512 : 1024,
          densityDissipation: 1,
          velocityDissipation: 0.2,
          curl: 30,
          splatRadius: 0.25,
          splatForce: 6000,
        },
      }).then((nextTeardown) => {
        if (currentRequest !== requestId) {
          nextTeardown?.(true);
          return;
        }
        teardown = nextTeardown;
        canvas!.hidden = !nextTeardown;
      });
    }

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);
    return () => {
      motionQuery.removeEventListener("change", syncMotionPreference);
      requestId += 1;
      window.removeEventListener("pointermove", trackPointer);
      teardown?.(true);
    };
  }, [profile]);

  return (
    <>
      {/* screen blend so this reads as light on the pc rather than a shape
          laid over it. sits above the stage, below the panel. */}
      <div
        data-projects-bloom
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-15"
        style={{
          opacity: 0,
          background: BLOOM_GRADIENT,
          mixBlendMode: "screen",
        }}
      />

      <section
        ref={sectionRef}
        aria-label="Projects"
        data-projects-interlude
        className="pointer-events-none absolute inset-0 z-20"
        style={{ opacity: 0, backgroundColor: PROJECTS_STAGE_COLOR }}
      >
        <canvas
          ref={canvasRef}
          data-projects-fluid
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full max-sm:hidden"
          style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-[12%] flex justify-center max-sm:top-[14%]">
          <h2
            aria-label="My Projects"
            className="text-step-5 translate-x-[-8vw] font-semibold tracking-tight text-black max-sm:translate-x-0 max-sm:text-[clamp(2.4rem,12vw,3.5rem)]"
          >
            <HeroShutterText text="MY PROJECTS" tone="on-light" />
          </h2>
        </div>

        {/* the panel is click-through so the pc keeps its pointer, and the
            cards opt themselves back in */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <ProjectsCarousel
            handleRef={carouselRef}
            reducedMotion={reducedMotion}
            compact={profile === "phone"}
          />
        </div>
      </section>
    </>
  );
}
