"use client";

import { useIntro } from "@/components/intro/use-intro";

import { useEffect, useRef, type RefObject } from "react";
import { startFluidWhenVisible } from "@/lib/fluid/safe-fluid";
import {
  PROJECTS_STAGE_COLOR,
  carouselScale,
} from "@/lib/projects/carousel-config";
import { useMediaQuery } from "@/components/pc-sequence/use-media-query";
import { usePerformanceSettings } from "@/components/responsive/use-performance-profile";
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
  const { profile, projectsFluid } = usePerformanceSettings();
  const { phase } = useIntro();

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
    if (!section || !canvas || !projectsFluid || phase !== "enhanced") return;
    return startFluidWhenVisible(
      canvas,
      section,
      {
        palette: PROJECTS_FLUID_PALETTE,
        transparent: true,
        initialSplats: 0,
        idleSplats: false,
        tuning: {
          simResolution: profile === "tablet" ? 64 : 128,
          dyeResolution: profile === "tablet" ? 256 : 512,
          densityDissipation: 1,
          velocityDissipation: 0.2,
          curl: 30,
          splatRadius: 0.25,
          splatForce: 6000,
        },
      },
      true,
    );
  }, [projectsFluid, phase, profile]);

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
        aria-label="Missions"
        data-projects-interlude
        data-active="false"
        inert
        className="pointer-events-none absolute inset-0 z-20"
        style={{ opacity: 0, backgroundColor: PROJECTS_STAGE_COLOR }}
      >
        <canvas
          ref={canvasRef}
          key={profile}
          data-projects-fluid
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full max-sm:hidden"
          style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-[8%] flex flex-col items-center max-sm:top-[12%]">
          <p className="system-label system-label-light mb-2">
            02 / Mission archive
          </p>
          <h2
            aria-label="Missions"
            className="text-step-5 font-semibold tracking-tight text-black max-sm:text-[clamp(2.4rem,12vw,3.5rem)]"
          >
            <HeroShutterText
              text="MISSIONS"
              tone="on-light"
              className="translate-x-0 translate-y-0"
            />
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
