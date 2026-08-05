import { blockOffset } from "@/lib/skills/config";
import { skills } from "@/lib/skills/skills-data";
import { SkillHexagon } from "./skill-hexagon";

// dumb on purpose. no gsap, no scroll listener, no state. the pc section's
// tick loop drives it and the hex size arrives as a css var.
export function SkillsOverlay() {
  return (
    <>
      <ul
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-5 list-none"
      >
        {skills.map((skill) => {
          const offset = blockOffset(skill.block, skill.col, skill.row);
          return <SkillHexagon key={skill.id} skill={skill} offset={offset} />;
        })}
      </ul>

      {/* the honeycomb is decorative and scroll-gated, so this list is the real
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
