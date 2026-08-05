"use client";

import { useEffect, useState } from "react";

// park zone at the top where the bar always stays put.
const TOP_ZONE_PX = 80;

// ignore anything smaller, otherwise a twitchy wheel flickers it.
const DELTA_PX = 8;

/**
 * Hides on the way down, brings it back on the way up, and never hides while
 * the page is parked at the top. Pass `false` for `enabled` while something
 * else owns the bar, such as the intro tween or an open playlist.
 */
export function useHideOnScrollDown(enabled: boolean) {
  const [hidden, setHidden] = useState(false);

  // the listener stays up the whole time and enabled only gates the answer.
  // tearing it down and rebuilding it left the flag stale, so closing the
  // playlist at the top of the page could hide the bar for no reason.
  useEffect(() => {
    let lastY = window.scrollY;
    let rafId = 0;

    function read() {
      rafId = 0;
      const y = window.scrollY;
      const delta = y - lastY;

      if (y <= TOP_ZONE_PX) {
        setHidden(false);
        lastY = y;
        return;
      }

      // don't bank lastY on a tiny move, otherwise slow scrolling never adds up
      if (Math.abs(delta) < DELTA_PX) return;

      setHidden(delta > 0);
      lastY = y;
    }

    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(read);
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return enabled && hidden;
}
