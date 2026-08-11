import type { CSSProperties } from "react";
import type { Skill } from "@/lib/skills/skills-data";

type SkillOrbitIconProps = {
  skill: Skill;
};

export function SkillOrbitIcon({ skill }: SkillOrbitIconProps) {
  const { icon: Icon, color, name, id } = skill;

  return (
    // js sets translate on this one every tick as the ring turns — nothing
    // else touches it, so gsap's own transform on the child below can't fight it
    <li
      data-skill-orbit={id}
      className="absolute top-1/2 left-1/2"
      style={{ transform: "translate(-50%, -50%)" }}
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
              width: "var(--skill-icon-s, 0px)",
              height: "var(--skill-icon-s, 0px)",
              background: `color-mix(in srgb, ${color} 22%, #07070a)`,
            } as CSSProperties
          }
        >
          <div className="absolute inset-0 grid place-items-center rounded-full">
            <Icon
              aria-hidden="true"
              style={{
                color,
                width: "calc(var(--skill-icon-s, 0px) * 0.55)",
                height: "calc(var(--skill-icon-s, 0px) * 0.55)",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
              }}
            />
            <span className="sr-only">{name}</span>
          </div>

          <span
            aria-hidden="true"
            className="skill-orbit-label px-2xs py-3xs text-step--1 pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-sm bg-black/80 whitespace-nowrap text-white opacity-0"
          >
            {name}
          </span>
        </div>
      </div>
    </li>
  );
}
