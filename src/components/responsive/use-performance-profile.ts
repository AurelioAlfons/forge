"use client";

import { useMediaQuery } from "@/components/pc-sequence/use-media-query";
import {
  PHONE_QUERY,
  TABLET_QUERY,
  type PerformanceProfile,
} from "@/lib/responsive/performance-profile";

export function usePerformanceProfile(): PerformanceProfile {
  const phone = useMediaQuery(PHONE_QUERY);
  const tablet = useMediaQuery(TABLET_QUERY);

  if (phone) return "phone";
  if (tablet) return "tablet";
  return "desktop";
}
