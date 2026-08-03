export type FluidOptions = {
  /** HSV colors the splats pick from at random. Omit for the original rainbow. */
  palette?: readonly { h: number; s: number; v: number }[] | null;
  /**
   * 0–1 multiplier on how much pointer movement drives the sim. Read on every
   * splat, so the caller can ease it frame by frame instead of flipping it.
   * Defaults to full force when omitted.
   */
  getPointerInfluence?: () => number;
};

/**
 * Starts the fluid simulation on the given canvas.
 *
 * Returns a teardown function that stops the render loop, clears timers, and
 * releases the WebGL context. Call it when the canvas unmounts.
 */
export function initFluid(
  canvas: HTMLCanvasElement,
  options?: FluidOptions,
): () => void;
