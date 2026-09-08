import Image from "next/image";
import { projects } from "@/lib/content/projects";
import { skills } from "@/lib/content/skills";
import { storyBeats } from "@/lib/typography/story-data";

// native chapters are useful before javascript and never depend on a pin.
export function StaticChapters() {
  return (
    <div data-static-chapters>
      <section
        aria-label="How I build"
        className="border-t border-white/10 px-6 py-12 pl-14 sm:px-20"
      >
        <ul className="grid max-w-4xl gap-4 text-sm text-white/75 sm:grid-cols-2">
          {storyBeats.map((beat) => (
            <li key={beat.id}>{beat.label}</li>
          ))}
        </ul>
      </section>
      <section
        id="projects"
        aria-labelledby="static-projects-heading"
        className="bg-[#dad5cf] py-16 text-black"
      >
        <div className="px-6 pl-14 sm:px-20">
          <p className="system-label system-label-light mb-3">
            02 / Mission archive
          </p>
          <h2
            id="static-projects-heading"
            className="text-step-4 font-semibold uppercase"
          >
            Missions
          </h2>
          <p className="mt-3 text-sm text-black/70">
            Browse the builds. Swipe or use the project links.
          </p>
        </div>
        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-6 pl-14 sm:px-20">
          {projects.map((project) => (
            <li
              key={project.slug}
              className="w-[min(22rem,calc(100vw-5rem))] shrink-0 snap-center"
            >
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title} (opens in a new tab)`}
                className="block h-full overflow-hidden rounded-lg border border-black/15 bg-white/60 focus-visible:outline-black"
              >
                <div className="relative aspect-[16/10] bg-[#0b0b13]">
                  <Image
                    src={project.thumbnail}
                    alt=""
                    fill
                    sizes="(max-width: 639px) calc(100vw - 5rem), 352px"
                    className="object-contain"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="text-sm text-black/75">{project.blurb}</p>
                  <p className="text-xs text-black/65">
                    {project.stack.join(" · ")}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section
        id="skills"
        aria-labelledby="static-skills-heading"
        className="bg-black px-6 py-16 pl-14 sm:px-20"
      >
        <p className="system-label mb-3">03 / Skills</p>
        <h2
          id="static-skills-heading"
          className="text-step-4 font-semibold uppercase"
        >
          Loadout
        </h2>
        <p className="text-muted mt-3 text-sm">The tools behind the build.</p>
        <ul className="mt-8 grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {skills.map(({ id, name, icon: Icon, color }) => (
            <li
              key={id}
              className="flex min-w-0 flex-col items-center gap-3 border border-white/15 px-1 py-4 text-center"
            >
              <Icon aria-hidden="true" className="size-7" style={{ color }} />
              <span className="text-xs">{name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
