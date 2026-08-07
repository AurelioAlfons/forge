import { PROJECT_COUNT } from "./projects-data";

// a turntable, not a row of parked cards. every project sits at its own angle
// on one horizontal circle and the whole ring turns, so a card arrives from the
// right, swings to the front, and carries on round the back.
//
// shape is keyed to that angle rather than fixed, so a card genuinely changes
// proportions as it travels: square on the way out, wide at the front.

/** How deep the scene is. Too flat and the orbit reads as a slide. */
export const PERSPECTIVE_PX = 1400;

/** Circle the cards ride. Wide enough that a side card clears the front one
 *  once perspective and tilt have shrunk it. Grows with the centre card. */
export const RING_RADIUS_PX = 760;

/** Cards angle into the turn but never turn fully away, so you can always tell
 *  what each one is. */
export const MAX_TILT_DEG = 30;

/** How faint a card gets at the far side of the ring. */
export const BACK_OPACITY = 0.22;

type ShapeKey = {
  at: number;
  width: number;
  height: number;
  radius: number;
  /** Lift above the centre line. The sides sit higher than the front card. */
  y: number;
};

// keyed by ring angle, both ends of the wrap included so the interpolation
// never has to special-case the seam.
const SHAPE_KEYS: readonly ShapeKey[] = [
  { at: -180, width: 190, height: 150, radius: 14, y: -30 },
  // A. seen already, a small square
  { at: -90, width: 270, height: 210, radius: 18, y: -20 },
  // B. the one you're reading, wide
  { at: 0, width: 840, height: 600, radius: 30, y: 0 },
  // C. next in line, a medium rectangle sitting higher
  { at: 90, width: 320, height: 220, radius: 20, y: -50 },
  { at: 180, width: 190, height: 150, radius: 14, y: -30 },
];

/** Widest a card ever actually renders. `next/image`'s `sizes` hint has to
 *  match this or the browser fetches a smaller source and stretches it,
 *  which is blur, not a compression problem. */
export const MAX_CARD_WIDTH_PX = Math.max(...SHAPE_KEYS.map((k) => k.width));

export type CardTransform = {
  width: number;
  height: number;
  radius: number;
  x: number;
  y: number;
  z: number;
  rotateY: number;
  opacity: number;
  depth: number;
};

/** Wraps to (-180, 180] so a card takes the short way round. */
function normaliseDeg(deg: number) {
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Blends between the two keys either side of this angle. */
function shapeAtAngle(deg: number) {
  let lower = SHAPE_KEYS[0];
  let upper = SHAPE_KEYS[SHAPE_KEYS.length - 1];

  for (let i = 0; i < SHAPE_KEYS.length - 1; i += 1) {
    if (deg >= SHAPE_KEYS[i].at && deg <= SHAPE_KEYS[i + 1].at) {
      lower = SHAPE_KEYS[i];
      upper = SHAPE_KEYS[i + 1];
      break;
    }
  }

  const span = upper.at - lower.at;
  const t = span === 0 ? 0 : (deg - lower.at) / span;

  return {
    width: lerp(lower.width, upper.width, t),
    height: lerp(lower.height, upper.height, t),
    radius: lerp(lower.radius, upper.radius, t),
    y: lerp(lower.y, upper.y, t),
  };
}

/**
 * Places one card from its angle on the ring. Front of the circle sits at
 * z = 0 and the far side at -2r, so perspective does the shrinking on its own
 * and the keyed sizes only have to say what shape each position is.
 */
export function cardTransform(angleDeg: number): CardTransform {
  const deg = normaliseDeg(angleDeg);
  const rad = (deg * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const shape = shapeAtAngle(deg);

  // 1 dead front, 0 dead back
  const depth = (cos + 1) / 2;

  return {
    width: shape.width,
    height: shape.height,
    radius: shape.radius,
    x: RING_RADIUS_PX * sin,
    y: shape.y,
    z: RING_RADIUS_PX * cos - RING_RADIUS_PX,
    rotateY: -MAX_TILT_DEG * sin,
    opacity: BACK_OPACITY + (1 - BACK_OPACITY) * depth,
    depth,
  };
}

/** Tallest the scene ever gets, so the stage can reserve room once. */
export const STAGE_HEIGHT_PX = 680;

/** Degrees between neighbours. Every project gets an even share of the ring. */
export const STEP_DEG = 360 / Math.max(1, PROJECT_COUNT);

/** Angle for card `i` when the ring has turned `turns` steps. */
export function cardAngle(i: number, turns: number) {
  return (i - turns) * STEP_DEG;
}

/** How many steps the ring travels end to end. Turning one short of a full
 *  circle brings the last project to the front without lapping the first. */
export const TOTAL_TURNS = Math.max(1, PROJECT_COUNT - 1);

/** anime.js seeks in ms, so the whole sweep gets an arbitrary duration and the
 *  scrub maps onto it. Scroll decides the real pace. */
export const SWEEP_DURATION_MS = 1000;

/** Cards shrink on a phone. The numbers above are desktop pixels and the scene
 *  scales as one piece off this. */
export const CAROUSEL_BASE_WIDTH = 1340;
export const CAROUSEL_MIN_SCALE = 0.34;

export function carouselScale(stageWidth: number) {
  return Math.max(
    CAROUSEL_MIN_SCALE,
    Math.min(1, stageWidth / CAROUSEL_BASE_WIDTH),
  );
}
