"use client";
import { useIntro } from "@/components/intro/use-intro";
import { settingsForCapabilities } from "@/lib/responsive/performance-profile";

// one provider owns the probes and listeners, even when several layers ask.
export function usePerformanceSettings() {
  return settingsForCapabilities(useIntro().capabilities);
}
export function usePerformanceProfile() {
  return usePerformanceSettings().profile;
}
