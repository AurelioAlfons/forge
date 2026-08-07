import type { RefObject } from "react";
import type { DecorTone } from "@/lib/decor/tone";
import { decorInk } from "@/lib/decor/tone";

export type DecorReadoutCorner =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";

type DecorReadoutProps = {
  label: string;

  /**
   * Caller computes this — real scroll %, viewport width, whatever's
   * already flowing through the mount site.
   */
  value: string;

  /**
   * For per-frame values driven by an existing rAF loop rather than React state.
   */
  valueRef?: RefObject<HTMLSpanElement | null>;

  tone: DecorTone;
  corner: DecorReadoutCorner;
  className?: string;
};

const CORNER_CLASS: Record<DecorReadoutCorner, string> = {
  "top-left": "top-m left-m items-start",
  "top-right": "top-m right-m translate-x-0 -translate-y-0 items-end",
  "bottom-left": "bottom-m left-m items-start",
  "bottom-right": "bottom-m right-m items-end",
};

export function DecorReadout({
  label,
  value,
  valueRef,
  tone,
  corner,
  className,
}: DecorReadoutProps) {
  const ink = decorInk(tone);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 flex flex-col gap-0.5 font-mono text-[0.65rem] leading-none tracking-wide ${CORNER_CLASS[corner]} ${className ?? ""}`}
      style={{ color: ink }}
    >
      <span>{label}</span>
      <span ref={valueRef}>{value}</span>
    </div>
  );
}
