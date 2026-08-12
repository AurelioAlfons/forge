"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "motion/react";
import {
  CardHoverReveal,
  CardHoverRevealContent,
  CardHoverRevealMain,
} from "@/components/ui/reveal-on-hover";
import { Badge } from "@/components/ui/badge";
import {
  CARD_GAP_PX,
  CARD_HEIGHT_PX,
  CARD_WIDTH_PX,
  ENTRANCE_FRACTION,
  PROJECTS_STAGE_COLOR,
  STAGE_HEIGHT_PX,
  TRACK_TRAVEL_PX,
} from "@/lib/projects/carousel-config";
import { projects } from "@/lib/projects/projects-data";

export type CarouselHandle = {
  /** `interactive` gates the strip's own pointer-events. The panel's opacity
   *  alone doesn't stop clicks — an invisible card would otherwise stay
   *  clickable wherever the strip last parked it. */
  setProgress: (progress: number, interactive: boolean) => void;
};

type ProjectsCarouselProps = {
  handleRef: RefObject<CarouselHandle | null>;
  reducedMotion: boolean;
  compact?: boolean;
};

export function ProjectsCarousel({
  handleRef,
  reducedMotion,
  compact = false,
}: ProjectsCarouselProps) {
  // one 0..1 value drives the whole strip, fed by the pc sequence's own tick
  // loop below — same contract the turntable ring used to expose.
  // the row sits centred on itself at x=0 (place-items-center centres the
  // untransformed track), so the range is shifted by half the travel each
  // way rather than 0..-travel — that's what lands card 1 dead centre at the
  // start and the last card dead centre at the end, instead of the whole row.
  const progress = useMotionValue(0);
  const x = useTransform(
    progress,
    [0, 1],
    [TRACK_TRAVEL_PX / 2, -TRACK_TRAVEL_PX],
  );
  // card 1 grows in from the same spot the bloom just filled, then the strip
  // starts travelling — reads as "the pokemon arrives" rather than just
  // being there when the panel finishes fading in
  const entranceScale = useTransform(
    progress,
    [0, ENTRANCE_FRACTION],
    [0.6, 1],
  );
  const entranceOpacity = useTransform(
    progress,
    [0, ENTRANCE_FRACTION],
    [0, 1],
  );
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    handleRef.current = {
      setProgress(next, interactive) {
        progress.set(Math.min(1, Math.max(0, next)));
        // opacity alone never makes a card unclickable, so this is the
        // actual gate — same all-or-nothing switch the ring used to do per
        // card, just applied once to the whole strip
        if (trackRef.current) {
          trackRef.current.style.pointerEvents = interactive ? "auto" : "none";
        }
      },
    };

    const handle = handleRef;
    return () => {
      handle.current = null;
    };
  }, [handleRef, progress, reducedMotion]);

  // no scroll-driven strip to browse with, so this becomes an ordinary list
  if (reducedMotion) {
    return (
      <ul className="gap-s px-m mx-auto grid w-full max-w-2xl">
        {projects.map((project) => (
          <li key={project.slug}>
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="border-border/40 gap-2xs p-s grid rounded-sm border bg-black/5 transition-colors hover:bg-black/10"
            >
              <span className="text-step-1 font-semibold text-black">
                {project.title}
              </span>
              <span className="text-sm text-black/70">{project.blurb}</span>
              <span className="text-xs tracking-wide text-black/50 uppercase">
                {project.stack.join(" · ")}
              </span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  if (compact) {
    return (
      <div className="absolute inset-x-0 top-[24%] bottom-[8%] flex flex-col justify-center">
        <p className="mb-3 px-6 font-mono text-[0.62rem] tracking-[0.16em] text-black/55 uppercase">
          Swipe projects
        </p>
        <div className="touch-pan-x snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain px-6 pb-4 [&::-webkit-scrollbar]:hidden">
          <motion.div
            ref={trackRef}
            className="flex w-max gap-4"
            style={{
              scale: entranceScale,
              opacity: entranceOpacity,
              pointerEvents: "none",
            }}
          >
            {projects.map((project) => (
              <a
                key={project.slug}
                href={project.link}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title}. ${project.blurb}`}
                className="w-[calc(100vw-3rem)] max-w-sm shrink-0 snap-center overflow-hidden rounded-xl border border-black/10 bg-white/55 shadow-xl backdrop-blur-sm"
              >
                <div className="relative aspect-[16/10] bg-[#0b0b13]">
                  <Image
                    src={project.thumbnail}
                    alt=""
                    fill
                    sizes="calc(100vw - 3rem)"
                    quality={75}
                    className="object-contain"
                  />
                </div>
                <div className="space-y-2 p-4 text-black">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="text-sm leading-relaxed text-black/65">
                    {project.blurb}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.stack.map((tech) => (
                      <Badge
                        key={tech}
                        className="rounded-full capitalize"
                        variant="secondary"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: `${STAGE_HEIGHT_PX}px` }}>
      <div className="absolute inset-0 grid place-items-center overflow-hidden">
        {/* scale lives on a plain wrapper — framer writes its own transform
            for x on the track below, and the two don't mix in one style */}
        <div style={{ transform: "scale(var(--carousel-scale, 1))" }}>
          <motion.div
            ref={trackRef}
            className="flex items-center"
            style={{
              x,
              scale: entranceScale,
              opacity: entranceOpacity,
              gap: `${CARD_GAP_PX}px`,
              pointerEvents: "none",
            }}
          >
            {projects.map((project) => (
              <a
                key={project.slug}
                href={project.link}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title}. ${project.blurb}`}
                className="relative block shrink-0"
                style={{ width: CARD_WIDTH_PX, height: CARD_HEIGHT_PX }}
              >
                <CardHoverReveal className="size-full rounded-xl bg-[#0b0b13] shadow-2xl">
                  {/* fill needs a positioned direct parent — the shared
                      component itself is static */}
                  <CardHoverRevealMain className="relative">
                    <Image
                      src={project.thumbnail}
                      alt=""
                      fill
                      sizes={`${CARD_WIDTH_PX}px`}
                      // default quality (75) re-encodes to a lossy webp that
                      // goes soft on small ui text — these screenshots need
                      // more of it
                      quality={90}
                      // whole screenshot stays visible, letterboxed on the
                      // card's own dark face rather than cropped at the edges
                      className="object-contain"
                    />
                  </CardHoverRevealMain>
                  <CardHoverRevealContent className="space-y-4 rounded-2xl bg-[rgba(0,0,0,.5)] p-4 backdrop-blur-3xl">
                    <div className="space-y-2">
                      <h3 className="text-sm text-white/80">Stack</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.stack.map((tech) => (
                          <Badge
                            key={tech}
                            className="rounded-full capitalize"
                            variant="secondary"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2 space-y-2">
                      <h3 className="font-medium text-white capitalize">
                        {project.title}
                      </h3>
                      <p className="text-sm text-white/80">{project.blurb}</p>
                    </div>
                  </CardHoverRevealContent>
                </CardHoverReveal>
              </a>
            ))}
          </motion.div>
        </div>
      </div>

      {/* fade the strip into the panel instead of a hard clip at the edges —
          the fixed page-timeline nav sits right at the left edge of the
          viewport, and a card butting straight up against it read as one
          crowded wall instead of two things sharing the space */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[18vw] max-w-40"
        style={{
          background: `linear-gradient(90deg, ${PROJECTS_STAGE_COLOR} 25%, transparent)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-[18vw] max-w-40"
        style={{
          background: `linear-gradient(270deg, ${PROJECTS_STAGE_COLOR} 25%, transparent)`,
        }}
      />
    </div>
  );
}
