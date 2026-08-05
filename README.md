# Forge

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000000)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02?logo=greensock&logoColor=000000)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)

<img width="1856" height="960" alt="Forge homepage" src="https://github.com/user-attachments/assets/843d0c79-0176-468f-a387-be2dc23e33c4" />

My personal portfolio. The whole page is one scroll-driven sequence: a PC
assembles and explodes, the camera pushes into its fan, and everything else
rides that same timeline instead of stacking underneath it.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4**, configured in CSS rather than a JS file
- **GSAP 3.15** with ScrollTrigger for every scroll-driven effect
- **pnpm**

## Commands

```bash
pnpm dev           # dev server on http://localhost:3000
pnpm build         # production build
pnpm start         # serve the production build
pnpm lint          # eslint
pnpm typecheck     # tsc --noEmit
pnpm format        # prettier --write .
```

## Fluid design system

There are almost no responsive breakpoints in this codebase. Type and spacing
interpolate linearly between a **320px** and a **1440px** viewport using
`clamp()`, so layouts scale continuously instead of snapping at breakpoints.

Tokens are defined in [`src/styles/tokens.css`](src/styles/tokens.css) under
`@theme`, which makes them available as ordinary Tailwind utilities:

| Token            | Utility        | 320px → 1440px |
| ---------------- | -------------- | -------------- |
| `--text-step--1` | `text-step--1` | 12 → 14px      |
| `--text-step-0`  | `text-step-0`  | 16 → 18px      |
| `--text-step-1`  | `text-step-1`  | 20 → 24px      |
| `--text-step-2`  | `text-step-2`  | 25 → 32px      |
| `--text-step-3`  | `text-step-3`  | 31 → 43px      |
| `--text-step-4`  | `text-step-4`  | 39 → 58px      |
| `--text-step-5`  | `text-step-5`  | 48 → 77px      |
| `--spacing-3xs`  | `p-3xs`        | 4 → 5px        |
| `--spacing-2xs`  | `p-2xs`        | 8 → 9px        |
| `--spacing-xs`   | `p-xs`         | 12 → 14px      |
| `--spacing-s`    | `p-s`          | 16 → 18px      |
| `--spacing-m`    | `p-m`          | 24 → 27px      |
| `--spacing-l`    | `p-l`          | 32 → 36px      |
| `--spacing-xl`   | `p-xl`         | 48 → 54px      |
| `--spacing-2xl`  | `p-2xl`        | 64 → 72px      |
| `--spacing-3xl`  | `p-3xl`        | 96 → 108px     |

Space tokens work with any spacing utility: `p-m`, `mt-l`, `gap-xs`, `py-2xl`.

Reach for a breakpoint (`sm:`, `md:`, …) only when the layout itself must
change, such as a column count or a stacked nav becoming horizontal. Never for
sizing.

### Other conventions

- `container-page` centers a wrapper at max 78rem with safe-area-aware padding.
- `max-w-measure` caps body text at 68ch for readability.
- Colors are semantic: `bg-bg`, `text-fg`, `text-muted`, `border-border`,
  `text-accent`. Dark mode follows the OS, and `data-theme="dark"` on `<html>`
  overrides it in both directions.

## Structure

```
src/
  app/
    layout.tsx              root layout, metadata, skip link
    page.tsx                composition only, the sections do the work
  components/
    intro/                  boot phase machine and scroll lock
    layout/                 site-wide chrome (header, footer)
    music-player/           fixed top bar, playlist, seek row
    page-timeline/          draggable left ruler and nav panel
    pc-sequence/            the pinned canvas sequence and its overlays
    projects/               white interlude panel and its bloom
    sections/               one file per home-page section
    skills/                 hexagon tiles that ride the fan spin
  lib/
    music/                  track list
    navigation/             timeline stops
    pc-sequence/            frame paths and playback mapping
    projects/               interlude window, bloom and dim helpers
    skills/                 honeycomb geometry and skill data
    site.ts                 site config and helpers
  styles/
    globals.css             entry point, imports the four partials below
    tokens.css              @theme: type scale, space scale, measure, fonts
    theme.css               semantic colors, dark mode, data-theme overrides
    base.css                @layer base element defaults
    utilities.css           @utility container-page, skill tile hover
```

`src/lib/fluid/` holds the vendored WebGL fluid solver, used by the Projects
interlude and the atmospheric haze overlay. `src/lib/scroll-sequence/` and
`src/lib/water-ripple/` are parked: nothing imports them, and they are kept for
reference rather than deleted.

Styles are split so the visual work ahead has somewhere to land instead of
piling into one file. The import order in `globals.css` matters: tokens define
the raw values, theme maps them to semantic colors, and base and utilities
consume both.

### Conventions

- **kebab-case filenames.** No PascalCase files.
- **No barrel `index.ts` files.** Import the real path, such as
  `@/components/layout/site-header`.

Site-wide copy (name, nav, links) lives in [`src/lib/site.ts`](src/lib/site.ts).
