import {
  PLAYBACK_FRAME_COUNT,
  ZOOM_LEG_START_STEP,
  ZOOM_PLAYBACK_FRAME_COUNT,
  zoomPlaybackFrameIndex,
} from "@/lib/pc-sequence/config";

// ===== THE SPIN WINDOW =====

// measured every frame's lit bbox. 62 is the first one that's just fan on
// black, anything earlier still has case in shot. zero-based so it's 61.
const FAN_ONLY_ZOOM_FRAME = 61;

/** First playback step that lands on a fan-only frame. Walks the real mapping
 *  so retuning the spin cannot leave this value stale. */
function firstFanOnlyStep() {
  for (let step = 0; step < ZOOM_PLAYBACK_FRAME_COUNT; step += 1) {
    if (zoomPlaybackFrameIndex(step) >= FAN_ONLY_ZOOM_FRAME) return step;
  }
  return 0;
}

const LAST_STEP = PLAYBACK_FRAME_COUNT - 1;
const SPIN_START_STEP = ZOOM_LEG_START_STEP + firstFanOnlyStep();
const SPIN_END_STEP = ZOOM_LEG_START_STEP + ZOOM_PLAYBACK_FRAME_COUNT - 1;

export const SPIN_FORWARD_PROGRESS = {
  start: SPIN_START_STEP / LAST_STEP,
  end: SPIN_END_STEP / LAST_STEP,
} as const;

// hold is the long middle now — icons were only ever fully on screen for
// 20% of the spin window, which read as a blip. quicker in/out, much
// longer hold, same three fractions still sum to 1.
export const MATERIALIZE_FRACTION = 0.15;
export const HOLD_FRACTION = 0.7;
export const DEMATERIALIZE_FRACTION = 0.15;
export const HEX_TWEEN_DURATION = 0.08;

export function getSkillsAnchorScrollY(pcSection: HTMLElement) {
  const holdMidpoint =
    (SPIN_FORWARD_PROGRESS.start + SPIN_FORWARD_PROGRESS.end) / 2;
  const pinnedDistance = Math.max(
    0,
    pcSection.scrollHeight - window.innerHeight,
  );
  return pcSection.offsetTop + pinnedDistance * holdMidpoint;
}
