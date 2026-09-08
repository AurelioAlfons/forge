import type { FluidOptions } from "./fluid";

// an offscreen layer keeps its resources but skips simulation until it returns.
export function startFluidWhenVisible(
  canvas: HTMLCanvasElement,
  section: HTMLElement,
  options: FluidOptions,
  pinned = false,
) {
  let visible = false;
  let disposed = false;
  let starting = false;
  let teardown: ((releaseContext?: boolean) => void) | null = null;
  const eligible = () =>
    !disposed &&
    visible &&
    !document.hidden &&
    (!pinned || section.dataset.active === "true");
  const active = () => eligible() && (options.isActive?.() ?? true);
  function sync() {
    canvas.hidden = !eligible();
    if (!eligible() || starting || teardown) return;
    starting = true;
    void startFluidSafely(canvas, { ...options, isActive: active }).then(
      (next) => {
        if (disposed) next?.(true);
        else {
          teardown = next;
          canvas.hidden = !next || !eligible();
        }
      },
    );
  }
  canvas.hidden = true;
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      sync();
    },
    { rootMargin: "100px" },
  );
  intersection.observe(section);
  const mutation = new MutationObserver(sync);
  mutation.observe(section, {
    attributes: true,
    subtree: true,
    attributeFilter: ["data-active"],
  });
  document.addEventListener("visibilitychange", sync);
  return () => {
    disposed = true;
    intersection.disconnect();
    mutation.disconnect();
    document.removeEventListener("visibilitychange", sync);
    teardown?.(true);
  };
}

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
