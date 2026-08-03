"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { tracks } from "@/lib/music/tracks";
import { NowPlaying } from "./now-playing";
import { PlaylistPanel } from "./playlist-panel";

const iconButton =
  "text-muted hover:bg-fg/5 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 grid size-11 shrink-0 place-items-center rounded-sm transition-colors";

export function MusicPlayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const playlistButtonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const resumeAfterLoadRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const hasTracks = tracks.length > 0;
  const currentTrack = hasTracks ? tracks[currentIndex] : undefined;

  const playSafely = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !hasTracks) return;

    try {
      await audio.play();
      setMediaError(null);
    } catch {
      setIsPlaying(false);
      setMediaError("Playback could not start. Try pressing play again.");
    }
  }, [hasTracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.load();
    if (resumeAfterLoadRef.current) {
      resumeAfterLoadRef.current = false;
      void playSafely();
    }
  }, [currentTrack, playSafely]);

  useEffect(() => {
    if (!panelOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPanelOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setPanelOpen(false);
      playlistButtonRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  function selectTrack(index: number, forcePlay = false) {
    const audio = audioRef.current;
    const shouldContinue = forcePlay || Boolean(audio && !audio.paused);
    setPanelOpen(false);

    if (index === currentIndex) {
      if (forcePlay) void playSafely();
      return;
    }

    resumeAfterLoadRef.current = shouldContinue;
    setCurrentIndex(index);
    setMediaError(null);
  }

  function moveTrack(offset: number, forcePlay = false) {
    if (!hasTracks) return;
    const nextIndex = (currentIndex + offset + tracks.length) % tracks.length;
    selectTrack(nextIndex, forcePlay);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !hasTracks) return;
    if (audio.paused) void playSafely();
    else audio.pause();
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio || !hasTracks) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-x-2 top-[max(env(safe-area-inset-top),0.5rem)] z-50 mx-auto max-w-[78rem] sm:inset-x-4"
    >
      <div className="border-border/80 gap-2xs px-2xs sm:px-xs grid min-h-14 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center rounded-sm border bg-black/75 shadow-xl backdrop-blur-lg sm:min-h-16 sm:grid-cols-[3rem_minmax(0,1fr)_12rem]">
        <button
          ref={playlistButtonRef}
          type="button"
          aria-label={panelOpen ? "Close playlist" : "Open playlist"}
          aria-expanded={panelOpen}
          aria-controls="music-playlist-panel"
          onClick={() => setPanelOpen((open) => !open)}
          className={`${iconButton} text-fg`}
        >
          <ChevronDown
            aria-hidden="true"
            className={`size-5 transition-transform ${panelOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div className="px-3xs min-w-0 overflow-hidden">
          <NowPlaying key={currentTrack?.id ?? "empty"} track={currentTrack} />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            aria-label="Previous track"
            title="Previous track"
            disabled={!hasTracks}
            onClick={() => moveTrack(-1)}
            className={`${iconButton} hidden sm:grid`}
          >
            <SkipBack aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
            disabled={!hasTracks}
            onClick={togglePlay}
            className={`${iconButton} text-fg`}
          >
            {isPlaying ? (
              <Pause aria-hidden="true" className="size-5 fill-current" />
            ) : (
              <Play aria-hidden="true" className="size-5 fill-current" />
            )}
          </button>
          <button
            type="button"
            aria-label="Next track"
            title="Next track"
            disabled={!hasTracks}
            onClick={() => moveTrack(1)}
            className={`${iconButton} hidden sm:grid`}
          >
            <SkipForward aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
            disabled={!hasTracks}
            onClick={toggleMute}
            className={iconButton}
          >
            {isMuted ? (
              <VolumeX aria-hidden="true" className="size-5" />
            ) : (
              <Volume2 aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {panelOpen && (
        <PlaylistPanel
          panelRef={panelRef}
          tracks={tracks}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          onSelect={(index) => selectTrack(index)}
        />
      )}

      {mediaError && (
        <p
          role="status"
          className="bg-bg/90 text-accent mt-2xs px-xs py-2xs rounded-sm text-xs"
        >
          {mediaError}
        </p>
      )}

      <audio
        ref={audioRef}
        src={currentTrack?.src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => moveTrack(1, true)}
        onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
        onError={() => {
          setIsPlaying(false);
          setMediaError("This track could not be loaded.");
        }}
      />
    </div>
  );
}
