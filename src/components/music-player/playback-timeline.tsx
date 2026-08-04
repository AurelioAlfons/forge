"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";

type PlaybackTimelineProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  hasTrack: boolean;
  trackTitle?: string;
  trackSrc?: string;
};

type SeekStyle = CSSProperties & {
  "--seek-progress": string;
};

function validDuration(value: number) {
  return Number.isFinite(value) && value > 0;
}

function clampTime(value: number, duration: number) {
  return Math.min(duration, Math.max(0, value));
}

function formatTime(value: number) {
  const total = Math.max(0, Math.floor(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatSpokenTime(value: number) {
  const total = Math.max(0, Math.floor(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }

  return parts.join(" ");
}

export function PlaybackTimeline({
  audioRef,
  hasTrack,
  trackTitle,
  trackSrc,
}: PlaybackTimelineProps) {
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasMediaError, setHasMediaError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function stopLoop() {
      if (rafRef.current === null) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    function syncDuration() {
      const nextDuration = audio!.duration;
      if (!validDuration(nextDuration)) {
        setDuration(0);
        setCurrentTime(0);
        return;
      }

      setDuration(nextDuration);
      setCurrentTime(clampTime(audio!.currentTime, nextDuration));
      setHasMediaError(false);
    }

    function syncCurrentTime() {
      const nextDuration = audio!.duration;
      if (!validDuration(nextDuration)) return;
      setCurrentTime(clampTime(audio!.currentTime, nextDuration));
    }

    function tick() {
      syncCurrentTime();
      rafRef.current = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(tick);
    }

    function onLoadedMetadata() {
      syncDuration();
      syncCurrentTime();
    }

    function onPlay() {
      setIsPlaying(true);
      startLoop();
    }

    function onPause() {
      setIsPlaying(false);
      stopLoop();
      syncCurrentTime();
    }

    function onEnded() {
      setIsPlaying(false);
      stopLoop();
      syncCurrentTime();
    }

    function onEmptied() {
      stopLoop();
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setHasMediaError(false);
    }

    function onError() {
      stopLoop();
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setHasMediaError(true);
    }

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("timeupdate", syncCurrentTime);
    audio.addEventListener("seeking", syncCurrentTime);
    audio.addEventListener("seeked", syncCurrentTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("emptied", onEmptied);
    audio.addEventListener("error", onError);

    const expectedSrc = trackSrc
      ? new URL(trackSrc, window.location.href).href
      : "";
    if (
      hasTrack &&
      audio.currentSrc === expectedSrc &&
      audio.readyState >= HTMLMediaElement.HAVE_METADATA
    ) {
      onLoadedMetadata();
      if (!audio.paused && !audio.ended) onPlay();
    }

    return () => {
      stopLoop();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("timeupdate", syncCurrentTime);
      audio.removeEventListener("seeking", syncCurrentTime);
      audio.removeEventListener("seeked", syncCurrentTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("emptied", onEmptied);
      audio.removeEventListener("error", onError);
    };
  }, [audioRef, hasTrack, trackSrc]);

  const canSeek = hasTrack && validDuration(duration) && !hasMediaError;
  const value = canSeek ? clampTime(currentTime, duration) : 0;
  const remaining = canSeek ? Math.max(duration - value, 0) : 0;
  const progress = canSeek ? (value / duration) * 100 : 0;
  const style = { "--seek-progress": `${progress}%` } as SeekStyle;
  const seekLabel = trackTitle
    ? `Seek through ${trackTitle}`
    : "Seek through track";
  const valueText = canSeek
    ? `${formatSpokenTime(value)} of ${formatSpokenTime(duration)}`
    : "Duration unavailable";

  function seekTo(nextTime: number) {
    const audio = audioRef.current;
    if (!audio || !canSeek) return;

    const clampedTime = clampTime(nextTime, duration);
    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    seekTo(Number(event.currentTarget.value));
  }

  function seekFromPointer(event: PointerEvent<HTMLInputElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seekTo(ratio * duration);
  }

  function onPointerDown(event: PointerEvent<HTMLInputElement>) {
    if (!canSeek || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = event.pointerId;
    seekFromPointer(event);
  }

  function onPointerMove(event: PointerEvent<HTMLInputElement>) {
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault();
    seekFromPointer(event);
  }

  function onPointerEnd(event: PointerEvent<HTMLInputElement>) {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!canSeek) return;

    // native range keys get flaky in webviews, so keep the same model here
    let nextTime: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        nextTime = value - 0.01;
        break;
      case "ArrowRight":
      case "ArrowUp":
        nextTime = value + 0.01;
        break;
      case "PageDown":
        nextTime = value - duration * 0.1;
        break;
      case "PageUp":
        nextTime = value + duration * 0.1;
        break;
      case "Home":
        nextTime = 0;
        break;
      case "End":
        nextTime = duration;
        break;
      default:
        return;
    }

    event.preventDefault();
    seekTo(nextTime);
  }

  return (
    <div className="px-3xs relative h-11 min-w-0">
      <input
        type="range"
        min={0}
        max={canSeek ? duration : 1}
        step={0.01}
        value={value}
        disabled={!canSeek}
        aria-label={seekLabel}
        aria-valuetext={valueText}
        onChange={onChange}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        onKeyDown={onKeyDown}
        style={style}
        className="playback-seek absolute inset-x-0 bottom-0 h-11 w-full disabled:cursor-not-allowed disabled:opacity-35"
      />

      <div className="text-muted pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-center font-mono text-[10px] leading-3 tabular-nums">
        <span className={isPlaying ? "text-fg/75" : undefined}>
          {formatTime(value)}
        </span>
        <span className="now-playing-label hidden tracking-[0.16em]">
          NOW PLAYING
        </span>
        <span className="text-right">
          {canSeek ? `−${formatTime(remaining)}` : "−−:−−"}
        </span>
      </div>

      <style jsx>{`
        .playback-seek {
          appearance: none;
          cursor: pointer;
          background: linear-gradient(
              to right,
              #f5c542 0 var(--seek-progress),
              rgb(255 255 255 / 18%) var(--seek-progress) 100%
            )
            center / 100% 2px no-repeat;
          outline: none;
        }

        .playback-seek::-webkit-slider-runnable-track {
          height: 2px;
          background: transparent;
          border-radius: 999px;
        }

        .playback-seek::-webkit-slider-thumb {
          width: 8px;
          height: 8px;
          margin-top: -3px;
          appearance: none;
          border: 1px solid #111;
          border-radius: 999px;
          background: #f5c542;
        }

        .playback-seek:hover::-webkit-slider-thumb,
        .playback-seek:active::-webkit-slider-thumb,
        .playback-seek:focus-visible::-webkit-slider-thumb {
          width: 12px;
          height: 12px;
          margin-top: -5px;
          outline: 2px solid #f5c542;
          outline-offset: 2px;
        }

        .playback-seek::-moz-range-track {
          height: 2px;
          border: 0;
          border-radius: 999px;
          background: rgb(255 255 255 / 18%);
        }

        .playback-seek::-moz-range-progress {
          height: 2px;
          border-radius: 999px;
          background: #f5c542;
        }

        .playback-seek::-moz-range-thumb {
          width: 8px;
          height: 8px;
          border: 1px solid #111;
          border-radius: 999px;
          background: #f5c542;
        }

        .playback-seek:hover::-moz-range-thumb,
        .playback-seek:active::-moz-range-thumb,
        .playback-seek:focus-visible::-moz-range-thumb {
          width: 12px;
          height: 12px;
          outline: 2px solid #f5c542;
          outline-offset: 2px;
        }

        @media (min-width: 640px) {
          .now-playing-label {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
