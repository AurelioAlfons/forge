export const PHONE_QUERY = "(max-width: 639px)";
export const TABLET_QUERY = "(min-width: 640px) and (max-width: 1024px)";

import type { Capabilities } from "@/lib/performance/capabilities";

export type PerformanceProfile = "phone" | "tablet" | "desktop" | "low-power";

export function settingsForCapabilities(capabilities: Capabilities) {
  const constrained =
    capabilities.saveData ||
    (capabilities.deviceMemory !== null && capabilities.deviceMemory <= 4) ||
    (capabilities.cores !== null && capabilities.cores <= 4) ||
    !capabilities.webgl;
  const profile: PerformanceProfile =
    capabilities.width < 640
      ? "phone"
      : constrained
        ? "low-power"
        : capabilities.width <= 1024 || capabilities.coarsePointer
          ? "tablet"
          : "desktop";
  const staticContent =
    profile === "phone" || capabilities.reducedMotion || capabilities.saveData;
  return {
    profile,
    staticContent,
    reducedMotion: capabilities.reducedMotion,
    stride: profile === "desktop" ? 1 : profile === "tablet" ? 3 : 4,
    workers: profile === "desktop" ? 2 : 1,
    maxDecoded: profile === "desktop" ? 48 : 16,
    orbitMotion: !staticContent && profile === "desktop",
    projectsFluid: !staticContent && capabilities.webgl && !constrained,
    ambientFluid: !staticContent && profile === "desktop",
  };
}

export const PROFILE_SCROLL_SCALE: Record<PerformanceProfile, number> = {
  phone: 0.78,
  tablet: 0.9,
  desktop: 1,
  "low-power": 0.9,
};

export function scrollLengthForProfile(
  desktopLength: number,
  profile: PerformanceProfile,
) {
  return desktopLength * PROFILE_SCROLL_SCALE[profile];
}
