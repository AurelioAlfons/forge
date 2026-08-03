# forge

Personal portfolio site.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — config lives in CSS, not a JS file
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

Tokens are defined in [`src/app/globals.css`](src/app/globals.css) under
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

Space tokens work with any spacing utility — `p-m`, `mt-l`, `gap-xs`, `py-2xl`.

Reach for a breakpoint (`sm:`, `md:`, …) only when the layout itself must
change — a column count, a stacked nav becoming horizontal. Never for sizing.

### Other conventions

- `container-page` — centered wrapper, max 78rem, safe-area-aware padding.
- `max-w-measure` — caps body text at 68ch for readability.
- Colors are semantic: `bg-bg`, `text-fg`, `text-muted`, `border-border`,
  `text-accent`. Dark mode follows the OS, and `data-theme="dark"` on `<html>`
  overrides it in both directions.

## Structure

```
src/
  app/         routes, layout, global styles
  components/  shared UI
  lib/         site config and helpers
```

Site-wide copy (name, nav, links) lives in [`src/lib/site.ts`](src/lib/site.ts).
