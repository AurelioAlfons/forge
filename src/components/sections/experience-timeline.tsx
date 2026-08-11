"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import type { ExperienceEntry } from "@/lib/experience/experience-data";

const GOLD = "#dfa812";

type ExperienceTimelineProps = {
  entries: readonly ExperienceEntry[];
};

function formatRange(entry: ExperienceEntry) {
  return `${entry.start} – ${entry.end === "present" ? "Present" : entry.end}`;
}

// aceternity's sticky-label-plus-scroll-filled-line timeline, rebuilt
// against real work history and forge's own gold-on-light palette instead
// of the reference's purple-to-blue gradient. the desktop label column is
// w-64 (16rem) — the --spine-left custom property below has to keep
// matching that by hand, they're not derived from one shared value
export function ExperienceTimeline({ entries }: ExperienceTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    if (!listRef.current) return;
    setLineHeight(listRef.current.getBoundingClientRect().height);
  }, [entries]);

  // scoped to the list itself, not the page or the section's outer bounds
  // — the heading and its padding sit outside containerRef on purpose
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const fillHeight = useTransform(scrollYProgress, [0, 1], [0, lineHeight]);
  const fillOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        ref={listRef}
        className="relative [--spine-left:0px] md:[--spine-left:calc(16rem+var(--spacing-l))]"
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="gap-2xs pt-l md:gap-l flex flex-col first:pt-0 md:flex-row"
          >
            {/* sticky label — desktop only, mobile gets an inline one below
                instead since sticky inside a scrolling flex column doesn't
                read well at narrow widths */}
            <div className="top-l hidden w-64 shrink-0 self-start md:sticky md:block">
              <h3 className="text-step-1 font-semibold text-black">
                {entry.role}
              </h3>
              <p className="text-step--1 mt-3xs font-mono tracking-wide text-black/60 uppercase">
                {formatRange(entry)}
              </p>
            </div>

            <div className="py-2xs pl-l relative w-full border-l border-black/15">
              {/* dot rides this row's own border-l, centred on it */}
              <span
                aria-hidden="true"
                className="absolute top-1 left-0 size-2.5 -translate-x-1/2 rounded-full"
                style={{ backgroundColor: GOLD }}
              />

              <div className="mb-2xs md:hidden">
                <h3 className="text-step-1 font-semibold text-black">
                  {entry.role}
                </h3>
                <p className="text-step--1 mt-3xs font-mono tracking-wide text-black/60 uppercase">
                  {formatRange(entry)}
                </p>
              </div>

              <p className="text-black/70">{entry.organization}</p>
              <p className="mt-2xs text-black/80">{entry.description}</p>

              {entry.tags && (
                <ul className="mt-2xs gap-2xs flex flex-wrap">
                  {entry.tags.map((tag) => (
                    <li
                      key={tag}
                      className="text-step--1 px-xs py-3xs rounded-full border border-black/15 text-black/60"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}

        {/* scroll-filled gold overlay, aligned to every row's own border-l
            via the shared --spine-left offset */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 w-px overflow-hidden"
          style={{ left: "var(--spine-left)", height: lineHeight }}
        >
          <motion.div style={{ height: fillHeight, opacity: fillOpacity }}>
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(to bottom, transparent, ${GOLD} 10%, ${GOLD})`,
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
