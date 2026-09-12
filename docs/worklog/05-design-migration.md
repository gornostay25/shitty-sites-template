# Design migration — prototype to EmDash

**Period:** 2026-09-05 – 2026-09-07 (core migration + post-ship fixes)  
**Related phase:** [02 — BOL migration](./02-bol-migration.md) (implementation timeline)  
**Sources:** [migration design spec](../superpowers/archive/2026-09-10/specs/2026-09-05-bol-theme-migration-design.md), agent transcripts `ab5753af`, `585d0517`, `8742e188`, `bc62729d`, [`docs/design/prompt.md`](../design/prompt.md)

## Context — two pipelines

| Pipeline | Location | Role |
|----------|----------|------|
| **Visual prototype** | `docs/design/v1/` (Next.js 16) | Lock look, IA, mobile patterns — built separately via GLM agent ([`docs/design/prompt.md`](../design/prompt.md)) |
| **EmDash production** | This repo (`bol-theme` plugin) | CMS, admin, Cloudflare deploy — **this document** |

The prototype is **reference only**. Production code was **rewritten** in Astro + EmDash, not ported file-for-file. Prototype history lives in [`docs/design/v1/worklog.md`](../design/v1/worklog.md) (out of EmDash pipeline scope per [worklog README](./README.md)).

---

## Core principle: rewrite, don't copy

Locked **2026-09-05** in transcript `ab5753af` after explicit instruction: the prototype was AI-generated and may contain style bugs, wrong dependencies, and incorrect patterns.

| From prototype | In production |
|----------------|---------------|
| Copy-paste React/Next components | Rebuild in Astro + Tailwind; verify a11y and 375px layout |
| `globals.css` wholesale | Re-extract design **tokens** only; drop ~40 unused shadcn CSS variables |
| Assumed AI layout | Manual check: overflow, tap targets, contrast, z-index stacking |
| `next/image` | EmDash `<Image>` / Astro asset imports |
| Hardcoded `data/*.ts` | CMS collections + plugin KV |
| React `'use client'` everywhere | Astro-first; React only where Astro island rules allow |

**Spec rule:** reference `docs/design/v1/` for **look and IA**; **zero file copy**.

---

## Architecture — how prototype maps to EmDash

Brainstorm **2026-09-05** (`ab5753af`) split the site into three layers:

```
┌─────────────────────────────────────────────────────────┐
│  Theme chrome (always on — NOT Portable Text blocks)     │
│  SiteHeader, SiteFooter, MobileNav, MobileActionBar,     │
│  LanguageSwitcher — bol-theme/astro/theme/               │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Landing sections → 5 PT blocks on CMS pages/home        │
│  bol.hero, bol.benefits, bol.menu, bol.gallery,          │
│  bol.contact — editor can reorder                        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Experiences catalog → dedicated routes (/experiences)   │
│  ExperiencesRoute + ExperienceCard; filter = page island   │
└─────────────────────────────────────────────────────────┘
```

**Locked decisions affecting design migration:**

- **Monolith `bol-theme` plugin** — theme + blocks + venue KV + JSON-LD in one native plugin
- **Venue facts** (hours, phone, map coords, socials) → plugin KV + `/venue` admin — not CMS, not Field Kit
- **Menu / gallery / experiences** → CMS collections with taxonomies
- **Footer has no hours** — hours only in contact block (removed duplicate weekday labels from prototype)
- **Single locale-agnostic `address`** — one physical venue, not `addressEn`/`addressHu`/`addressDe`
- **No shadcn on public site** — Tailwind-only; admin uses Kumo
- **EmDash sections skipped** — plain PT blocks, not `/section` snippets

---

## Component mapping

| Prototype (`docs/design/v1/`) | Production | Migration notes |
|-------------------------------|------------|-----------------|
| `globals.css` | `src/styles/global.css` + plugin CSS | Tokens re-authored; kenburns keyframes ported |
| `Hero.tsx` | `bol.hero` → `Hero.astro` | Static image + CSS kenburns; optional CMS `backgroundImageUrl` (later `media_picker`) |
| `Benefits.tsx` | `bol.benefits` → `Benefits.astro` | 3-card grid; CMS repeater fields |
| `MenuTabs.tsx` | `bol.menu` → `Menu.astro` | **CSS radio tabs** + tiny JS — not React (see pitfalls) |
| `GalleryBento.tsx` | `bol.gallery` → `Gallery.astro` | Explicit mobile vs `md:` span classes |
| `ContactSection.tsx` | `bol.contact` → `Contact.astro` | Hours, open-now, map, tel/mailto, socials |
| `Footer.tsx` | `SiteFooter.astro` | Socials + contact — **no hours table** |
| `Header.tsx` | `SiteHeader.astro` | Sticky `z-50`; EmDash `primary` menu |
| `MobileNav.tsx` | `MobileNav.astro` | Native `<dialog popover>` — not React (see pitfalls) |
| `MobileActionBar.tsx` | `MobileActionBar.astro` | Fixed bottom; safe-area padding |
| `LanguageSwitcher.tsx` | `LanguageSwitcher.astro` | `getRelativeLocaleUrl`; mobile = drawer only |
| `ExperienceGrid.tsx` + `ExperienceCard.tsx` | `ExperiencesRoute.astro` + `ExperienceCard.astro` | Filter island on **page file only** |
| `OpenNowBadge.tsx` | `contact-open-now.ts` + Contact script | Vanilla 30s poll |
| `VenueMap.tsx` | Leaflet in `Contact.astro` `<script>` | Dynamic import; scoped z-index |
| shadcn `Button` | `<a class="…">` + Tailwind | shadcn rejected — 40+ ui files, ~1 used |
| `data/menu.ts` (18 items) | `menu_items` collection + seed | `generate-bol-seed.ts` ports data |
| `data/experiences.ts` (6) | `experiences` collection | Taxonomy `experience_category` |
| `data/gallery.ts` (12) | `gallery_items` collection | `span` field for bento layout |
| `data/hours.ts` | `utils/hours.ts` | Logic ported; storage → plugin KV |
| `data/venue.ts` | Plugin KV scalars | Derived: `mapsUrl`, `phoneDisplay`, `phoneTel` |
| `data/i18n/*.ts` | `utils/i18n/{en,hu,de}.ts` | Chrome strings only; CMS content per locale |

---

## Data layer migration

### Hardcoded TS → CMS + KV

Prototype used flat files under `docs/design/v1/src/data/`. Production split:

| Data type | Storage | Why |
|-----------|---------|-----|
| Editorial content (menu, gallery, experiences, page copy) | CMS collections | Editors change without deploy |
| Venue facts (hours, phone, coords, social URLs) | Plugin KV | Structured settings, custom admin |
| Navigation labels + URLs | EmDash menus | Per-locale `primary` menu in seed |
| Home block order | CMS `pages/home` PT stack | Block builder — not fixed template |

### Seed generation

- **`scripts/generate-bol-seed.ts`** reads prototype-shaped data and emits `seed/seed.json`
- **26 WebP images** in `.emdash/uploads/` (converted from prototype placeholders)
- **Taxonomies:** one definition + localized terms — not three duplicate defs (admin sidebar dupes fixed Sep 5)

### Venue SSR pitfall

Monolith attempt (`bc62729d`) fetched venue via HTTP to `/_emdash/api/plugins/bol-theme/venue/public` during SSR → **401**. Fix: **`getPluginSettings('bol-theme')`** (or equivalent direct KV read) on server — public API route is for browser clients only.

---

## i18n migration

### Astro config (Part 1)

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "hu", "de"],
  fallback: { hu: "en", de: "en" },
  // NEVER prefixDefaultLocale: true — breaks /_emdash/admin
}
```

### Two translation layers

| Layer | Mechanism |
|-------|-----------|
| **Theme chrome** | `getUiStrings(locale)` in `utils/i18n/` — header, footer, action bar, contact labels, status templates |
| **CMS content** | Row-per-locale entries in seed (`pages`, `menu_items`, `experiences`, `gallery_items`) |
| **Taxonomy labels** | `getTaxonomyTerms()` at runtime (post Sep 7 refactor) — not duplicated in i18n files |
| **Plugin admin** | English only |

Prototype `data/i18n/en|hu|de.ts` → type-enforced `UiStrings`. Address text comes from venue settings, not i18n dict. Post-refactor: removed `gaming`/`social`/`events` filter keys from i18n — CMS taxonomy is single source of truth.

---

## Design tokens migration

Prototype Tailwind 4 `@theme inline` in `globals.css` → production `--bol-*` vars in `global.css`:

| Token | Value |
|-------|-------|
| Background | `#0d0d0f` |
| Surface / surface-2 | `#16161a` / `#1e1e24` |
| Accent (amber) | `#f2b33d` |
| Accent muted (teal) | `#45d0c8` |
| Display font | Bebas Neue (latin-ext) |
| Body font | Manrope (latin-ext) |
| Card radius | `1rem` |

**Also ported:** kenburns animation, focus rings, reduced-motion, scrollbar styles.  
**Dropped:** shadcn CSS variable tree, global Leaflet overrides (scoped to contact block instead).  
**Base.astro:** pin `class="dark"`; remove ShittySites theme switcher; main `pb-[calc(5.5rem+safe-area)]` for mobile action bar clearance; `scrollbar-gutter: stable` (header jump fix).

Fonts via Astro `fontProviders.google()` — not `@fontsource` packages (monolith attempt used fontsource; part plan switched to `fontProviders`).

---

## Interactivity migration

Prototype relied on React `'use client'` for MenuTabs, OpenNowBadge, VenueMap, MobileNav, ExperienceGrid.

### Evolution during migration

| Feature | First attempt | Final production |
|---------|---------------|------------------|
| Mobile nav | React `MobileNav.tsx` (`client:only`) — hook crashes | **`MobileNav.astro`** — `<dialog popover>`, CSS `:popover-open` |
| Menu tabs | `MenuTabs.tsx` React island in PT block | **CSS radio tabs** in `Menu.astro` |
| Open now badge | `OpenNowBadge.tsx` | **`contact-open-now.ts`** + JSON in Contact |
| Venue map | `VenueMap.tsx` | **Dynamic `import("leaflet")`** in Contact `<script>` |
| Experience filter | Island inside `ExperiencesRoute` | **`client:load` on page file** + slot |

### Astro rules discovered (critical for future design migrations)

1. **PT blocks read `Astro.props.node`** — not flat props. Hero/menu fields were empty until `getPtNode()` helper (Sep 7).
2. **`client:*` inside PT `components` map is ignored** — causes `Invalid hook call` on home page.
3. **Page-level islands only** — `ExperienceFilter` must live on `experiences.astro`, not nested route components.
4. **Only one React island remains:** `ExperienceFilter.tsx`.

---

## Pitfalls and fixes

### Known from prototype review (fixed during rewrite)

| Issue | Prototype problem | Production fix |
|-------|-------------------|----------------|
| **Mobile nav backdrop-blur** | Panel inside `<header>` — containing block traps fixed overlay; logo resizes on open | Panel as **sibling** of header; `inset: 4rem 0 0`; native popover |
| **Map z-index** | Leaflet panes z-index 400–1000 paint above sticky header `z-50` | Wrap `.venue-map` in `z-0 isolate`; cap pane z-index inside container |
| **Gallery bento mobile** | `col-span-2 row-span-2` breaks 2-col grid | Explicit mobile spans + `md:` overrides; CMS `span` field |
| **Menu tab pills 375px** | Hidden radios inside flex tablist — pill misaligned | Radios above tablist; labels in `inline-flex` row; `aria-selected` |
| **Footer hours duplicate** | Hours in footer + contact | Hours **contact block only** |
| **Header jump on menu open** | Scrollbar disappearance shifts layout | `scrollbar-gutter: stable` + body padding compensation |
| **Lang switcher mobile** | Duplicate in header + drawer | Lang switcher **drawer only** on mobile |

### Discovered during EmDash implementation

| Issue | When | Fix |
|-------|------|-----|
| Empty CMS block fields | Part 4 ship | `getPtNode<T>(props)` — EmDash passes `node`, not flat props |
| `Invalid hook call` on home | Part 4–5 | Remove all React from PT blocks; vanilla replacements |
| `401` on venue SSR fetch | Monolith attempt | Direct plugin settings read, not admin API URL |
| EmDash 0.36 admin gaps | Part 2 | Kumo + `apiFetch` — not `usePluginAPI` / admin Card |
| 3 duplicate taxonomy sidebar entries | Part 3 seed | One taxonomy def + localized terms |
| Top-level `import.meta.url` | Deploy | Move inside plugin factory — Workers crash |

### Rejected approaches

| Approach | Why rejected |
|----------|--------------|
| **shadcn/ui on public site** | 40+ components, ~1 used; React+Radix weight; Astro shell is not React |
| **Field Kit for venue settings** | Only decorates collection JSON — not plugin KV |
| **Monolithic one-session migration** (`bc62729d`) | 401 + hook errors; abandoned for 5-part incremental plan |
| **Copy prototype React components into PT blocks** | Astro PT map ignores `client:*` — systemic hydration failure |

---

## What was not migrated

| Prototype feature | Reason |
|-------------------|--------|
| **Waze deep link** | Removed in prototype v10; Google Maps via `buildMapsUrl()` only |
| **Video hero** | Static WebP + CSS kenburns sufficient for v1 |
| **shadcn / Radix tree** | Rejected Sep 5 |
| **Next.js architecture** | Full Astro SSR rewrite |
| **Blog / posts** | Out of scope; ShittySites demo deleted |
| **Booking backend** | `mailto:` / `tel:` CTAs only |
| **Per-locale addresses** | Single physical address |
| **Stored maps URL / formatted phone** | Derived at read time from coords / E.164 |
| **Fixing prototype in place** | Reference frozen in `docs/design/v1/` |

---

## Migration timeline

| Date | Milestone |
|------|-----------|
| **2026-09-05 AM** | Design brainstorm (`ab5753af`): architecture, rewrite rule, shadcn no, spec + 5-part plan |
| **2026-09-05 midday** | Failed monolith attempt (`bc62729d`) → incremental parts |
| **2026-09-05** | Part 1: i18n, tokens, Base shell. Part 2: plugin core + venue admin |
| **2026-09-05–06** | Part 3: seed + theme chrome; mobile nav → popover. Part 4: five PT blocks + home |
| **2026-09-07** | Part 5: experiences. PT `node` fix. Menu tabs layout. CMS-first taxonomies. Lucide icons |

---

## Template takeaways (design → EmDash pipeline)

For the agency workflow “visual prototype → EmDash site” (future template/docs):

- **Document the two-pipeline model** — prototype repo/folder is reference; EmDash repo rewrites everything.
- **Ship a component mapping checklist** — theme chrome vs PT blocks vs dedicated routes before coding.
- **Document Astro PT + island rules upfront** — saves a full post-ship fix pass (`props.node`, no React in PT map).
- **Prototype review checklist before migration** — z-index, mobile nav DOM, bento grid mobile, duplicate data in footer/contact.
- **Seed generator from prototype data** — `generate-bol-seed.ts` pattern for porting hardcoded content to CMS seed.
- **Venue-as-KV + collections split** — document when facts are settings vs editorial content.
- **Verify Block Kit field types before block definitions** — hero URL → `media_picker` migration was avoidable.
- **Incremental migration parts** — do not attempt monolithic prototype→production in one session.

Consolidated template backlog: [`../template-lessons.md`](../template-lessons.md).
