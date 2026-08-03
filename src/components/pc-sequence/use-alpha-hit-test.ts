"use client";

import { useCallback, useRef } from "react";
import { HIT_ALPHA_THRESHOLD, HIT_MASK_SIZE } from "@/lib/pc-sequence/config";

/** Where the frame actually got drawn inside the canvas, in CSS pixels. */
export type DrawRect = { x: number; y: number; w: number; h: number };

/**
 * Per-pixel alpha test against the current frame.
 *
 * Samples a small offscreen copy rather than the display canvas — the real one
 * is DPR-scaled and reading back from it is slow.
 */
export function useAlphaHitTest() {
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawnRef = useRef<HTMLImageElement | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const c = document.createElement("canvas");
      c.width = HIT_MASK_SIZE;
      c.height = HIT_MASK_SIZE;
      maskRef.current = c;
      ctxRef.current = c.getContext("2d", { willReadFrequently: true });
    }
    return ctxRef.current;
  }, []);

  /** Redraw the mask. Only does work when the frame actually changed. */
  const setFrame = useCallback(
    (img: HTMLImageElement | undefined) => {
      if (!img || drawnRef.current === img) return;
      const ctx = getCtx();
      if (!ctx) return;

      ctx.clearRect(0, 0, HIT_MASK_SIZE, HIT_MASK_SIZE);
      ctx.drawImage(img, 0, 0, HIT_MASK_SIZE, HIT_MASK_SIZE);
      drawnRef.current = img;
    },
    [getCtx],
  );

  /**
   * True when the pointer is over solid pixels of the PC.
   *
   * Coords come in relative to the canvas, and the frame is drawn `contain`-style
   * so it doesn't fill it — that's why this maps through the draw rect rather
   * than the canvas. Getting that wrong is how the mask ends up offset.
   */
  const isOverPc = useCallback(
    (localX: number, localY: number, rect: DrawRect) => {
      const ctx = ctxRef.current;
      if (!ctx || !drawnRef.current) return false;

      const u = (localX - rect.x) / rect.w;
      const v = (localY - rect.y) / rect.h;
      if (u < 0 || u > 1 || v < 0 || v > 1) return false;

      const px = Math.min(HIT_MASK_SIZE - 1, Math.floor(u * HIT_MASK_SIZE));
      const py = Math.min(HIT_MASK_SIZE - 1, Math.floor(v * HIT_MASK_SIZE));

      return ctx.getImageData(px, py, 1, 1).data[3] > HIT_ALPHA_THRESHOLD;
    },
    [],
  );

  return { setFrame, isOverPc };
}
