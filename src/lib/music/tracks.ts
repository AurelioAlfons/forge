import type { Track } from "./types";

// drop local files into public/music, then add their details here
export const tracks: readonly Track[] = [
  {
    id: "delete-ya",
    title: "Delete Ya",
    artist: "Djo",
    src: "/music/audio/Delete Ya - Djo.mp3",
    cover: "/music/covers/Delete Ya.jpg",
  },
  {
    id: "power",
    title: "POWER",
    artist: "G-DRAGON",
    src: "/music/audio/POWER - G-DRAGON.mp3",
    cover: "/music/covers/POWER.jpg",
  },
  {
    id: "no-one-else",
    title: "No One Else",
    artist: "Chris Brown feat. Fridayy",
    src: "/music/audio/No One Else - Chris Brown feat. Fridayy.mp3",
    cover: "/music/covers/No One Else.jpg",
  },
  {
    id: "runaway",
    title: "Runaway",
    artist: "Kanye West",
    src: "/music/audio/Runaway - Kanye West.mp3",
    cover: "/music/covers/Runaway.jpg",
  },
  {
    id: "neon-guts",
    title: "Neon Guts",
    artist: "Lil Uzi Vert feat. Pharrell Williams",
    src: "/music/audio/Neon Guts - Lil Uzi Vert feat. Pharrell Williams.mp3",
    cover: "/music/covers/Neon Guts.jpg",
  },
  {
    id: "freaked-out",
    title: "FREAKED OUT",
    artist: "Fat Papi and prodshushy",
    src: "/music/audio/FREAKED OUT - Fat Papi and prodshushy.mp3",
    cover: "/music/covers/FREAKED OUT.jpg",
  },
];
