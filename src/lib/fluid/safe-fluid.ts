import type { FluidOptions } from "./fluid";

export async function startFluidSafely(
  canvas: HTMLCanvasElement,
  options: FluidOptions,
) {
  try {
    // the solver is a big optional client module. phones never call this, so
    // they never download or parse it just to show a static background.
    const { initFluid } = await import("./fluid");
    return initFluid(canvas, options);
  } catch {
    // some mobile gpus refuse another webgl context. the page still wins:
    // hide the optional canvas and carry on with the authored background.
    canvas.hidden = true;
    return null;
  }
}
