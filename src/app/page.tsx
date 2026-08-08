import { IntroProvider } from "@/components/intro/intro-provider";
import { MusicPlayer } from "@/components/music-player/music-player";
import { PageTimeline } from "@/components/page-timeline/page-timeline";
import { PcSequenceSection } from "@/components/pc-sequence/pc-sequence-section";
import { AtmosphericHazeOverlay } from "@/components/atmospheric-haze-overlay";
import { ProjectsScrollShowcase } from "@/components/projects/projects-scroll-showcase";

// both controls float over the pc so its scroll math stays exactly where it was.
// the provider sits above all of them because they all arrive in the same intro.
export default function Home() {
  return (
    <IntroProvider>
      <AtmosphericHazeOverlay />
      <MusicPlayer />
      <PageTimeline />
      <main id="main" className="flex-1">
        <PcSequenceSection />
        {/* separate scroll-pin carousel — needs its own document scroll
            height, which the pinned pc sequence above can't give it */}
        <ProjectsScrollShowcase />
      </main>
    </IntroProvider>
  );
}
