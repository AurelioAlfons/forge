"use client";

import { useEffect, useState } from "react";
import { FRAME_COUNT, framePath } from "@/lib/pc-sequence/config";

export type FrameSequence = {
  frames: HTMLImageElement[];
  ready: boolean;
  progress: number;
};

/**
 * Preloads and decodes the whole frame set before the scrub is allowed to run.
 * Scrubbing through undecoded images is what makes these sequences stutter.
 */
export function useFrameSequence() {
  const [state, setState] = useState<FrameSequence>({
    frames: [],
    ready: false,
    progress: 0,
  });

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const frames: HTMLImageElement[] = [];

    async function load() {
      const jobs = Array.from({ length: FRAME_COUNT }, (_, i) => {
        const img = new Image();
        img.src = framePath(i);
        frames[i] = img;

        // decode() rather than onload — onload fires before the browser has
        // actually turned the bytes into something drawable
        return img
          .decode()
          .catch(() => {})
          .then(() => {
            if (cancelled) return;
            loaded += 1;
            setState((s) => ({ ...s, progress: loaded / FRAME_COUNT }));
          });
      });

      await Promise.all(jobs);
      if (!cancelled) setState({ frames, ready: true, progress: 1 });
    }

    load();

    return () => {
      cancelled = true;
      // let the decoded bitmaps go, otherwise they sit in memory per remount
      for (const img of frames) img.src = "";
    };
  }, []);

  return state;
}
