import type { CSSProperties } from "react";
import type { Skill } from "@/lib/skills/skills-data";

type SkillOrbitIconProps = {
  skill: Skill;
  compact?: boolean;
};

export function SkillOrbitIcon({
  skill,
  compact = false,
}: SkillOrbitIconProps) {
  const { icon: Icon, color, name, id } = skill;

  return (
    // js sets translate on this one every tick as the ring turns — nothing
    // else touches it, so gsap's own transform on the child below can't fight it
    <li
      data-skill-orbit={compact ? undefined : id}
      className={
        compact
          ? "relative grid justify-items-center gap-1.5"
          : "absolute top-1/2 left-1/2"
      }
      style={compact ? undefined : { transform: "translate(-50%, -50%)" }}
    >
      {/* the one element gsap touches for materialize/dematerialize. opacity
          and scale only — gsap owns this transform every tick, so anything
          set here besides its own 0.6 starting scale gets overwritten the
          moment the timeline first renders. actual icon size lives on
          --skill-icon-s below instead, which gsap never touches */}
      <div data-skill-hex={id} style={{ opacity: 0, transform: "scale(0.6)" }}>
        {/* hover gets its own element, otherwise its transform fights the
            scale gsap is scrubbing on the parent */}
        <div
          className="skill-orbit-tile group relative rounded-full"
          style={
            {
              "--orbit-color": color,
              width: compact
                ? "clamp(2.5rem, 12vw, 3rem)"
                : "var(--skill-icon-s, 0px)",
              height: compact
                ? "clamp(2.5rem, 12vw, 3rem)"
                : "var(--skill-icon-s, 0px)",
              background: `color-mix(in srgb, ${color} 22%, #07070a)`,
            } as CSSProperties
          }
        >
          <div className="absolute inset-0 grid place-items-center rounded-full">
            <Icon
              aria-hidden="true"
              style={{
                color,
                width: compact
                  ? "clamp(1.35rem, 6.5vw, 1.65rem)"
                  : "calc(var(--skill-icon-s, 0px) * 0.55)",
                height: compact
                  ? "clamp(1.35rem, 6.5vw, 1.65rem)"
                  : "calc(var(--skill-icon-s, 0px) * 0.55)",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
              }}
            />
            <span className="sr-only">{name}</span>
          </div>

          <span
            aria-hidden="true"
            className={`${compact ? "mt-1 max-w-[4.5rem] truncate text-center text-[0.58rem] text-white/65" : "skill-orbit-label px-2xs py-3xs text-step--1 pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-sm bg-black/80 whitespace-nowrap text-white opacity-0"}`}
          >
            {name}
          </span>
        </div>
      </div>
    </li>
  );
}
