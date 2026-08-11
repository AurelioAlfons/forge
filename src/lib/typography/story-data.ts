import { PLAYBACK_FRAME_COUNT } from "@/lib/pc-sequence/config";
import { STORY_HOLDS } from "./story-timing";

export type StoryPlacement =
  "lower-left" | "upper-right" | "upper-left" | "lower-right";

export type StorySegment = {
  text: string;
  accent?: boolean;
};

export type StoryBeat = {
  id: string;
  label: string;
  lines: readonly (readonly StorySegment[])[];
  placement: StoryPlacement;
  start: number;
  enterEnd: number;
  exitStart: number;
  end: number;
};

const LAST_STEP = PLAYBACK_FRAME_COUNT - 1;

function beatWindow(
  index: number,
  enterFraction: number,
  exitFraction: number,
) {
  const hold = STORY_HOLDS[index];
  const span = hold.endStep - hold.startStep;

  return {
    start: hold.startStep / LAST_STEP,
    enterEnd: (hold.startStep + span * enterFraction) / LAST_STEP,
    exitStart: (hold.endStep - span * exitFraction) / LAST_STEP,
    end: hold.endStep / LAST_STEP,
  };
}

export const storyBeats = [
  {
    id: "build",
    label: "I build digital experiences.",
    lines: [
      [{ text: "I " }, { text: "BUILD", accent: true }],
      [{ text: "DIGITAL" }],
      [{ text: "EXPERIENCES." }],
    ],
    placement: "lower-left",
    ...beatWindow(0, 0.2, 0.25),
  },
  {
    id: "ideas",
    label: "Ideas, broken into parts.",
    lines: [
      [{ text: "IDEAS,", accent: true }],
      [{ text: "BROKEN INTO" }],
      [{ text: "PARTS." }],
    ],
    placement: "upper-right",
    ...beatWindow(1, 0.2, 0.25),
  },
  {
    id: "purpose",
    label: "Every detail has a purpose.",
    lines: [
      [{ text: "EVERY DETAIL" }],
      [{ text: "HAS A" }],
      [{ text: "PURPOSE.", accent: true }],
    ],
    placement: "upper-left",
    ...beatWindow(2, 0.18, 0.2),
  },
  {
    id: "perform",
    label: "Designed to feel. Built to perform.",
    lines: [
      [{ text: "DESIGNED TO " }, { text: "FEEL.", accent: true }],
      [{ text: "BUILT TO " }, { text: "PERFORM.", accent: true }],
    ],
    placement: "lower-right",
    ...beatWindow(3, 0.2, 0.25),
  },
] as const satisfies readonly StoryBeat[];
