// how we tell the fluid background what colors to splat.
// ported from the portfolio, minus the iframe — the sim runs in-page here, so
// the same postMessage lands on our own window instead of a child frame.

export type FluidTheme = {
  backColor: { r: number; g: number; b: number };
  palette: { h: number; s: number; v: number }[] | null;
};

// one color recipe per mood => bg color + what colors the splats can be.
// generateColor picks from the palette at random, so repeating a shade is how
// you weight it — that's why forge lists gold twice and velvet red once.
export const FLUID_THEMES = {
  // gold / orange gold / velvet red => forge's own look
  forge: {
    backColor: { r: 0, g: 0, b: 0 },
    palette: [
      { h: 0.13, s: 0.95, v: 0.75 }, // gold yellow
      { h: 0.13, s: 0.95, v: 0.75 },
      { h: 0.11, s: 1.0, v: 0.72 }, // orange gold
      { h: 0.09, s: 1.0, v: 0.7 }, // deeper orange gold
      { h: 0.09, s: 1.0, v: 0.7 },
      { h: 0.98, s: 0.9, v: 0.5 }, // velvet red, darker so it reads as depth
    ],
  },
  // blue / navy / purple => a cooler, deeper splash for the hero
  home: {
    backColor: { r: 0, g: 0, b: 0 },
    palette: [
      { h: 0.62, s: 0.85, v: 1.0 }, // blue
      { h: 0.63, s: 0.65, v: 0.55 }, // navy
      { h: 0.78, s: 0.75, v: 0.9 }, // purple
    ],
  },
  // green / cyan / grey for the carousel
  projects: {
    backColor: { r: 0, g: 0, b: 0 },
    palette: [
      { h: 0.37, s: 0.75, v: 0.9 }, // green
      { h: 0.5, s: 0.85, v: 1.0 }, // cyan
      { h: 0.0, s: 0.0, v: 0.65 }, // grey
    ],
  },
  // red / orange / pink => keeps the hazard energy
  contact: {
    backColor: { r: 0, g: 0, b: 0 },
    palette: [
      { h: 0.0, s: 0.9, v: 0.95 }, // red
      { h: 0.08, s: 0.95, v: 1.0 }, // orange
      { h: 0.92, s: 0.6, v: 0.95 }, // pink
    ],
  },
} as const satisfies Record<string, FluidTheme>;

export type FluidThemeName = keyof typeof FLUID_THEMES;

// what the sim starts on. passed straight into initFluid so there's no rainbow
// flash on the first few splats before a message could land.
export const DEFAULT_FLUID_THEME: FluidThemeName = "forge";

// swap the palette at runtime — call this on scroll/section change once there
// are sections again.
export function setFluidTheme(theme: FluidThemeName) {
  window.postMessage(
    { type: "fluid-theme", ...FLUID_THEMES[theme] },
    window.location.origin,
  );
}
