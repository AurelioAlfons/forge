import type { StoryBeat } from "@/lib/typography/story-data";

const PLACEMENT_CLASS: Record<StoryBeat["placement"], string> = {
  "lower-left":
    "bottom-[clamp(5.5rem,10svh,8rem)] left-[clamp(3.5rem,6vw,7rem)] text-left items-start",
  "upper-right":
    "top-[clamp(8.5rem,18svh,12rem)] right-[clamp(3.5rem,6vw,7rem)] text-right items-end",
  "upper-left":
    "top-[clamp(8.5rem,18svh,12rem)] left-[clamp(3.5rem,6vw,7rem)] text-left items-start",
  "lower-right":
    "right-[clamp(3.5rem,6vw,7rem)] bottom-[clamp(5.5rem,10svh,8rem)] text-right items-end",
};

type StoryStatementProps = {
  beat: StoryBeat;
  staticMotion?: boolean;
};

export function StoryStatement({
  beat,
  staticMotion = false,
}: StoryStatementProps) {
  const placementClass = staticMotion
    ? "bottom-[clamp(9rem,18svh,11rem)] left-6 w-[min(22rem,calc(100vw-3rem))] items-start text-left"
    : `w-[min(42rem,44vw)] ${PLACEMENT_CLASS[beat.placement]} max-sm:top-auto max-sm:right-auto max-sm:bottom-[clamp(5.5rem,11svh,7rem)] max-sm:left-6 max-sm:w-[calc(100vw-3rem)] max-sm:items-start max-sm:text-left`;

  return (
    <p
      data-story-statement={beat.id}
      aria-label={beat.label}
      className={`absolute z-8 flex flex-col ${placementClass}`}
      style={staticMotion ? undefined : { opacity: 0 }}
    >
      <span
        aria-hidden="true"
        className="absolute -inset-x-8 -inset-y-6 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.48)_48%,transparent_76%)] blur-md"
      />

      {beat.lines.map((line, lineIndex) => (
        <span
          key={`${beat.id}-${lineIndex}`}
          className="block overflow-hidden pb-[0.08em]"
        >
          <span
            data-story-line={staticMotion ? undefined : ""}
            className={`${staticMotion ? "text-step-2 leading-[0.94]" : "text-step-5 leading-[0.88] max-sm:text-[clamp(1.9rem,9.5vw,2.8rem)]"} block font-semibold tracking-tight text-white uppercase will-change-transform`}
          >
            {line.map((segment, segmentIndex) => (
              <span
                key={`${segment.text}-${segmentIndex}`}
                data-story-accent={segment.accent ? "true" : undefined}
                className={segment.accent ? "text-[#dfa812]" : undefined}
              >
                {segment.text}
              </span>
            ))}
          </span>
        </span>
      ))}
    </p>
  );
}
