export const FRAME_WIDTH = 1920;
export const FRAME_HEIGHT = 1080;
// smaller than the honeycomb's own fan clearance — shrinking this one
// number both pulls the rings in and frees up room the icon-size formula
// below picks up automatically, so it does both "smaller fan" and "bigger
// icons" at once rather than needing two unrelated levers. each cut has
// been relative to the last: 180 -> 144 -> 115.2 -> 103.68 (10% off)
export const FAN_RADIUS_IN_FRAME = 90.68;

export const RING1_COUNT = 6;
export const RING2_COUNT = 11;

// the cap decides desktop size, not the room maths, same idea the honeycomb
// used for its own hex cap.
export const ORBIT_ICON_SIZE_PX = { min: 4, max: 64 } as const;

// purely visual — badges render this much bigger than the size the ring
// spacing math actually reserved for them. keeping the two separate means
// "make the icons look bigger" doesn't also have to re-derive every ring
// radius; it just makes them sit closer/overlap more at high values, which
// is the actual tradeoff of cranking this without touching the rings too.
// 2 -> 2.4 is another 20% on top, same as every prior icon-size request.
export const ICON_VISUAL_SCALE = 8.4;

// fan edge -> ring 1 centre, in icon widths. 1 already clears ring 1's own
// 6-icon circumference requirement (6/2π ≈ 0.95 < 1), so ring 1 doesn't
// need its own explicit floor the way ring 2 does below
const RING1_GAP_WIDTHS = 1;
// ring 1 -> ring 2 centre, in icon widths. 1.6 -> 1.0 pulls the two rings
// closer together — still enough gap that they read as two distinct rings,
// not so tight they visually merge into one band
const RING_SPACING_WIDTHS = 1;
// ring 2's own 11 icons need enough circumference between their centres —
// based on the *visual* size, not the smaller pre-multiplier size, since
// that's what's actually rendered and what can actually overlap
const RING2_MIN_RADIUS_IN_ICON_WIDTHS = RING2_COUNT / (2 * Math.PI);
const EDGE_MARGIN_PX = 10;

// turns per second — a tuning constant, not a fixed fact. one rotation
// every ~24s reads as ambient rather than distracting; retune by eye once
// it renders. spins on its own clock now, not tied to scroll distance.
export const ORBIT_TURNS_PER_SECOND = 1 / 24;

export type OrbitGeometry = {
  /** Drives ring spacing/radii — do not use this for badge width/height. */
  icon: number;
  /** Drives badge width/height — `icon * ICON_VISUAL_SCALE`. */
  iconVisual: number;
  fanRadius: number;
  ring1Radius: number;
  ring2Radius: number;
};

function ringReachInIconWidths() {
  const ring2CentreReach = Math.max(
    RING1_GAP_WIDTHS + RING_SPACING_WIDTHS,
    RING2_MIN_RADIUS_IN_ICON_WIDTHS,
  );
  // The fit boundary is the outside of the badge, not its centre line.
  return ring2CentreReach + 0.5;
}

/**
 * Sized off the fan as it actually lands on screen, same assumption the
 * honeycomb made. Icon size is solved backwards from the room ring 2 (the
 * crowded one, 11 icons) actually has, rather than picked first and hoped
 * to fit — the honeycomb's block-reach math worked the same way.
 *
 * Solved against the *visual* size (`icon * ICON_VISUAL_SCALE`), not the
 * pre-multiplier base — dividing the room by `reach` alone and multiplying
 * up *after* let a small fan plus a big visual scale compute a ring 2
 * radius past the edge margin, and left ring 1 with ~0 clearance between
 * icons. Building the multiplier into the solve itself instead means every
 * ring radius fits inside `maxRadius` and clears its own icons by
 * construction, not by a floor patched on after the fact.
 */
export function computeOrbitGeometry(
  stageWidth: number,
  stageHeight: number,
): OrbitGeometry {
  const scale = Math.min(stageWidth / FRAME_WIDTH, stageHeight / FRAME_HEIGHT);
  const fanRadius = FAN_RADIUS_IN_FRAME * scale;
  const maxRadius = Math.min(stageWidth, stageHeight) / 2 - EDGE_MARGIN_PX;
  // solving icon size so ring2Radius lands *exactly* on maxRadius leaves
  // the fit guarantee resting on exact floating-point equality, which can
  // round either side of the boundary depending on the inputs — a sliver
  // of real margin here keeps it strictly inside on every platform, not
  // just in exact real-number math
  const roomForRings = Math.max(0, maxRadius - fanRadius - 1);

  const icon = Math.max(
    ORBIT_ICON_SIZE_PX.min,
    Math.min(
      ORBIT_ICON_SIZE_PX.max,
      roomForRings / (ringReachInIconWidths() * ICON_VISUAL_SCALE),
    ),
  );
  const iconVisual = icon * ICON_VISUAL_SCALE;

  const ring1Radius = fanRadius + iconVisual * RING1_GAP_WIDTHS;
  // These are independent constraints. Adding them pushed ring two far past
  // the viewport; the larger one alone provides both separation and enough
  // circumference for its eleven icons.
  const ring2Radius = Math.max(
    ring1Radius + iconVisual * RING_SPACING_WIDTHS,
    iconVisual * RING2_MIN_RADIUS_IN_ICON_WIDTHS,
  );

  return { icon, iconVisual, fanRadius, ring1Radius, ring2Radius };
}

/**
 * Reference's own `angle = time * speed + phaseShift` — real-time, not
 * scroll-driven, same as the reference. Rings turn in opposite directions.
 * Returns turns (0..1 = 0..360deg), not radians.
 */
export function ringAngleTurns(
  ring: 1 | 2,
  elapsedSeconds: number,
  phaseShift: number,
) {
  const speed = ring === 1 ? 1 : -0.6;
  return elapsedSeconds * speed * ORBIT_TURNS_PER_SECOND + phaseShift;
}

/**
 * Evenly spaced phase per icon within its own ring. Simpler than
 * hand-picking a phase per skill, and moving a skill between rings later
 * doesn't need any re-tuning.
 */
export function phaseShiftForIndex(indexInRing: number, ringCount: number) {
  return indexInRing / ringCount;
}
