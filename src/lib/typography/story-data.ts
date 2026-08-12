import { PLAYBACK_FRAME_COUNT } from "@/lib/pc-sequence/config";
import { STORY_HOLDS, STORY_TRANSITION_PLAYBACK_FRAMES } from "./story-timing";

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

function beatWindow(index: number) {
  const hold = STORY_HOLDS[index];
  const nextHold = STORY_HOLDS[index + 1];
  const enterEnd = hold.startStep + STORY_TRANSITION_PLAYBACK_FRAMES;
  // adjacent phrases cross in opposite directions instead of leaving a blank
  // gap. the final phrase rests once, then gets the same 85-step exit speed.
  const exitStart = nextHold?.startStep ?? enterEnd;

  return {
    start: hold.startStep / LAST_STEP,
    enterEnd: enterEnd / LAST_STEP,
    exitStart: exitStart / LAST_STEP,
    end: (exitStart + STORY_TRANSITION_PLAYBACK_FRAMES) / LAST_STEP,
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
    ...beatWindow(0),
  },
  {
    id: "ideas",
    label: "From idea to working product.",
    lines: [
      [{ text: "FROM " }, { text: "IDEA", accent: true }],
      [{ text: "TO WORKING" }],
      [{ text: "PRODUCT." }],
    ],
    placement: "upper-right",
    ...beatWindow(1),
  },
  {
    id: "purpose",
    label: "Web, AI, and automation.",
    lines: [
      [{ text: "WEB, " }, { text: "AI,", accent: true }],
      [{ text: "AND" }],
      [{ text: "AUTOMATION." }],
    ],
    placement: "upper-left",
    ...beatWindow(2),
  },
  {
    id: "perform",
    label: "Designed with purpose. Built to perform.",
    lines: [
      [{ text: "DESIGNED WITH" }],
      [{ text: "PURPOSE.", accent: true }],
      [{ text: "BUILT TO " }, { text: "PERFORM.", accent: true }],
    ],
    placement: "lower-right",
    ...beatWindow(3),
  },
] as const satisfies readonly StoryBeat[];
