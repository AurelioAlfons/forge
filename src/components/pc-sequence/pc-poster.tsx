import Image from "next/image";
import type { RefObject } from "react";
import { GATE_FRAME_PATH } from "@/lib/pc-sequence/config";

// same source, contain fit, and centre as canvas frame zero: only opacity changes.
export function PcPoster({
  imageRef,
  onReady,
}: {
  imageRef: RefObject<HTMLImageElement | null>;
  onReady: () => void;
}) {
  return (
    <Image
      ref={imageRef}
      data-pc-poster
      src={GATE_FRAME_PATH}
      alt="A custom PC with gold-lit fans"
      fill
      sizes="100vw"
      preload
      className="pointer-events-none object-contain"
      onLoad={onReady}
      onError={onReady}
    />
  );
}
