import {
  ASSEMBLY_FRAME_COUNT,
  PLAYBACK_FRAME_COUNT,
  PROJECTS_PLAYBACK_FRAMES,
  SCROLL_LENGTH_VH,
} from "@/lib/pc-sequence/config";

const LAST_STEP = PLAYBACK_FRAME_COUNT - 1;
const PROJECTS_START_STEP = ASSEMBLY_FRAME_COUNT - 1;
const PROJECTS_END_STEP = PROJECTS_START_STEP + PROJECTS_PLAYBACK_FRAMES;

export const PROJECTS_PROGRESS = {
  start: PROJECTS_START_STEP / LAST_STEP,
  end: PROJECTS_END_STEP / LAST_STEP,
} as const;

/** The panel spends most of its window fully covering the PC — the entry and
 *  exit fades are quick on purpose, so nearly all the window is actual
 *  browsing time instead of the carousel sitting frozen while the bloom
 *  fades in or out. */
export const PROJECTS_REVEAL_FRACTION = 0.15;
export const PROJECTS_EXIT_FRACTION = 0.85;

/**
 * Ramps up across the entry, sits at 1 through the hold, ramps back down across
 * the exit. The bloom, the panel fade and the pc dim all ride this one shape, so
 * they cannot drift apart.
 */
export function transitionEnvelope(progress: number) {
  if (progress <= PROJECTS_REVEAL_FRACTION) {
    return progress / PROJECTS_REVEAL_FRACTION;
  }
  if (progress < PROJECTS_EXIT_FRACTION) return 1;
  return 1 - (progress - PROJECTS_EXIT_FRACTION) / (1 - PROJECTS_EXIT_FRACTION);
}

/**
 * Maps the whole window onto just the hold phase, where the panel is fully
 * covering and the carousel has the screen to itself. Outside the hold it
 * clamps, so the first project is already resting in the centre as the bloom
 * finishes and the last one is still resting when the panel starts leaving.
 */
export function carouselProgress(progress: number) {
  const CAROUSEL_START = 0;
  const CAROUSEL_END = PROJECTS_EXIT_FRACTION;

  const span = CAROUSEL_END - CAROUSEL_START;
  const value = (progress - CAROUSEL_START) / span;

  return Math.min(1, Math.max(0, value));
}

// ===== THE BLOOM =====

/** Tight around the fan hub at the start. */
const BLOOM_SPREAD_MIN = 8;

// past the viewport diagonal, so the glow is actually everywhere by the time
// the panel takes over.
const BLOOM_SPREAD_MAX = 140;

/**
 * Where the gradient's white stop sits, as a percentage. Growing this is what
 * makes it a bloom. Opacity on its own just reads as the screen fading.
 */
export function bloomSpreadPercent(envelope: number) {
  return BLOOM_SPREAD_MIN + (BLOOM_SPREAD_MAX - BLOOM_SPREAD_MIN) * envelope;
}

// ===== THE PC PRE-DIM =====

// peak dim on the pc canvas. ~55% brightness and a light blur, so the scene
// settles as the light takes over instead of getting cut off.
const DIM_BRIGHTNESS_DROP = 0.45;
const DIM_BLUR_PX = 3;

// warms the dim so the fan's glow is the last thing you see. neutral grey
// works too, it just looks like everyone else's.
const DIM_WARMTH = 0.15;

/** Returns an empty string when there is nothing to dim, so the canvas carries
 *  no filter at all outside this window. */
export function canvasDimFilter(dim: number) {
  if (dim <= 0) return "";

  const brightness = 1 - dim * DIM_BRIGHTNESS_DROP;
  const blur = dim * DIM_BLUR_PX;
  const sepia = dim * DIM_WARMTH;

  return `brightness(${brightness.toFixed(3)}) blur(${blur.toFixed(2)}px) sepia(${sepia.toFixed(3)}) saturate(${(1 + dim * 0.1).toFixed(3)})`;
}

export function getProjectsAnchorScrollY(pcSection: HTMLElement) {
  const holdMidpoint = (PROJECTS_PROGRESS.start + PROJECTS_PROGRESS.end) / 2;
  return (
    pcSection.offsetTop + window.innerHeight * SCROLL_LENGTH_VH * holdMidpoint
  );
}
