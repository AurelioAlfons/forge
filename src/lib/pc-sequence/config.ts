// tuning for the pc scroll sequence. numbers live here so the component stays
// about behaviour and not magic values.

/**
 * How many frames exist in the 34-frame comparison export.
 */
export const FRAME_COUNT = 34;

/** Frames are 1-based and zero-padded: 01.png. */
export function framePath(index: number) {
  return `/pc-sequence/original/${String(index + 1).padStart(2, "0")}.png`;
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Retina is worth it, 3x is not. */
export const MAX_DPR = 2;

/** Scroll distance the pin lasts, as a multiple of viewport height. */
export const SCROLL_LENGTH_VH = 3;

/** How lazily the scrub chases the scrollbar. */
export const SCRUB = 0.6;

// ===== ALPHA HIT TESTING =====

/** The offscreen mask is tiny — we only need "is there PC here", not detail. */
export const HIT_MASK_SIZE = 256;

/** Alpha above this counts as "over the pc". Low, so antialiased edges don't
 *  make the boundary feel ragged. */
export const HIT_ALPHA_THRESHOLD = 25;

/** Per-frame easing step toward the target influence. Snapping flickers. */
export const INFLUENCE_EASE = 0.12;
