"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reads a media query without the setState-in-effect dance. Returns false during
 * SSR, which is the safe default for both queries we use it for.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
