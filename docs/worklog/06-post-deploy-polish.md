# Phase 5 — Post-deploy polish

**Period:** 2026-09-12 – 2026-09-17  
**Commits:** `191271d`, `bb6ac4c`, `d39dd77`, `2896253`, `396b989`  
**Sources:** [gallery archive](../superpowers/archive/2026-09-12/), [template backport archive](../superpowers/archive/2026-09-13/), [Lighthouse + interactivity archive](../superpowers/archive/2026-09-17/), agent transcripts `585d0517`, `2c2b2dff`, `03075cf0`, git diff

## Context

Phase 4 left BOL live on Cloudflare with CLI seed import and media upload scripts. The next stretch focused on **public UX polish** (gallery, feedback widget shape), **feeding learnings back into the ShittySites template** (merge from `origin/main`), and **production-grade client JS** (Lighthouse LCP, co-located scripts, deferred map island). EmDash moved **0.37 → 0.38** with patch recreation.

This phase is where subtle **Astro i18n + rewrite routing** bugs surfaced — especially confusing because the language switcher could look correct while CMS content rendered in the default locale.

---

## Work log

### 2026-09-12 — `191271d` gallery lightbox + local seed media

- **What:** Fixed gallery bento grid (EmDash `<Image>` fill, span classes `md+` only), added native `<dialog popover>` lightbox with open/close animation, added `seed:media-upload:local` for Miniflare R2/D1 after `bun dev`, updated deploy/seed docs, archived gallery spec/plan under `2026-09-12`.
- **Why:** Production gallery tiles did not fill cells; editors need click-to-enlarge; dev workflow should mirror production `$media.file` upload without deploying.
- **How:**
  - Reworked `Gallery.astro` layout and lightbox markup (later refactored again in `396b989` into `GalleryLightbox.astro` enhancer)
  - Extended `scripts/upload-seed-media.ts` with `--local` targeting `.wrangler/` D1 + local R2
  - i18n strings for lightbox chrome (`en` / `hu` / `de`)
- **Decisions:** Popover dialog over React lightbox — stays inside PT “no islands in block map” rule.

---

### 2026-09-12 — `bb6ac4c` hub-feedback env island

- **What:** Removed EmDash native `hub-feedback` plugin; moved widget to `src/hub-feedback/` configured via `HUB_API_KEY` / `HUB_SITE_ID`, `vite.define`, and `<HubFeedback />` in `Base.astro`. Archived Vite-plugin spec/plan; superseded Sep 3 plugin design as historical.
- **Why:** Agency feedback tool is optional per client; env-driven island avoids plugin registration in client forks and matches template direction after backport.
- **How:**
  - `resolveHubFeedbackConfig()` + `loadEnv` in `astro.config.mjs`
  - Widget React tree relocated from `src/plugins/hub-feedback/` to top-level `src/hub-feedback/`
  - Renamed patch to `emdash@0.37.0.patch` as part of dependency alignment in same commit window
- **Decisions:** No hub plugin in default template; credentials only via `.env` (document restart after env change).

---

### 2026-09-13 — `d39dd77` template backport (merged via `2896253`)

- **What:** Merged ShittySites template work that **backported BOL production patterns**: KV bindings, D1 export + R2 media scripts, committed `seed/media/` WebP assets, `CLOUDFLARE-DEPLOYMENT.md`, Ukrainian locale demo (`en` + `uk`), locale slug guards, locale-aware 404s, Hub Feedback `loadEnv` fix, `demo-blocks` `import.meta.url` fix. Archived `2026-09-13` template-backport and post-backport specs/plans.
- **Why:** Client fork proved deploy pipeline; template repo must inherit scripts and docs without re-discovering KV 10014 and D1 import pitfalls.
- **How:** Large single commit on template side; BOL branch merged `origin/main` to stay aligned. Full task list lives in archived plan — not duplicated here.
- **Decisions:** Template demo uses **`uk`**; BOL fork keeps **`hu` / `de`** — same routing ideas, different locale lists in `getRequestLocale()` / `locales.ts`.

---

### 2026-09-17 — `396b989` Lighthouse hero + prod interactivity + i18n guards

- **What:** Hero LCP via `seed/media/hero.webp` + EmDash `<Image priority />`; removed global `public-page.ts`; split client behavior into enhancer components and `VenueMap` React island (`client:visible`); hero PT type uses `ImageValue`; EmDash **0.38** + patch; hardened remote `upload-seed-media.ts`; locale-aware **301 redirects** for `/home` and bare `/hu` / `/de`; archived Lighthouse and interactivity specs under `2026-09-17`.
- **Why:** Lighthouse and prod bundle hygiene; map should not block LCP; CMS media types should match EmDash; rewrite-only locale home URLs served **English** home body at prefixed URLs (see pitfalls).
- **How:**
  - Deleted `public-page.ts`, `venue-map-mount.ts`, `VenueMapIsland.astro`; added `OpenNowBadge`, `MenuTabsEnhancer`, `GalleryLightbox`, `MobileNavEnhancer`, `VenueMap.tsx`, `safe-media-url.ts`
  - `ExperienceFilter`: `client:load` → `client:idle`
  - `[slug].astro`: `getRequestLocale(Astro.originPathname)` for `/home` redirect target; bare locale slug → `getRelativeLocaleUrl(slug, "/")` **redirect** (not `Astro.rewrite("/")`)
  - `LanguageSwitcher.astro` already used `getRequestLocale` — mismatch with pages using `Astro.currentLocale` was the visible bug
  - `AGENTS.md` updated: `ImageValue`, interactivity rules, `getRequestLocale` on dynamic routes
- **Decisions:**
  - **`/home` → canonical locale home via 301** (user chose redirect over rewrite so URL and `currentLocale` stay consistent on `index.astro`)
  - Static top-level Leaflet CSS imports in `VenueMap.tsx` after prod MIME/preload failure
  - Keep `BolHeroNode.backgroundImage` as `ImageValue | string` for legacy URL strings in seed

---

## Pitfalls & platform nuances

These issues are easy to miss in code review because symptoms look like “wrong translation” or “CSS broken in prod” rather than routing bugs.

### 1. `Astro.currentLocale` under `fallbackType: "rewrite"`

| | |
|--|--|
| **Symptom** | User on `/hu/home` or `/hu` sees **English** page body; language switcher may still highlight **HU**. |
| **Cause** | EmDash uses a **single template tree** (`src/pages/index.astro`, `[slug].astro`) with `i18n.routing.fallbackType: "rewrite"`. On **`[slug].astro`**, Astro often sets `Astro.currentLocale` to the **default locale (`en`)** because the matched route file is the unprefixed dynamic page, not a `src/pages/hu/` tree. |
| **Wrong fix** | `Astro.rewrite("/")` or `getRelativeLocaleUrl(Astro.currentLocale, "/")` — uses **`en`** as target locale. |
| **Right fix** | Derive locale from the **request URL**: `getRequestLocale(Astro.originPathname)` (first path segment if in `PREFIXED_LOCALES`). Use that for redirects, UI strings, and **CMS queries** on affected routes. Prefer **301 to canonical prefixed home** (`/hu/`) over rewriting to `/` when rewrite would drop locale context for `index.astro`. |
| **Where** | `src/plugins/bol-theme/utils/i18n/index.ts`, `src/pages/[slug].astro`, `LanguageSwitcher.astro`, `404.astro`, `experiences.astro`; `Gallery.astro` uses `getRequestLocale` for UI — **Menu/Contact blocks still use `Astro.currentLocale`** (residual inconsistency to align when touching those files). |
| **Template note** | Archived template backport (`2026-09-13`) documented `Astro.rewrite("/")` for locale home; BOL production experience showed **EN content at `/hu`** until redirects used pathname-derived locale. Document both rewrite semantics and this failure mode for single-template EmDash sites. |

### 2. Language switcher vs CMS locale (split brain)

| | |
|--|--|
| **Symptom** | Switcher shows correct active language; Portable Text or collection queries return **default locale** entries. |
| **Cause** | Switcher uses `originPathname` + `getRequestLocale`; page or block uses `Astro.currentLocale ?? "en"`. |
| **Fix** | One rule: **any server query keyed by locale** on rewrite i18n sites should use the same helper as the switcher unless the route is guaranteed to be `index.astro` with correct `currentLocale`. Document in `AGENTS.md`. |

### 3. `/home` CMS slug vs canonical `/`

| | |
|--|--|
| **Symptom** | Duplicate home URLs; SEO and locale bugs on `/hu/home`. |
| **Cause** | CMS may expose a `home` page slug while marketing URL is `/`. |
| **Fix** | Early exit in `[slug].astro`: if `slug === "home"`, **301** to `getRelativeLocaleUrl(getRequestLocale(originPathname), "/")`. |
| **Rejected** | `Astro.rewrite` to `/` — keeps URL `/home` but **`currentLocale` stayed wrong** on dynamic route (same class as pitfall 1). |

### 4. Portable Text blocks and client scripts

| | |
|--|--|
| **Symptom** | Hoisted or inline scripts in PT block `.astro` files fight bundling rules or duplicate init. |
| **Cause** | PT blocks are not the right place for global boot; block map ignores React `client:*`. |
| **Fix** | **Enhancer child components** imported from blocks: markup in block, `<script>` in `*Enhancer.astro` or dedicated component (`OpenNowBadge.astro`). Map = React island on `Contact.astro` with `client:visible={{ rootMargin }}`. |
| **Also** | No layout-level `public-page.ts` — deleted in favor of co-located scripts. |

### 5. Leaflet CSS on Cloudflare Workers

| | |
|--|--|
| **Symptom** | Console: stylesheet MIME type `text/html`; preload helper throws; map unstyled. |
| **Cause** | Dynamic `import("leaflet/dist/leaflet.css")` inside `useEffect` — asset URL can resolve to HTML error page on Workers. |
| **Fix** | **Static** `import "leaflet/dist/leaflet.css"` (and theme overrides) at top of `VenueMap.tsx` so Vite bundles CSS with the island chunk. |

### 6. Hero LCP and media types

| | |
|--|--|
| **Symptom** | LCP not attributed to CMS hero; large static asset in repo root. |
| **Cause** | Hero background in `src/assets/` + plain `<img>` bypasses EmDash media pipeline. |
| **Fix** | Committed **`seed/media/hero.webp`**, `$media.file` + upload script, block field → **`ImageValue`**, render with `<Image priority sizes="100vw" />`. PT type: `ImageValue \| string` + `safe-media-url.ts` for legacy strings. |

### 7. Remote seed media script and local DB

| | |
|--|--|
| **Symptom** | `seed:media-upload` fails with `SQLITE_CANTOPEN` on `.emdash/seed-migration.db`. |
| **Cause** | Read-only open or missing DB after remote-only workflow. |
| **Fix** | Try read-write open when read-only fails; clearer errors when DB missing (run local seed / export first). |

### 8. EmDash patch version drift

| | |
|--|--|
| **Symptom** | `bun install` patch apply failure after bump. |
| **Cause** | Patch filename must match **exact** installed `emdash` version (`0.37` → `0.38`). |
| **Fix** | Recreate patch via `bun patch`; update `AGENTS.md` in same change. Evidence chain: phase 3 (`c7eb374`), this phase (`396b989`). |

---

## Key decisions (summary)

| Decision | Alternatives considered | Rationale |
|----------|-------------------------|-----------|
| Pathname-based locale for slug redirects | Trust `Astro.currentLocale` | Rewrite routing breaks default on `[slug]` |
| 301 for `/home` and bare `/hu` | Internal rewrite | Canonical URL + correct locale on `index.astro` |
| Co-located enhancers vs global boot | Keep `public-page.ts` | Smaller bundles, clearer ownership |
| `client:visible` for map | Manual `IntersectionObserver` | Astro-native lazy hydration |
| Hub feedback as env island | EmDash plugin | Optional agency tool; template stays clean |
| `ImageValue` on hero | Custom Bol media type | Align with EmDash CMS types |

---

## Template takeaways

- **Document `getRequestLocale` vs `Astro.currentLocale`** for EmDash single-template + `fallbackType: "rewrite"` — include failure symptoms (switcher OK, content wrong). Link to [pitfalls §1](#1-astrocurrentlocale-under-fallbacktype-rewrite).
- **Document enhancer pattern** for PT block interactivity (no hoisted scripts in block files; no global layout boot).
- **Document map island pattern**: React + `client:visible` + static CSS imports on Workers.
- **Ship LCP hero as seed media + `<Image priority />`** in template docs, not `src/assets` only.
- **Hub feedback**: optional `src/hub-feedback/` island, not a native plugin in default template.
- **Gallery dev parity**: `seed:media-upload:local` alongside production upload (extends phase 4 script story).
- **Template backport loop**: production fork → scripts/runbook → merge to template (`d39dd77`); locale list differs per client but routing pitfalls are shared.

Consolidated backlog: [`../template-lessons.md`](../template-lessons.md).
