// horizontal scroll-pin carousel, built from the shadcn-style scroll-x-carousel
// + reveal-on-hover components. lives as its own normal-document-flow section
// (needs real scroll height for its sticky trick) — separate from the pinned
// turntable carousel inside the pc sequence's projects panel, which has no
// scroll room of its own to give this one.
import {
  ScrollXCarousel,
  ScrollXCarouselContainer,
  ScrollXCarouselProgress,
  ScrollXCarouselWrap,
} from "@/components/ui/scroll-x-carousel";
import {
  CardHoverReveal,
  CardHoverRevealContent,
  CardHoverRevealMain,
} from "@/components/ui/reveal-on-hover";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/lib/projects/projects-data";

export function ProjectsScrollShowcase() {
  return (
    <ScrollXCarousel className="h-[150vh]">
      <ScrollXCarouselContainer className="flex h-dvh flex-col place-content-center gap-8 py-12">
        <div className="pointer-events-none absolute inset-[0_auto_0_0] z-10 h-[103%] w-[12vw] bg-[linear-gradient(90deg,_var(--background)_35%,_transparent)]" />
        <div className="pointer-events-none absolute inset-[0_0_0_auto] z-10 h-[103%] w-[15vw] bg-[linear-gradient(270deg,_var(--background)_35%,_transparent)]" />

        <ScrollXCarouselWrap className="flex flex-4/5 space-x-8 [&>*:first-child]:ml-8">
          {projects.map((project) => (
            <a
              key={project.slug}
              href={project.link}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title}. ${project.blurb}`}
            >
              <CardHoverReveal className="min-w-[70vw] rounded-xl border shadow-xl md:min-w-[38vw] xl:min-w-[30vw]">
                <CardHoverRevealMain>
                  {/* eslint-disable-next-line @next/next/no-img-element -- matches
                      the copied component's own image handling, not next/image */}
                  <img
                    alt={project.title}
                    src={project.thumbnail}
                    className="aspect-square size-full object-cover"
                  />
                </CardHoverRevealMain>
                <CardHoverRevealContent className="space-y-4 rounded-2xl bg-[rgba(0,0,0,.5)] p-4 backdrop-blur-3xl">
                  <div className="space-y-2">
                    <h3 className="text-sm text-white/80">Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.stack.map((tech) => (
                        <Badge
                          key={tech}
                          className="rounded-full capitalize"
                          variant="secondary"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    <h3 className="font-medium text-white capitalize">
                      {project.title}
                    </h3>
                    <p className="text-sm text-white/80">{project.blurb}</p>
                  </div>
                </CardHoverRevealContent>
              </CardHoverReveal>
            </a>
          ))}
        </ScrollXCarouselWrap>
        <ScrollXCarouselProgress
          className="bg-secondary mx-8 h-1 overflow-hidden rounded-full"
          progressStyle="size-full bg-indigo-500/70 rounded-full"
        />
      </ScrollXCarouselContainer>
    </ScrollXCarousel>
  );
}
