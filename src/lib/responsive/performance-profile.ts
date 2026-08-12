export const PHONE_QUERY = "(max-width: 639px)";
export const TABLET_QUERY = "(min-width: 640px) and (max-width: 1024px)";

export type PerformanceProfile = "phone" | "tablet" | "desktop";

export const PROFILE_SCROLL_SCALE: Record<PerformanceProfile, number> = {
  phone: 0.78,
  tablet: 0.9,
  desktop: 1,
};

export function scrollLengthForProfile(
  desktopLength: number,
  profile: PerformanceProfile,
) {
  return desktopLength * PROFILE_SCROLL_SCALE[profile];
}
