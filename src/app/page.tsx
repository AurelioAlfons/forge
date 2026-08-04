import { MusicPlayer } from "@/components/music-player/music-player";
import { PageTimeline } from "@/components/page-timeline/page-timeline";
import { PcSequenceSection } from "@/components/pc-sequence/pc-sequence-section";
import { AtmosphericHazeOverlay } from "@/components/atmospheric-haze-overlay";

// both controls float over the pc so its scroll math stays exactly where it was
export default function Home() {
  return (
    <>
      <AtmosphericHazeOverlay />
      <MusicPlayer />
      <PageTimeline />
      <main id="main" className="flex-1">
        <PcSequenceSection />
      </main>
    </>
  );
}
