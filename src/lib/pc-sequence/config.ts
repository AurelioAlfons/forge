// tuning for the pc scroll sequence. numbers live here so the component stays
// about behaviour and not magic values.

import { PROJECT_COUNT } from "@/lib/projects/projects-data";
import {
  DISASSEMBLY_PLAYBACK_FRAME_COUNT,
  disassemblyFrameIndex,
} from "@/lib/typography/story-timing";

export const ASSEMBLY_FRAME_COUNT = 80;
export const ZOOM_FRAME_COUNT = 80;
export const SPIN_START_ZOOM_FRAME = 40;
// 240 made the fan linger for another ~4.5 viewports across both zoom legs.
// half keeps the Skills hold readable without the timeline feeling parked.
export const SPIN_EXTRA_PLAYBACK_FRAMES = 120;
export const ZOOM_PLAYBACK_FRAME_COUNT =
  ZOOM_FRAME_COUNT + SPIN_EXTRA_PLAYBACK_FRAMES;
export const FRAME_COUNT = ASSEMBLY_FRAME_COUNT + ZOOM_FRAME_COUNT;
/** Scroll beats reserved for the Projects page between explosion and rebuild.
 *  Most of the window is the hold phase where the carousel actually turns
 *  (see PROJECTS_REVEAL_FRACTION/PROJECTS_EXIT_FRACTION), so this scales
 *  with the project count. Bumped from 100 to 260 per turn — 100, and then
 *  170, both still rushed past the cards before there was time to look. */
export const PROJECTS_PLAYBACK_FRAMES = 70 * Math.max(1, PROJECT_COUNT - 1);
export const REASSEMBLY_START_STEP =
  DISASSEMBLY_PLAYBACK_FRAME_COUNT + PROJECTS_PLAYBACK_FRAMES;
export const ZOOM_LEG_START_STEP =
  DISASSEMBLY_PLAYBACK_FRAME_COUNT +
  ASSEMBLY_FRAME_COUNT -
  1 +
  PROJECTS_PLAYBACK_FRAMES;
export const PLAYBACK_FRAME_COUNT =
  ZOOM_LEG_START_STEP + ZOOM_PLAYBACK_FRAME_COUNT * 2 - 1;

/** Frames are 1-based and zero-padded: 01.webp. */
export function framePath(index: number) {
  const isZoomFrame = index >= ASSEMBLY_FRAME_COUNT;
  const folder = isZoomFrame ? "Vid_B" : "Vid_80_Final";
  const folderIndex = isZoomFrame ? index - ASSEMBLY_FRAME_COUNT : index;

  return `/pc-sequence/${folder}/${String(folderIndex + 1).padStart(2, "0")}.webp`;
}

/** Immediate poster, shared by the document preload and the canvas seed. */
export const GATE_FRAME_PATH = framePath(0);

export function zoomPlaybackFrameIndex(step: number) {
  if (step < SPIN_START_ZOOM_FRAME) return step;

  const spinStep = step - SPIN_START_ZOOM_FRAME;
  const spinPlaybackCount = ZOOM_PLAYBACK_FRAME_COUNT - SPIN_START_ZOOM_FRAME;
  const spinSourceCount = ZOOM_FRAME_COUNT - SPIN_START_ZOOM_FRAME;

  // leave both endpoints unique and spread the extra beats through the spin
  if (spinStep === 0) return SPIN_START_ZOOM_FRAME;
  if (spinStep === spinPlaybackCount - 1) return ZOOM_FRAME_COUNT - 1;

  const innerPlaybackCount = spinPlaybackCount - 2;
  const innerSourceCount = spinSourceCount - 2;
  return (
    SPIN_START_ZOOM_FRAME +
    1 +
    Math.floor(((spinStep - 1) * innerSourceCount) / innerPlaybackCount)
  );
}

export function playbackFrameIndex(step: number) {
  const zoomReverseStart = ZOOM_LEG_START_STEP + ZOOM_PLAYBACK_FRAME_COUNT;

  // blow it apart, hold for Projects, walk it home, zoom in, then rewind
  if (step < DISASSEMBLY_PLAYBACK_FRAME_COUNT) {
    return disassemblyFrameIndex(step);
  }
  if (step < REASSEMBLY_START_STEP) return ASSEMBLY_FRAME_COUNT - 1;
  if (step < ZOOM_LEG_START_STEP) return ZOOM_LEG_START_STEP - step - 1;
  if (step < zoomReverseStart) {
    return (
      ASSEMBLY_FRAME_COUNT + zoomPlaybackFrameIndex(step - ZOOM_LEG_START_STEP)
    );
  }

  const reverseZoomStep =
    ZOOM_PLAYBACK_FRAME_COUNT - 2 - (step - zoomReverseStart);
  return ASSEMBLY_FRAME_COUNT + zoomPlaybackFrameIndex(reverseZoomStep);
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Retina is worth it, 3x is not. */
export const MAX_DPR = 2;

/** Preserve the existing pixels-per-playback-step as new beats are inserted. */
const PRE_PROJECTS_PLAYBACK_FRAME_COUNT = 798;
const PRE_PROJECTS_SCROLL_LENGTH_VH = 7.5;
export const SCROLL_LENGTH_VH =
  (PRE_PROJECTS_SCROLL_LENGTH_VH * PLAYBACK_FRAME_COUNT) /
  PRE_PROJECTS_PLAYBACK_FRAME_COUNT;

/** How lazily the scrub chases the scrollbar. */
export const SCRUB = 0.1;

// ===== ALPHA HIT TESTING =====

/** The offscreen mask is tiny — we only need "is there PC here", not detail. */
export const HIT_MASK_SIZE = 256;

/** Alpha above this counts as "over the pc". Low, so antialiased edges don't
 *  make the boundary feel ragged. */
export const HIT_ALPHA_THRESHOLD = 25;

/** Per-frame easing step toward the target influence. Snapping flickers. */
export const INFLUENCE_EASE = 0.12;
