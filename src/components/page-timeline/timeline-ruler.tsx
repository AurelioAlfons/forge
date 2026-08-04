"use client";

import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import type { TimelineItem } from "@/lib/navigation/timeline-items";
import { timelineItems } from "@/lib/navigation/timeline-items";

const TICK_COUNT = 41;
const ticks = Array.from({ length: TICK_COUNT }, (_, index) => index);

type TimelineRulerProps = {
  sliderRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  markerRef: RefObject<HTMLDivElement | null>;
  activeId: TimelineItem["id"];
  isOpen: boolean;
  isDragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onToggle: () => void;
  onLinkActivate: (
    event: ReactMouseEvent<HTMLAnchorElement>,
    item: TimelineItem,
  ) => void;
};

export function TimelineRuler({
  sliderRef,
  trackRef,
  markerRef,
  activeId,
  isOpen,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  onKeyDown,
  onToggle,
  onLinkActivate,
}: TimelineRulerProps) {
  const activeItem =
    timelineItems.find((item) => item.id === activeId) ?? timelineItems[0];

  return (
    <>
      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-label="Page position"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-valuetext={activeItem.label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        onKeyDown={onKeyDown}
        className={`group relative h-[clamp(17.5rem,36svh,20rem)] w-11 touch-none outline-none select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div ref={trackRef} className="absolute inset-x-0 inset-y-4">
          {ticks.map((tick) => {
            const major = tick % 10 === 0;
            const middle = !major && tick % 5 === 0;

            return (
              <span
                key={tick}
                aria-hidden="true"
                style={{ top: `${(tick / (TICK_COUNT - 1)) * 100}%` }}
                className={`absolute left-1/2 h-px -translate-x-1/2 -translate-y-1/2 ${
                  major
                    ? "w-6 bg-[#a8abb2] group-focus-visible:bg-[#f5c542]"
                    : middle
                      ? "w-4 bg-[#747880] group-focus-visible:bg-[#f5c542]/80"
                      : "w-2.5 bg-[#555961] group-focus-visible:bg-[#f5c542]/60"
                }`}
              />
            );
          })}

          <div
            ref={markerRef}
            aria-hidden="true"
            className="absolute top-0 left-1/2 z-10 h-0.5 w-7 -translate-x-1/2 -translate-y-1/2 bg-[#f5c542]"
          />
        </div>
      </div>

      <button
        type="button"
        aria-label={isOpen ? "Hide page links" : "Show page links"}
        aria-expanded={isOpen}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onToggle}
        className="timeline-touch-toggle text-muted absolute top-0 left-0 z-20 size-11 place-items-center"
      >
        <span aria-hidden="true" className="h-px w-4 bg-current" />
      </button>

      <nav
        aria-label="Page timeline links"
        aria-hidden={!isOpen}
        className={`border-border/90 absolute top-1/2 left-[calc(100%+0.75rem)] w-44 -translate-y-1/2 rounded-xl border bg-[#111]/95 p-2.5 shadow-[0_1rem_3rem_rgba(0,0,0,0.55)] backdrop-blur-xl transition-[opacity,translate] duration-200 motion-reduce:transition-none ${
          isOpen
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-2 opacity-0"
        }`}
      >
        <p className="px-2.5 pt-1 pb-2 font-mono text-[0.65rem] tracking-[0.18em] text-[#dfa812] uppercase">
          Navigation
        </p>

        <div className="flex flex-col gap-0.5">
          {timelineItems.map((item) => {
            const active = item.id === activeId;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                tabIndex={isOpen ? 0 : -1}
                aria-current={active ? "location" : undefined}
                onClick={(event) => onLinkActivate(event, item)}
                className={`relative flex min-h-9 items-center rounded-md px-2.5 text-xs font-medium transition-[background-color,box-shadow,color] duration-150 outline-none motion-reduce:transition-none ${
                  active
                    ? "text-fg bg-white/10 shadow-[inset_2px_0_0_#dfa812,0_0_1.25rem_rgba(223,168,18,0.08)]"
                    : "text-muted hover:text-fg focus-visible:text-fg hover:bg-white/8 hover:shadow-[0_0_1rem_rgba(255,255,255,0.04)] focus-visible:bg-white/8 focus-visible:shadow-[inset_2px_0_0_#dfa812,0_0_1rem_rgba(223,168,18,0.08)]"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

      <style jsx>{`
        .timeline-touch-toggle {
          display: grid;
        }

        @media (hover: hover) and (pointer: fine) {
          .timeline-touch-toggle {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
