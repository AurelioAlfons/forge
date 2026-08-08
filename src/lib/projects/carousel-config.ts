import { PROJECT_COUNT } from "./projects-data";

// a row of square cards on one horizontal strip. progress 0..1 drives how far
// it's travelled — same contract the old turntable ring exposed, just a
// straight line instead of an orbit.

export const CARD_WIDTH_PX = 970;
export const CARD_HEIGHT_PX = 500;
export const CARD_GAP_PX = 48;
export const STAGE_HEIGHT_PX = CARD_HEIGHT_PX + 80;

/** How far the strip travels end to end, so the last card actually reaches
 *  centre instead of stopping short. */
export const TRACK_TRAVEL_PX =
  (CARD_WIDTH_PX + CARD_GAP_PX) * Math.max(1, PROJECT_COUNT - 1);

/** Slice of the hold spent on the entrance slide-in, before the strip
 *  settles into its normal per-scroll travel. Keeps card 1 arriving from
 *  off to the right on its own beat instead of just being wherever
 *  progress 0 happens to leave it. */
export const ENTRANCE_FRACTION = 0.08;

/** How far past its resting spot card 1 starts, off to the right — the
 *  distance it slides while the entrance beat plays. */
export const ENTRANCE_SLIDE_PX = CARD_WIDTH_PX;

/** Cards shrink on a phone. The numbers above are desktop pixels and the
 *  scene scales as one piece off this. */
export const CAROUSEL_BASE_WIDTH = 1340;
export const CAROUSEL_MIN_SCALE = 0.34;

export function carouselScale(stageWidth: number) {
  return Math.max(
    CAROUSEL_MIN_SCALE,
    Math.min(1, stageWidth / CAROUSEL_BASE_WIDTH),
  );
}

/** Matches the panel's own background — shared so the edge fade below and
 *  the panel itself can never drift apart into two different whites. */
export const PROJECTS_STAGE_COLOR = "#dad5cf";
