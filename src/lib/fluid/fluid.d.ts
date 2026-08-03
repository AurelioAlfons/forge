export type FluidOptions = {
  /** HSV colors the splats pick from at random. Omit for the original rainbow. */
  palette?: readonly { h: number; s: number; v: number }[] | null;
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
