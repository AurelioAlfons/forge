// tuning for the pc scroll sequence. numbers live here so the component stays
// about behaviour and not magic values.

export const ASSEMBLY_FRAME_COUNT = 80;
export const ZOOM_FRAME_COUNT = 80;
export const SPIN_START_ZOOM_FRAME = 40;
export const SPIN_EXTRA_PLAYBACK_FRAMES = 120;
export const ZOOM_PLAYBACK_FRAME_COUNT =
  ZOOM_FRAME_COUNT + SPIN_EXTRA_PLAYBACK_FRAMES;
export const FRAME_COUNT = ASSEMBLY_FRAME_COUNT + ZOOM_FRAME_COUNT;
export const PLAYBACK_FRAME_COUNT =
  ASSEMBLY_FRAME_COUNT * 2 - 1 + ZOOM_PLAYBACK_FRAME_COUNT * 2 - 1;

/** Frames are 1-based and zero-padded: 01.png. */
export function framePath(index: number) {
  const isZoomFrame = index >= ASSEMBLY_FRAME_COUNT;
  const folder = isZoomFrame ? "Vid_B" : "Vid_80_Final";
  const folderIndex = isZoomFrame ? index - ASSEMBLY_FRAME_COUNT : index;

  return `/pc-sequence/${folder}/${String(folderIndex + 1).padStart(2, "0")}.png`;
}

function zoomPlaybackFrameIndex(step: number) {
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
  const reverseEnd = ASSEMBLY_FRAME_COUNT * 2 - 1;
  const zoomReverseStart = reverseEnd + ZOOM_PLAYBACK_FRAME_COUNT;

  // blow it apart, walk it home, zoom in, then rewind that close-up
  if (step < ASSEMBLY_FRAME_COUNT) return step;
  if (step < reverseEnd) return reverseEnd - step - 1;
  if (step < zoomReverseStart) {
    return ASSEMBLY_FRAME_COUNT + zoomPlaybackFrameIndex(step - reverseEnd);
  }

  const reverseZoomStep =
    ZOOM_PLAYBACK_FRAME_COUNT - 2 - (step - zoomReverseStart);
  return ASSEMBLY_FRAME_COUNT + zoomPlaybackFrameIndex(reverseZoomStep);
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Retina is worth it, 3x is not. */
export const MAX_DPR = 2;

/** Scroll distance grows with the added spin beats, keeping the old pace. */
export const SCROLL_LENGTH_VH = 5.25;

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
