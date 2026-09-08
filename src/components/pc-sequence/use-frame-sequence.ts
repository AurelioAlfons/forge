"use client";
import { useEffect, useState, type RefObject } from "react";
import { FRAME_COUNT, framePath } from "@/lib/pc-sequence/config";
import { FrameLoader } from "@/lib/pc-sequence/frame-loader";
import { useIntro } from "@/components/intro/use-intro";
import { usePerformanceSettings } from "@/components/responsive/use-performance-profile";

// only the adapter knows react; the queue keeps working without render updates.
export function useFrameSequence(
  posterRef: RefObject<HTMLImageElement | null>,
) {
  const { phase } = useIntro();
  const { staticContent, stride, workers, maxDecoded } =
    usePerformanceSettings();
  const [loader, setLoader] = useState<FrameLoader | null>(null);
  useEffect(() => {
    if (staticContent || phase !== "enhanced") return;
    const next = new FrameLoader({
      count: FRAME_COUNT,
      path: framePath,
      stride,
      workers,
      maxDecoded,
    });
    if (posterRef.current) next.seed(0, posterRef.current);
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // give the shell a paint before downloads and decode compete with it.
    const raf = requestAnimationFrame(() => {
      const start = () => {
        next.start();
        setLoader(next);
      };
      if (typeof requestIdleCallback === "function")
        idleId = requestIdleCallback(start, { timeout: 1000 });
      else timer = setTimeout(start, 100);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (idleId !== undefined) cancelIdleCallback(idleId);
      clearTimeout(timer);
      next.dispose();
    };
  }, [staticContent, phase, stride, workers, maxDecoded, posterRef]);
  return staticContent ? null : loader;
}
