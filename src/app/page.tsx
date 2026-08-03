import { PcSequenceSection } from "@/components/pc-sequence/pc-sequence-section";

// still just the fluid and the pc for now — the section components are sitting
// in components/sections ready to wire back up when the copy is written.
export default function Home() {
  return (
    <main id="main" className="flex-1">
      <PcSequenceSection />
    </main>
  );
}
