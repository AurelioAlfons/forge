"use client";

import type {
  CSSProperties,
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
        className="absolute top-4 bottom-4 left-[calc(100%+0.5rem)] w-32"
      >
        {timelineItems.map((item) => {
          const active = item.id === activeId;
          const style = {
            top: `${item.progress * 100}%`,
          } as CSSProperties;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              tabIndex={isOpen ? 0 : -1}
              aria-current={active ? "location" : undefined}
              onClick={(event) => onLinkActivate(event, item)}
              style={style}
              className={`border-border/80 absolute left-0 -translate-y-1/2 rounded-sm border bg-black/85 px-3 py-1.5 text-xs font-medium whitespace-nowrap backdrop-blur-md transition-[opacity,translate,color] duration-200 motion-reduce:transition-none ${
                isOpen
                  ? "pointer-events-auto translate-x-0 opacity-100"
                  : "pointer-events-none -translate-x-2 opacity-0"
              } ${active ? "text-fg" : "text-muted hover:text-fg"}`}
            >
              {item.label}
            </a>
          );
        })}
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
