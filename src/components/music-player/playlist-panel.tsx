import Image from "next/image";
import { Volume2 } from "lucide-react";
import type { RefObject } from "react";
import type { Track } from "@/lib/music/types";

type PlaylistPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  tracks: readonly Track[];
  currentIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
};

export function PlaylistPanel({
  panelRef,
  tracks,
  currentIndex,
  isPlaying,
  onSelect,
}: PlaylistPanelProps) {
  return (
    <div
      ref={panelRef}
      id="music-playlist-panel"
      aria-label="Playlist"
      className="border-border/80 p-2xs absolute top-[calc(100%+0.5rem)] left-0 max-h-[55svh] w-full overflow-y-auto rounded-sm border bg-black/75 shadow-2xl backdrop-blur-xl sm:w-104"
    >
      {tracks.length === 0 ? (
        <div className="px-s py-m">
          <p className="text-fg text-sm font-medium">No tracks added</p>
          <p className="text-muted mt-2xs text-xs leading-relaxed">
            Add audio to <code>public/music/audio</code> and artwork to{" "}
            <code>public/music/covers</code>.
          </p>
        </div>
      ) : (
        <ul className="space-y-3xs">
          {tracks.map((track, index) => {
            const active = index === currentIndex;
            return (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`hover:bg-fg/5 focus-visible:bg-fg/5 gap-2xs px-2xs grid min-h-14 w-full grid-cols-[2.75rem_minmax(0,1fr)_1.25rem] items-center rounded-sm text-left transition-colors ${
                    active ? "bg-accent/10 text-accent" : "text-fg"
                  }`}
                >
                  <Image
                    src={track.cover}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-sm object-cover"
                  />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-medium">
                      {track.title}
                    </span>
                    <span className="text-muted mt-1 block truncate text-xs">
                      {track.artist}
                    </span>
                  </span>
                  {active && isPlaying ? (
                    <Volume2 aria-label="Playing" className="size-4" />
                  ) : active ? (
                    <span
                      aria-label="Selected"
                      className="bg-accent size-1.5 rounded-full"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
