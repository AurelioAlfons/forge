"use client";

import { FAN_EXIT_MS } from "@/lib/pc-sequence/config";

type BootLoaderProps = {
  /** 0 to 1 across the fan beat. the provider owns the clock, this just draws. */
  holdProgress: number;
  reducedMotion: boolean;
  exiting: boolean;
};

export function BootLoader({
  holdProgress,
  reducedMotion,
  exiting,
}: BootLoaderProps) {
  const percentage = Math.round(holdProgress * 100);

  return (
    <div
      data-boot-loader
      style={{ transitionDuration: `${FAN_EXIT_MS}ms` }}
      className={`fixed inset-0 z-100 grid place-items-center bg-black transition-[opacity,transform] ease-out ${
        exiting ? "pointer-events-none -translate-y-full opacity-0" : ""
      } ${reducedMotion ? "transition-none" : ""}`}
    >
      <div className="relative grid size-[clamp(11rem,24vw,16rem)] place-items-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          className="absolute inset-0 size-full -rotate-90"
        >
          <circle
            cx="60"
            cy="60"
            r="56"
            pathLength="1"
            fill="none"
            stroke="rgb(55 55 55)"
            strokeWidth="1.5"
          />
          <circle
            cx="60"
            cy="60"
            r="56"
            pathLength="1"
            fill="none"
            stroke="#dfa812"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1"
            strokeDashoffset={1 - holdProgress}
          />
        </svg>

        <div className="relative grid size-[64%] place-items-center rounded-full border border-[#dfa812]/50 bg-[#0a0a0a] shadow-[0_0_3rem_rgba(223,168,18,0.14)]">
          <div className="absolute inset-[12%] rounded-full [animation-duration:700ms] [background:repeating-conic-gradient(from_8deg,#dfa812_0deg_13deg,#6e5108_14deg_29deg,#111_30deg_44deg)] motion-safe:animate-spin" />
          <div className="absolute inset-[28%] rounded-full border border-[#dfa812]/70 bg-[#080808] shadow-[0_0_1.25rem_rgba(223,168,18,0.4)]" />
          <div className="absolute size-[14%] rounded-full bg-[#dfa812] shadow-[0_0_1rem_rgba(223,168,18,0.8)]" />
        </div>

        <p
          role="status"
          aria-live="polite"
          className="text-muted absolute -bottom-10 font-mono text-xs tracking-[0.24em]"
        >
          LOADING {percentage}%
        </p>
      </div>
    </div>
  );
}
