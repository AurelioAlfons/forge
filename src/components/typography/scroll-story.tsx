import { storyBeats } from "@/lib/typography/story-data";
import { StoryStatement } from "./story-statement";

type ScrollStoryProps = {
  reducedMotion: boolean;
};

// just the words. the pc's existing frame loop owns every moving value.
export function ScrollStory({ reducedMotion }: ScrollStoryProps) {
  return (
    <section
      aria-label="How I build"
      className="pointer-events-none absolute inset-0 z-8 overflow-hidden"
    >
      {reducedMotion ? (
        <StoryStatement beat={storyBeats[0]} staticMotion />
      ) : (
        storyBeats.map((beat) => <StoryStatement key={beat.id} beat={beat} />)
      )}
    </section>
  );
}
