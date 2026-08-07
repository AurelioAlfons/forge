"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { createTimeline, type Timeline } from "animejs";
import {
  MAX_CARD_WIDTH_PX,
  PERSPECTIVE_PX,
  STAGE_HEIGHT_PX,
  SWEEP_DURATION_MS,
  TOTAL_TURNS,
  cardAngle,
  cardTransform,
} from "@/lib/projects/carousel-config";
import { projects } from "@/lib/projects/projects-data";

export type CarouselHandle = {
  /** `interactive` gates the cards' own pointer-events. The panel's opacity
   *  alone doesn't stop clicks — an invisible card would otherwise stay
   *  clickable wherever the ring last parked it, including dead centre of
   *  the pc stage long after scrolling away. */
  setProgress: (progress: number, interactive: boolean) => void;
};

type ProjectsCarouselProps = {
  handleRef: RefObject<CarouselHandle | null>;
  reducedMotion: boolean;
};

export function ProjectsCarousel({
  handleRef,
  reducedMotion,
}: ProjectsCarouselProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || reducedMotion) return;

    const cards = projects.map((project) =>
      scene.querySelector<HTMLElement>(`[data-project-card="${project.slug}"]`),
    );

    // one tweened number for the whole ring. animating x and z directly would
    // lerp a straight chord across the circle instead of following the arc,
    // so the angle is the thing that moves and positions come off it.
    const ring = { turns: 0 };

    // false until setProgress says otherwise — opacity alone never makes a
    // card unclickable, so this is the actual gate
    let interactive = false;

    function render() {
      cards.forEach((card, i) => {
        if (!card) return;

        const t = cardTransform(cardAngle(i, ring.turns));

        // the trailing -50% runs first, so the card keeps sitting on its own
        // ring point while its width and height are still changing
        card.style.width = `${t.width.toFixed(1)}px`;
        card.style.height = `${t.height.toFixed(1)}px`;
        card.style.borderRadius = `${t.radius.toFixed(1)}px`;
        card.style.transform = `translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, ${t.z.toFixed(2)}px) rotateY(${t.rotateY.toFixed(2)}deg) translate(-50%, -50%)`;
        card.style.opacity = t.opacity.toFixed(3);
        card.style.pointerEvents = interactive ? "auto" : "none";
        // the write-up belongs to whichever card is actually facing you
        const info = card.querySelector<HTMLElement>("[data-project-info]");
        if (info) {
          info.style.opacity = Math.max(0, t.depth * 4 - 3).toFixed(3);
        }
      });
    }

    const timeline = createTimeline({ autoplay: false }).add(
      ring,
      {
        turns: [0, TOTAL_TURNS],
        duration: SWEEP_DURATION_MS,
        ease: "linear",
        onUpdate: render,
      },
      0,
    );

    timelineRef.current = timeline;

    handleRef.current = {
      setProgress(progress, nextInteractive) {
        interactive = nextInteractive;
        const clamped = Math.min(1, Math.max(0, progress));
        timeline.seek(clamped * SWEEP_DURATION_MS);
      },
    };

    // land on the opening state rather than a pile of unplaced cards
    render();

    const handle = handleRef;
    return () => {
      timeline.pause();
      timelineRef.current = null;
      handle.current = null;
    };
  }, [handleRef, reducedMotion]);

  // no scroll-driven ring to browse with, so this becomes an ordinary list
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

  return (
    // no max-width, no overflow clip here. mid-turn the ring genuinely needs
    // more room than the 84rem box this used to be gave it, and the real
    // outer wall is already the full-viewport stage in pc-sequence-section.
    <div className="relative w-full" style={{ height: `${STAGE_HEIGHT_PX}px` }}>
      <div
        ref={sceneRef}
        className="absolute inset-0 grid place-items-center"
        style={{
          perspective: `${PERSPECTIVE_PX}px`,
          // lets the browser sort the cards by real depth, so the far side of
          // the ring draws behind the front one without any z-index juggling
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: "scale(var(--carousel-scale, 1))",
          }}
        >
          {projects.map((project) => (
            <a
              key={project.slug}
              data-project-card={project.slug}
              href={project.link}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title}. ${project.blurb}`}
              // no static pointer-events-auto here — render() is the only
              // thing allowed to turn this on, and only while the panel is
              // actually visible, per the CarouselHandle comment above
              className="absolute overflow-hidden bg-[#0b0b13] shadow-2xl"
              style={{ opacity: 0, pointerEvents: "none", left: 0, top: 0 }}
            >
              <Image
                src={project.thumbnail}
                alt=""
                fill
                // the box is set in real px by render(), not vw, and never
                // shrinks below what shapeAtAngle says regardless of
                // viewport (carouselScale is a visual css transform on an
                // ancestor, not a layout change) — so the hint has to match
                // the true widest card, not a viewport guess
                sizes={`${MAX_CARD_WIDTH_PX}px`}
                // default quality (75) re-encodes to a lossy webp that goes
                // soft on small ui text — these screenshots need more of it
                quality={90}
                // whole screenshot stays visible in every slot, letterboxed
                // on the card's own dark face rather than cropped at the
                // edges by the near-square left slot
                className="object-contain"
              />

              <span
                data-project-info
                className="p-s gap-3xs absolute inset-x-0 bottom-0 grid bg-linear-to-t from-black/90 via-black/70 to-transparent"
                style={{ opacity: 0 }}
              >
                <span className="text-step-1 leading-tight font-semibold text-white">
                  {project.title}
                </span>
                <span className="text-xs leading-snug text-white/75">
                  {project.blurb}
                </span>
                <span className="text-[0.65rem] tracking-wide text-white/50 uppercase">
                  {project.stack.join(" · ")}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
