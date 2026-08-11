"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experience } from "@/lib/experience/experience-data";
import { PROJECTS_STAGE_COLOR } from "@/lib/projects/carousel-config";
import { initFluid } from "@/lib/fluid/fluid";
import { useMediaQuery } from "@/components/pc-sequence/use-media-query";
import { DecorArrow } from "@/components/decor/decor-arrow";
import { DecorMark } from "@/components/decor/decor-mark";
import { ExperienceTimeline } from "./experience-timeline";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// same mechanic as the Projects fluid, gold/amber instead of Projects'
// cobalt/indigo/violet — same system, not a literal copy-paste
const EXPERIENCE_FLUID_PALETTE = [
  { h: 0.11, s: 0.9, v: 0.95 }, // gold
  { h: 0.11, s: 0.9, v: 0.95 },
  { h: 0.09, s: 0.95, v: 0.85 }, // amber
  { h: 0.13, s: 0.85, v: 0.98 }, // pale gold
  { h: 0.08, s: 1, v: 0.75 }, // deep amber
] as const;

// vertical dated timeline — first pass, matches the site's own timeline
// motif. layout is a real design call still open per the PRD, tune by eye
export function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  // The whole white page wipes upward over the black PC scene. Scrubbing
  // keeps the transition attached to scroll position and reversible.
  useEffect(() => {
    const section = sectionRef.current;
    const fade = fadeRef.current;
    const content = contentRef.current;
    if (!section || !fade || !content || reducedMotion) return;

    gsap.set(fade, {
      clipPath: "inset(0 0 100% 0)",
      yPercent: 4,
    });
    gsap.set(content, { autoAlpha: 0, y: 56 });

    const enterTimeline = gsap
      .timeline({ paused: true })
      .to(fade, {
        clipPath: "inset(0 0 0% 0)",
        yPercent: 0,
        ease: "none",
        duration: 0.68,
      })
      .to(
        content,
        {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.32,
        },
        0.5,
      );

    const enterTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "top top",
      scrub: 0.45,
      animation: enterTimeline,
      invalidateOnRefresh: true,
    });

    const exitTimeline = gsap
      .timeline({ paused: true })
      .to(content, {
        autoAlpha: 0,
        y: -56,
        ease: "power2.in",
        duration: 0.32,
      })
      .to(
        fade,
        {
          clipPath: "inset(100% 0 0 0)",
          yPercent: -4,
          ease: "none",
          duration: 0.68,
        },
        0.18,
      );

    const exitTrigger = ScrollTrigger.create({
      trigger: section,
      start: "bottom bottom",
      end: "bottom top",
      scrub: 0.45,
      animation: exitTimeline,
      invalidateOnRefresh: true,
    });

    return () => {
      enterTrigger.kill();
      exitTrigger.kill();
      enterTimeline.kill();
      exitTimeline.kill();
      gsap.set(fade, { clearProps: "clipPath,transform" });
      gsap.set(content, { clearProps: "opacity,transform,visibility" });
    };
  }, [reducedMotion]);

  // same fluid setup as projects-interlude.tsx, copied discipline and all
  // — reduced-motion gated, pointer influence scoped to this section's own
  // bounds so it can't react to (or fight) the Projects canvas elsewhere
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

    function pointerIsOverExperience() {
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
        palette: EXPERIENCE_FLUID_PALETTE,
        getPointerInfluence: pointerIsOverExperience,
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
      id="experience"
      ref={sectionRef}
      className="relative -mt-[100svh] min-h-[200svh] bg-black"
    >
      <div
        ref={fadeRef}
        className="py-3xl sticky top-0 isolate flex h-svh items-center overflow-hidden"
      >
        {/* full-bleed white page, same treatment as the Projects panel —
            edge to edge regardless of container-page's own max-width */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-1/2 left-1/2 -z-10 -mx-[50vw] w-screen"
          style={{ backgroundColor: PROJECTS_STAGE_COLOR }}
        />

        <canvas
          ref={canvasRef}
          data-experience-fluid
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-1/2 left-1/2 -mx-[50vw] w-screen"
          style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
        />

        <div ref={contentRef} className="container-page relative">
          <div className="mb-m flex items-center gap-2">
            <DecorMark variant="orbit" tone="on-light" size={16} />
            <DecorArrow tone="on-light" />
          </div>
          <h2 className="text-step-3 font-semibold tracking-tight text-black">
            Experience
          </h2>

          <ExperienceTimeline entries={experience} />
        </div>
      </div>
    </section>
  );
}
