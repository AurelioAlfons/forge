export const STORY_LEAD_PLAYBACK_FRAMES = 85;
export const STORY_HOLD_PLAYBACK_FRAMES = 70;
// the hero title and social links each travel across 0.8 viewport. at the pc
// sequence's fixed 7.5vh / 798-step density, that same distance is 85 steps.
export const STORY_TRANSITION_PLAYBACK_FRAMES = 85;
export const STORY_TAIL_PLAYBACK_FRAMES = 100;

export const STORY_HOLD_SOURCE_FRAMES = [0, 26, 52, 79] as const;

export type StoryHold = {
  sourceFrame: number;
  startStep: number;
  endStep: number;
};

// keep the original one-frame-per-step movement between the four pauses. the
// extra scroll only buys reading time; it never stretches a frame transition.
function buildStoryHolds(): readonly StoryHold[] {
  let cursor = STORY_LEAD_PLAYBACK_FRAMES;
  let previousSourceFrame = 0;

  return STORY_HOLD_SOURCE_FRAMES.map((sourceFrame) => {
    cursor += sourceFrame - previousSourceFrame;
    const hold = {
      sourceFrame,
      startStep: cursor,
      endStep: cursor + STORY_HOLD_PLAYBACK_FRAMES,
    };
    cursor = hold.endStep;
    previousSourceFrame = sourceFrame;
    return hold;
  });
}

export const STORY_HOLDS = buildStoryHolds();

export const DISASSEMBLY_PLAYBACK_FRAME_COUNT =
  (STORY_HOLDS.at(-1)?.endStep ?? STORY_LEAD_PLAYBACK_FRAMES) +
  STORY_TAIL_PLAYBACK_FRAMES;

export function disassemblyFrameIndex(step: number) {
  if (step < STORY_LEAD_PLAYBACK_FRAMES) return 0;

  let cursor = STORY_LEAD_PLAYBACK_FRAMES;
  let previousSourceFrame = 0;

  for (const hold of STORY_HOLDS) {
    const movementFrames = hold.sourceFrame - previousSourceFrame;
    if (step < cursor + movementFrames) {
      return previousSourceFrame + 1 + (step - cursor);
    }

    cursor += movementFrames;
    if (step < hold.endStep) return hold.sourceFrame;

    cursor = hold.endStep;
    previousSourceFrame = hold.sourceFrame;
  }

  return STORY_HOLD_SOURCE_FRAMES.at(-1) ?? 0;
}
