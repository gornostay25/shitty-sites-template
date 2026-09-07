# BOL PT Blocks + Islands Fix — Design

**Status:** Implemented (archived 2026-09-07) — plan at [`../plans/2026-09-07-bol-pt-blocks-islands-fix.md`](../plans/2026-09-07-bol-pt-blocks-islands-fix.md)  
**Supersedes (partially):** [`../../../specs/2026-09-05-bol-theme-migration-design.md`](../../../specs/2026-09-05-bol-theme-migration-design.md) — PT block `node` props, no React islands inside Portable Text blocks  
**Date:** 2026-09-07  
**Context:** Part 5 shipped `/experiences` and locale routes; dev server threw `Invalid hook call` on home; Hero CMS fields never rendered. Fixed in same session.

---

## Problem summary

| Symptom | Root cause |
|---------|------------|
| Hero (and other `bol.*` blocks) show empty copy | Blocks read `Astro.props` directly; EmDash / `astro-portabletext` passes block data on **`Astro.props.node`** |
| `MenuTabs`, `OpenNowBadge`, `VenueMap` → `Invalid hook call` | Astro **does not apply** `client:*` directives inside components rendered via Portable Text’s `components` map ([Astro client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives)) |
| `ExperienceFilter` broke similarly when island lived inside nested `ExperiencesRoute` | Same rule — island must be declared on the **page** file (fixed via slot; keep that pattern) |

References:

- [EmDash — Portable Text rendering components](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/) — `Astro.props.node`
- [EmDash `Embed.astro`](node_modules/emdash/src/components/Embed.astro) — canonical `node` pattern in-repo
- [Astro — Client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives) — no hydration in `components`-prop trees

---

## Goals

1. All five `bol.*` blocks render CMS seed/admin content correctly.
2. Home and experiences pages load with **zero** React hook SSR errors.
3. Align with Astro + EmDash best practices; remove misleading nested-island patterns.
4. Keep CMS ability to reorder home blocks via Portable Text.

## Non-goals

- Rewriting home as non-PT composed page.
- Adding tests (project has no test suite).
- Removing `@astrojs/react` (still needed for plugin admin UI).

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| PT block props | Read fields from **`Astro.props.node`**; shared typed helper |
| Interactivity in PT blocks | **Vanilla** — CSS and/or co-located `<script>`; no React inside blocks |
| Experiences filter | **React island on page only** (`client:load` on `experiences.astro` / `hu` / `de` wrappers via slot) |
| Home routes | Inline logic in `index.astro` + `hu/index.astro` + `de/index.astro`; delete `HomeRoute.astro` wrapper |
| Experiences routes | Keep `ExperiencesRoute.astro` + page-level filter slot |
| Locale folders | Keep `hu/` and `de/` page files (Astro i18n requirement) |

---

## Architecture

### Portable Text block contract

Every `bol.*` Astro block:

```astro
---
import { getPtNode } from "../../utils/pt-node.ts";
import type { BolHeroNode } from "../../types/pt-blocks.ts";

const node = getPtNode<BolHeroNode>(Astro.props);
const { kicker, titleTop, titleAccent, subtitle, ctaMenu, ctaBook, scrollHint, backgroundImageUrl } = node;
---
```

**`getPtNode<T>(props)`** — returns `props.node` when present (EmDash path), else spreads legacy flat props for safety during migration.

**`types/pt-blocks.ts`** — one interface per block matching plugin `portableTextBlocks` field `action_id`s and seed JSON.

Blocks to update: `Hero`, `Benefits`, `Menu`, `Gallery`, `Contact`.

### Interactivity replacement

| Component (remove) | Replacement | Notes |
|--------------------|-------------|-------|
| `MenuTabs.tsx` | CSS radio tabs in `Menu.astro` | Radios **outside** `role="tablist"`; labels only in `inline-flex` pill row; `:has()` active pill; tiny JS for `aria-selected` / panel `hidden` |
| `OpenNowBadge.tsx` | `contact-open-now.ts` + JSON config in `Contact.astro` | Reuses `hours.ts` via bundled client module; 30s poll |
| `VenueMap.tsx` | Co-located `<script>` in `Contact.astro` | Dynamic `import("leaflet")`; `[data-venue-map]` roots |
| `ExperienceFilter.tsx` | **Keep** — page-level only | Slot into `ExperiencesRoute`; `client:load` on page files |

Delete after port: `MenuTabs.tsx`, `OpenNowBadge.tsx`, `VenueMap.tsx`.

### Route layout

```
src/pages/
  index.astro              # home EN — query + PortableText (no wrapper)
  hu/index.astro
  de/index.astro
  experiences.astro        # ExperiencesRoute + ExperienceFilter slot (client:load)
  hu/experiences.astro
  de/experiences.astro
```

Remove: `src/plugins/bol-theme/astro/routes/HomeRoute.astro`.

Keep: `ExperiencesRoute.astro`, `experiences-filter-props.ts`.

### Open-now + map scripts

- Extract shared **client-safe** hours helpers already in `utils/hours.ts` — ensure no Node-only APIs.
- Open-now: poll every 30s client-side (match current React behavior).
- Map: init once per `[data-venue-map]` root; cleanup on View Transitions if needed (optional; skip unless regressions).

---

## File map

| Path | Action |
|------|--------|
| `src/plugins/bol-theme/utils/pt-node.ts` | **Add** — `getPtNode<T>()` |
| `src/plugins/bol-theme/types/pt-blocks.ts` | **Add** — block node types |
| `src/plugins/bol-theme/astro/blocks/contact-open-now.ts` | **Add** — open-now client init |
| `src/plugins/bol-theme/astro/blocks/*.astro` | **Modify** — `node` props + vanilla interactivity |
| `src/plugins/bol-theme/astro/islands/MenuTabs.tsx` | **Delete** |
| `src/plugins/bol-theme/astro/islands/OpenNowBadge.tsx` | **Delete** |
| `src/plugins/bol-theme/astro/islands/VenueMap.tsx` | **Delete** |
| `src/plugins/bol-theme/astro/islands/ExperienceFilter.tsx` | **Keep** |
| `src/plugins/bol-theme/astro/routes/HomeRoute.astro` | **Delete** |
| `src/pages/index.astro`, `hu/index.astro`, `de/index.astro` | **Modify** — inline home |
| `src/pages/experiences.astro`, `hu/`, `de/` | **Verify** filter slot + `client:load` |

---

## Manual verification

1. `bun dev` — open `/`, `/hu/`, `/de/` — **no** hook errors in terminal.
2. Hero shows seeded kicker, titles, CTAs (en/hu/de).
3. Menu tabs switch categories; prices HUF formatted.
4. Contact: open-now badge updates; map renders; popup works.
5. `/experiences` — filter chips work (All / Gaming / Social / Events); 6 cards.
6. `bun run typecheck` — 0 errors.

---

## Post-ship follow-up (2026-09-07)

**Menu tab switcher layout:** First CSS-tab pass put hidden radios *inside* the flex `tablist`, which broke pill alignment (active orange background mis-sized on mobile). Fix: group radios above the tablist; tablist contains **labels only** with `inline-flex items-center justify-center min-h-11`; active state via `:has(#menu-tab-*:checked)` on `.menu-tabs`. Verified at 375px — tabs switch, pill tracks selection.

---

## Next step

Complete — plan [executed](../plans/2026-09-07-bol-pt-blocks-islands-fix.md) 2026-09-07. Remaining: Part 5 Task 21 full manual QA (375px + 1440px, en/hu/de) in [main migration spec](../../../specs/2026-09-05-bol-theme-migration-design.md#manual-verification-checklist).
