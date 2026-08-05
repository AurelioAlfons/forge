import { PROJECT_COUNT } from "./projects-data";

/**
 * One card's full visual state. Width, height and radius are animated
 * alongside the transform, which is what makes this a shape morph rather than
 * the usual cover-flow where every slot is the same card at a different scale.
 */
export type SlotShape = {
  width: number;
  height: number;
  radius: number;
  x: number;
  y: number;
  z: number;
  rotateY: number;
  opacity: number;
};

// three live slots plus an offstage one on each side, so a card is already in
// position before it rotates into view instead of popping in.
export const SLOTS = {
  offLeft: {
    width: 210,
    height: 150,
    radius: 18,
    x: -560,
    y: 90,
    z: -520,
    rotateY: 58,
    opacity: 0,
  },
  left: {
    width: 250,
    height: 180,
    radius: 20,
    x: -330,
    y: 64,
    z: -260,
    rotateY: 42,
    opacity: 1,
  },
  centre: {
    width: 340,
    height: 460,
    radius: 26,
    x: 0,
    y: 0,
    z: 0,
    rotateY: 0,
    opacity: 1,
  },
  right: {
    width: 250,
    height: 200,
    radius: 20,
    x: 330,
    y: -76,
    z: -260,
    rotateY: -42,
    opacity: 1,
  },
  offRight: {
    width: 210,
    height: 150,
    radius: 18,
    x: 560,
    y: -100,
    z: -520,
    rotateY: -58,
    opacity: 0,
  },
} as const satisfies Record<string, SlotShape>;

export type SlotName = keyof typeof SLOTS;

/** Reading order as a card travels through the carousel. */
export const SLOT_ORDER: readonly SlotName[] = [
  "offRight",
  "right",
  "centre",
  "left",
  "offLeft",
];

/** How deep the scene is. Too flat and the rotation reads as a skew. */
export const PERSPECTIVE_PX = 1400;

/** Cards shrink on a phone. The slot numbers above are desktop pixels, and
 *  everything scales off this so the layout keeps its proportions. */
export const CAROUSEL_BASE_WIDTH = 1100;
export const CAROUSEL_MIN_SCALE = 0.42;

export function carouselScale(stageWidth: number) {
  return Math.max(CAROUSEL_MIN_SCALE, Math.min(1, stageWidth / CAROUSEL_BASE_WIDTH));
}

/**
 * Splits hold-phase progress into which project owns the centre slot and how
 * far the carousel has turned toward the next one. The last project gets a full
 * rest at the end rather than being mid-turn when the panel starts leaving.
 */
export function carouselPosition(progress: number) {
  const steps = Math.max(1, PROJECT_COUNT - 1);
  const travelled = Math.min(Math.max(progress, 0), 1) * steps;
  const index = Math.min(PROJECT_COUNT - 1, Math.floor(travelled));

  return { index, fraction: travelled - index };
}

/** anime.js timelines are seeked in ms, so one turn gets its own arbitrary
 *  duration and the scrub maps onto it. Scroll decides the real pace. */
export const TURN_DURATION_MS = 1000;
