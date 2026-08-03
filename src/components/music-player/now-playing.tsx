"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Music } from "lucide-react";
import type { Track } from "@/lib/music/types";

type NowPlayingProps = {
  track?: Track;
};

function MarqueeText({ children }: { children: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const text = textRef.current;
    if (!viewport || !text) return;

    function measure() {
      setDistance(Math.max(0, text!.scrollWidth - viewport!.clientWidth));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children]);

  const style = {
    "--marquee-distance": `${distance}px`,
  } as CSSProperties;

  return (
    <div ref={viewportRef} className="min-w-0 overflow-hidden">
      <span
        ref={textRef}
        style={style}
        className={
          distance > 0
            ? "music-marquee block w-max whitespace-nowrap"
            : "block truncate"
        }
      >
        {children}
      </span>
    </div>
  );
}

export function NowPlaying({ track }: NowPlayingProps) {
  return (
    <div className="music-now-playing gap-2xs flex min-w-0 items-center">
      <div className="border-border/80 bg-bg/80 relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm border sm:size-12">
        {track ? (
          <Image
            src={track.cover}
            alt=""
            width={48}
            height={48}
            loading="eager"
            className="size-full object-cover"
          />
        ) : (
          <Music aria-hidden="true" className="text-muted size-5" />
        )}
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        {track ? (
          <>
            <div className="text-fg text-sm font-medium">
              <MarqueeText>{track.title}</MarqueeText>
            </div>
            <div className="text-muted mt-1 text-xs">
              <MarqueeText>{track.artist}</MarqueeText>
            </div>
          </>
        ) : (
          <>
            <p className="text-fg truncate text-sm font-medium">
              No tracks added
            </p>
            <p className="text-muted mt-1 truncate text-xs">
              Add local music to start
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        .music-now-playing {
          animation: now-playing-in 300ms ease-out both;
        }

        :global(.music-marquee) {
          animation: music-marquee 10s ease-in-out 1s infinite alternate;
        }

        @keyframes now-playing-in {
          from {
            opacity: 0;
            transform: translateX(-0.75rem);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes music-marquee {
          0%,
          15% {
            transform: translateX(0);
          }
          85%,
          100% {
            transform: translateX(calc(-1 * var(--marquee-distance)));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .music-now-playing,
          :global(.music-marquee) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
