import { skills } from "@/lib/skills/skills-data";
import { SkillOrbitIcon } from "./skill-orbit-icon";

type SkillsOrbitProps = {
  /** Same "show nothing, rely on the sr-only list" stance the honeycomb
   *  took — the new ring outlines are decoration the honeycomb never had,
   *  so they get the same gate rather than sitting empty on screen. */
  reducedMotion: boolean;
};

// dumb on purpose. no gsap, no scroll listener, no state. the pc section's
// tick loop drives it — position via inline transform written every tick,
// opacity+scale via gsap, both keyed off the same skillProgress value.
export function SkillsOrbit({ reducedMotion }: SkillsOrbitProps) {
  return (
    <>
      {!reducedMotion && (
        <>
          <div
            data-skills-title
            aria-hidden="true"
            className="pointer-events-none absolute top-[clamp(7rem,12vh,9rem)] left-[clamp(3rem,6vw,7rem)] z-10 max-w-64"
            style={{ opacity: 0, transform: "translateX(-32px)" }}
          >
            <p className="text-step-5 font-semibold tracking-tight text-white">
              SKILLS
            </p>
            <p className="text-step--1 mt-5 max-w-52 border-l border-[#dfa812]/70 pl-4 font-mono leading-relaxed tracking-widest text-white/55 uppercase">
              The tools behind the build
            </p>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-5"
          >
            {/* opacity starts at 0 inline, same as each icon's own gsap
              target below — otherwise the ring is sized (and visible) the
              moment resize() runs, regardless of scroll position */}
            <div
              data-skill-ring="1"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                opacity: 0,
                width: "calc(var(--skill-ring1-r, 0px) * 2)",
                height: "calc(var(--skill-ring1-r, 0px) * 2)",
                borderColor: "rgba(223, 168, 18, 0.35)",
                boxShadow: "0 0 24px rgba(223, 168, 18, 0.25)",
              }}
            />
            <div
              data-skill-ring="2"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                opacity: 0,
                width: "calc(var(--skill-ring2-r, 0px) * 2)",
                height: "calc(var(--skill-ring2-r, 0px) * 2)",
                borderColor: "rgba(255, 122, 61, 0.3)",
                boxShadow: "0 0 24px rgba(255, 122, 61, 0.2)",
              }}
            />

            <ul className="pointer-events-none absolute inset-0 list-none">
              {skills.map((skill) => (
                <SkillOrbitIcon key={skill.id} skill={skill} />
              ))}
            </ul>
          </div>
        </>
      )}

      {/* the orbit is decorative and scroll-gated, so this list is the real
          one. a screen reader gets it straight away, no scrolling needed. */}
      <section aria-labelledby="skills-heading" className="sr-only">
        <h2 id="skills-heading">Skills</h2>
        <ul>
          {skills.map((skill) => (
            <li key={skill.id}>{skill.name}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
