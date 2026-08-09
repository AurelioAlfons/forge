import { IntroProvider } from "@/components/intro/intro-provider";
import { MusicPlayer } from "@/components/music-player/music-player";
import { PageTimeline } from "@/components/page-timeline/page-timeline";
import { PcSequenceSection } from "@/components/pc-sequence/pc-sequence-section";
import { AtmosphericHazeOverlay } from "@/components/atmospheric-haze-overlay";
import { ExperienceSection } from "@/components/sections/experience-section";
import { ContactSection } from "@/components/sections/contact-section";
import { SiteFooter } from "@/components/layout/site-footer";

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
        <ExperienceSection />
        <ContactSection />
        <SiteFooter />
      </main>
    </IntroProvider>
  );
}
