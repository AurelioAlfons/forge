"use client";

import { useEffect, useState } from "react";
import { FRAME_COUNT, framePath } from "@/lib/pc-sequence/config";
import {
  PHONE_QUERY,
  TABLET_QUERY,
} from "@/lib/responsive/performance-profile";

export type FrameSequence = {
  frames: HTMLImageElement[];
  ready: boolean;
  progress: number;
};

const DESKTOP_WORKERS = 6;

/** Loads the opening frame first, then fills the sequence in the background. */
export function useFrameSequence() {
  const [state, setState] = useState<FrameSequence>({
    frames: [],
    ready: false,
    progress: 0,
  });

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    let nextIndex = 1;
    const frames: HTMLImageElement[] = [];
    const phone = window.matchMedia(PHONE_QUERY).matches;
    const tablet = window.matchMedia(TABLET_QUERY).matches;
    // phones draw every second source frame and let the existing nearest-frame
    // fallback fill the gaps. endpoints stay exact, while image decode + memory
    // land at roughly half the desktop cost.
    const loadIndices = Array.from(
      { length: FRAME_COUNT },
      (_, index) => index,
    ).filter((index) => !phone || index % 2 === 0 || index === FRAME_COUNT - 1);
    const targetCount = loadIndices.length;
    const backgroundWorkers = phone ? 3 : tablet ? 4 : DESKTOP_WORKERS;

    function loadFrame(index: number) {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        frames[index] = img;

        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          resolve(img);
        };

        img.addEventListener("load", settle, { once: true });
        img.addEventListener("error", settle, { once: true });
        img.src = framePath(index);
        if (img.complete) settle();
      });
    }

    function reportLoaded() {
      loaded += 1;
      // update in small batches so background loading does not cause 160 renders
      if (loaded === 1 || loaded === targetCount || loaded % 4 === 0) {
        setState((current) => ({
          ...current,
          progress: loaded / targetCount,
        }));
      }
    }

    async function load() {
      // get something useful on screen before the large sequence competes for bandwidth
      const openingFrame = await loadFrame(0);
      if (cancelled) return;

      reportLoaded();
      if (openingFrame.naturalWidth) {
        setState({ frames, ready: true, progress: loaded / targetCount });
      }

      async function worker() {
        while (!cancelled && nextIndex < targetCount) {
          const i = loadIndices[nextIndex];
          nextIndex += 1;

          await loadFrame(i);
          if (!cancelled) reportLoaded();
        }
      }

      await Promise.all(
        Array.from({ length: backgroundWorkers }, () => worker()),
      );
      if (!cancelled) {
        setState((current) => ({ ...current, progress: 1 }));
      }
    }

    load();

    return () => {
      cancelled = true;
      // let the loaded images go, otherwise they sit in memory per remount
      for (const img of frames) img.src = "";
    };
  }, []);

  return state;
}
