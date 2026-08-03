import { MusicPlayer } from "@/components/music-player/music-player";
import { PcSequenceSection } from "@/components/pc-sequence/pc-sequence-section";

// the player floats over the pc so it never changes the sequence scroll math
export default function Home() {
  return (
    <>
      <MusicPlayer />
      <main id="main" className="flex-1">
        <PcSequenceSection />
      </main>
    </>
  );
}
