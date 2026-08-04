"use client";

import { useEffect, useState } from "react";
import { FRAME_COUNT, framePath } from "@/lib/pc-sequence/config";

export type FrameSequence = {
  frames: HTMLImageElement[];
  ready: boolean;
  progress: number;
};

/** Preloads the frame files before the scrub is allowed to run. */
export function useFrameSequence() {
  const [state, setState] = useState<FrameSequence>({
    frames: [],
    ready: false,
    progress: 0,
  });

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    let nextIndex = 0;
    const frames: HTMLImageElement[] = [];

    async function load() {
      async function worker() {
        while (!cancelled && nextIndex < FRAME_COUNT) {
          const i = nextIndex;
          nextIndex += 1;

          // four at a time keeps the browser breathing while the set loads
          const img = new Image();
          img.decoding = "async";
          frames[i] = img;

          await new Promise<void>((resolve) => {
            let settled = false;
            const settle = () => {
              if (settled) return;
              settled = true;
              resolve();
            };

            img.addEventListener("load", settle, { once: true });
            img.addEventListener("error", settle, { once: true });
            img.src = framePath(i);
            if (img.complete) settle();
          }).then(() => {
            if (cancelled) return;
            loaded += 1;
            setState((s) => ({ ...s, progress: loaded / FRAME_COUNT }));
          });
        }
      }

      await Promise.all(Array.from({ length: 4 }, () => worker()));
      if (!cancelled) setState({ frames, ready: true, progress: 1 });
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
