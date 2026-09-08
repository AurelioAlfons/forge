"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experience } from "@/lib/experience/experience-data";
import { PROJECTS_STAGE_COLOR } from "@/lib/projects/carousel-config";
import { startFluidWhenVisible } from "@/lib/fluid/safe-fluid";
import { useIntro } from "@/components/intro/use-intro";
import { useMediaQuery } from "@/components/pc-sequence/use-media-query";
import { usePerformanceSettings } from "@/components/responsive/use-performance-profile";
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
  const { profile, staticContent, ambientFluid } = usePerformanceSettings();
  const { phase } = useIntro();

  // The whole white page wipes upward over the black PC scene. Scrubbing
  // keeps the transition attached to scroll position and reversible.
  useEffect(() => {
    const section = sectionRef.current;
    const fade = fadeRef.current;
    const content = contentRef.current;
    if (!section || !fade || !content || reducedMotion || staticContent) return;

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
  }, [reducedMotion, staticContent]);

  // this chapter gets a solver only after it is close enough to read.
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas || !ambientFluid || phase !== "enhanced") return;
    return startFluidWhenVisible(canvas, section, {
      palette: EXPERIENCE_FLUID_PALETTE,
      transparent: true,
      initialSplats: 0,
      idleSplats: false,
      isActive: () =>
        section.getBoundingClientRect().bottom > window.innerHeight / 2 &&
        Number.parseFloat(contentRef.current?.style.opacity || "1") > 0.02,
      tuning: {
        simResolution: 128,
        dyeResolution: 512,
        densityDissipation: 1,
        velocityDissipation: 0.2,
        curl: 30,
        splatRadius: 0.25,
        splatForce: 6000,
      },
    });
  }, [ambientFluid, phase, profile]);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative mt-[-100svh] min-h-[200svh] bg-black"
    >
      <div
        ref={fadeRef}
        className="py-3xl sticky top-0 isolate flex h-svh items-center overflow-hidden"
      >
        {/* full-bleed white page, same treatment as the Projects panel —
            edge to edge regardless of container-page's own max-width */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-1/2 left-1/2 -z-10 mx-[-50vw] w-screen"
          style={{ backgroundColor: PROJECTS_STAGE_COLOR }}
        />

        {ambientFluid && (
          <canvas
            ref={canvasRef}
            key={`${profile}-${staticContent}`}
            data-experience-fluid
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ filter: "brightness(0.95) contrast(1.15) saturate(1.8)" }}
          />
        )}

        <div ref={contentRef} className="container-page relative">
          <div className="mb-m flex items-center gap-2">
            <DecorMark variant="orbit" tone="on-light" size={16} />
            <DecorArrow tone="on-light" />
          </div>
          <h2 className="text-step-3 font-semibold tracking-tight text-black">
            Mission log
          </h2>

          <ExperienceTimeline entries={experience} />
        </div>
      </div>
    </section>
  );
}
