import type { Track } from "./types";

// drop local files into public/music, then add their details here
export const tracks: readonly Track[] = [
  {
    id: "sao-paulo",
    title: "São Paulo",
    artist: "The Weeknd feat. Anitta",
    src: "/music/audio/São Paulo - The Weeknd feat. Anitta.mp3",
    cover: "/music/covers/São Paulo - The Weeknd feat. Anitta.jpg",
  },
  {
    id: "skyline",
    title: "Skyline",
    artist: "Khalid",
    src: "/music/audio/Skyline - Khalid.mp3",
    cover: "/music/covers/Skyline - Khalid.jpg",
  },
  {
    id: "noble",
    title: "NOBLE",
    artist: "F3mii",
    src: "/music/audio/NOBLE - F3mii.mp3",
    cover: "/music/covers/NOBLE - F3mii.jpg",
  },
  {
    id: "timeless",
    title: "Timeless",
    artist: "The Weeknd feat. Playboi Carti",
    src: "/music/audio/Timeless - The Weeknd feat. Playboi Carti.mp3",
    // shares São Paulo's cover — same artist, same call from Aurelio
    cover: "/music/covers/Timeless - The Weeknd feat. Playboi Carti.jpg",
  },
  {
    id: "freaked-out",
    title: "FREAKED OUT",
    artist: "Fat Papi and prodshushy",
    src: "/music/audio/FREAKED OUT - Fat Papi and prodshushy.mp3",
    cover: "/music/covers/FREAKED OUT - Fat Papi and prodshushy.jpg",
  },
  // Moth To A Flame (Swedish House Mafia and The Weeknd) slots in here once
  // its audio is downloaded — order matters, this is its spot.
  {
    id: "famjam4000",
    title: "FAMJAM4000",
    artist: "Jordan Ward",
    src: "/music/audio/FAMJAM4000 - Jordan Ward.mp3",
    cover: "/music/covers/FAMJAM4000 - Jordan Ward.jpg",
  },
  {
    id: "midnight-alchemy",
    title: "Midnight Alchemy",
    artist: "My Boy Arlo",
    src: "/music/audio/Midnight Alchemy - My Boy Arlo.mp3",
    cover: "/music/covers/Midnight Alchemy - My Boy Arlo.jpg",
  },
  {
    id: "dance-with-the-devil",
    title: "Dance With The Devil",
    artist: "Blxst and Anderson .Paak",
    src: "/music/audio/Dance With The Devil - Blxst and Anderson .Paak.mp3",
    cover: "/music/covers/Dance With The Devil - Blxst and Anderson .Paak.jpg",
  },
  {
    id: "no-one-else",
    title: "No One Else",
    artist: "Chris Brown feat. Fridayy",
    src: "/music/audio/No One Else - Chris Brown feat. Fridayy.mp3",
    cover: "/music/covers/No One Else - Chris Brown feat. Fridayy.jpg",
  },
  {
    id: "take-my-breath",
    title: "Take My Breath",
    artist: "The Weeknd",
    src: "/music/audio/Take My Breath - The Weeknd.mp3",
    cover: "/music/covers/Take My Breath - The Weeknd.jpg",
  },
];
