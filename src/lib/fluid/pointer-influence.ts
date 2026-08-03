// the fluid is full-page and the pc section sits on top of it, so the two are
// siblings — no parent to pass a prop through. this is the little shared dial
// between them: the pc section eases it down when the cursor is over the case,
// the sim reads it every splat.
//
// deliberately not react state. it changes every frame, and re-rendering a
// canvas component 60 times a second would be daft.

let influence = 1;

/** 0 = pointer does nothing to the fluid, 1 = full force. */
export function getPointerInfluence() {
  return influence;
}

export function setPointerInfluence(next: number) {
  influence = next < 0 ? 0 : next > 1 ? 1 : next;
}

/** Nudge toward a target. Call once per frame — snapping causes the flicker. */
export function easePointerInfluence(target: number, step = 0.12) {
  setPointerInfluence(influence + (target - influence) * step);
}

/** Back to full force. For teardown, so a stale value can't outlive the section. */
export function resetPointerInfluence() {
  influence = 1;
}
