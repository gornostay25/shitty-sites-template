# Phase 2 — BOL migration

**Period:** 2026-09-05 – 2026-09-07  
**Commits:** `5cc37b2`, `75fdd64`, `921fbc7`, `29d7c69`, `291ca20`  
**Sources:** [migration design spec](../superpowers/archive/2026-09-10/specs/2026-09-05-bol-theme-migration-design.md), [migration plans](../superpowers/archive/2026-09-10/plans/), [PT blocks fix spec](../superpowers/archive/2026-09-07/specs/2026-09-07-bol-pt-blocks-islands-fix-design.md), [final refactor spec](../superpowers/archive/2026-09-07/specs/2026-09-07-bol-final-refactor-design.md), [Lucide icons spec](../superpowers/archive/2026-09-07/specs/2026-09-07-bol-lucide-icons-design.md), agent transcripts `ab5753af`, `585d0517`, `8742e188`, `bc62729d`

## Context

Bar of Legends needed a production EmDash site matching the visual design (developed separately in `docs/design/v1/` — not part of this pipeline). The ShittySites template provided Cloudflare wiring and demo patterns but none of the BOL-specific content model, theme, or blocks.

**Design input:** `docs/design/v1/` Next.js prototype (reference only — rewrite, don't copy).  
**Target:** Native `bol-theme` EmDash plugin, CMS-driven menu/experiences/gallery, five Portable Text blocks, en/hu/de i18n, venue admin, JSON-LD SEO.

An initial monolithic migration attempt (`bc62729d`, same day) was abandoned in favor of a five-part plan executed across three days.

---

## Work log

### 2026-09-05 — Design + docs — `5cc37b2`

- **What:** Added migration spec, five implementation plan parts, and committed `docs/design/v1/` as reference.
- **Why:** Large migration needs written design before code; v1 prototype must be in-repo for agents and reviewers.
- **How:** Brainstorm session (`ab5753af`) produced architecture decisions; plans split into Parts 1–5 for incremental ship + manual QA.
- **Key design decisions (locked in spec):**
  - **Block builder home** — editors reorder PT blocks; not a fixed template page
  - **Monolith `bol-theme` plugin** — theme + blocks + venue KV + JSON-LD in one plugin
  - **Venue facts → plugin KV**, not CMS collection (hours, phone, address, socials)
  - **Menu / experiences / gallery → CMS collections** with taxonomies
  - **Rewrite prototype, don't copy** — AI-generated Next.js may have wrong patterns
  - **No shadcn/Radix on public site** — Astro + Tailwind only
  - **No legacy shims** — KV/settings renames are breaking; update code + re-enter admin
  - **Single locale-agnostic `address`** — drop per-locale address fields
  - **Remove `hub-feedback`** and **`demo-blocks`** when BOL ships
  - **No `pages.template` field** — single full-width layout
  - **i18n:** en default, hu/de fallback en; never `prefixDefaultLocale: true`

---

### 2026-09-05 — Part 1 + 2: Foundation + plugin core — `75fdd64`

- **What:** Migration foundation (i18n, fonts, wrangler rename) and full `bol-theme` plugin core with venue admin.
- **Why:** Part 1 clears template demo debris; Part 2 delivers venue data model + admin before seed/content work.
- **How:**

  **Part 1 — Foundation:**
  - Added Astro i18n: `en`, `hu`, `de` with fallback
  - Font providers: Bebas Neue (display) + Manrope (body) via EmDash `fontProviders`
  - Renamed wrangler project bindings toward `bar-of-legends`
  - Removed `hub-feedback` plugin entirely (deps, `Base.astro` mount, plugin dir)
  - Removed ShittySites demo routes/components that BOL replaces

  **Part 2 — Plugin core:**
  - `src/plugins/bol-theme/` skeleton: descriptor, `admin.tsx`, block registry (empty), registered in `astro.config.mjs`
  - Venue KV storage: scalar fields + opening hours JSON
  - API routes: `venue/settings` GET/POST (admin), `venue/public` GET (`public: true`)
  - `plugin:install` hook seeds Győr venue defaults
  - Utils: `hours.ts` (minute logic, post-midnight closes), `jsonld.ts`, `phone.ts` (libphonenumber-js), `venue.ts`
  - `page:metadata` hook emits JSON-LD (`kind: "jsonld"`)
  - `VenueSettingsPage` React admin — single `/venue` page with all fields + 7-row hours grid
  - `getUiStrings()` — en/hu/de type-enforced i18n for public UI

- **Decisions:**
  - **Single `/venue` admin page** — no auto-generated `settingsSchema` form; no separate hours page
  - **`mapsUrl` derived** from lat/lng via `buildMapsUrl()` — not stored/edited
  - **Phone derived** — one stored `phone`; public gets `phoneDisplay` + `phoneTel`
  - **Admin English-only** — public UI translated via plugin i18n utils
  - **Closed days** — each weekday row can be `closed: true`; omitted from JSON-LD

- **Problems → fixes (EmDash 0.36 friction):**

  | Docs/plan assumed | Shipped workaround |
  |-------------------|-------------------|
  | `usePluginAPI()` from admin | **Not exported** → custom `apiFetch()` wrapper in `plugin-api.ts` |
  | `@emdash-cms/admin` Card/Input | **Not exported** → `@cloudflare/kumo` form primitives |
  | Separate settings + hours pages | Merged into single `/venue` POST |
  | Raw `response.json()` | Unwrap `{ success, data }` envelope |
  | `PublicPageContext` from `emdash/page` | Import from **`emdash`** package root |

---

### 2026-09-06 — Part 3: Seed + theme chrome — `921fbc7`

- **What:** BOL seed data, theme shell components, icon system, navigation utilities.
- **Why:** Public site needs chrome (header, footer, mobile nav) and CMS content before blocks can render real data.
- **How:**
  - `scripts/generate-bol-seed.ts` — generates BOL-specific `seed/seed.json` (menu_items, experiences, gallery_items, pages, taxonomies, menus)
  - Theme partials: `SiteHeader`, `SiteFooter` (no hours), `MobileActionBar`, `LanguageSwitcher`, `MobileNav`
  - `Icon.astro` + hand-rolled inline SVGs (later replaced by Lucide in post-ship)
  - `fetch-venue.ts` — SSR venue loader from plugin public API
  - `nav.ts` — menu link resolution with locale awareness
  - Dark-only: pin `class="dark"`; removed ShittySites theme switcher demo
  - Design tokens in `global.css`: `#0d0d0f` bg, amber `#f2b33d`, teal `#45d0c8`, `rounded-card` 1rem

- **Decisions:**
  - **`MobileNav` = Astro + native `<dialog popover>`** — not React island
  - **Panel below sticky header** — `inset: 4rem 0 0`; header stays visible; popover styles co-located in `MobileNav.astro`
  - **Seed media as WebP** in `.emdash/uploads/`; theme-static assets in `src/assets/`

- **Problems → fixes:**
  - Prototype mobile nav had panel inside `<header>` → backdrop-blur containing block trapped fixed overlay → fixed via sibling DOM + popover API

---

### 2026-09-06 — Part 4: PT blocks + home — `29d7c69`

- **What:** Five Portable Text blocks registered and wired; home routes query `pages/home` + render PT stack.
- **Why:** Landing page is the core deliverable — block builder lets editors reorder sections.
- **How:**
  - Blocks: `bol.hero`, `bol.benefits`, `bol.menu`, `bol.gallery`, `bol.contact`
  - Home routes: `index.astro`, `hu/index.astro`, `de/index.astro`
  - Hero fallback: `src/assets/hero.webp` import; optional CMS `backgroundImageUrl` overrides
  - Menu/gallery blocks query CMS collections; contact block reads venue KV + Leaflet map
  - Uploaded 26 WebP images to `.emdash/uploads/` for seed media references
  - Locale slug guard: `/hu`, `/de` without trailing slash → redirect

- **Decisions:**
  - Leaflet client-only in contact block; dark popup/controls scoped in plugin CSS
  - Map z-index: wrap `.venue-map` in `z-0 isolate`; cap Leaflet pane z-index inside container (Leaflet panes 400–1000 paint above sticky header otherwise)

- **Problems discovered (fixed post-ship, same week):**
  - Blocks read flat `Astro.props` — EmDash passes **`Astro.props.node`** → hero/menu fields empty on dev
  - React components in PT `components` map (`MenuTabs`, `OpenNowBadge`, `VenueMap`) → **`Invalid hook call`** — Astro ignores `client:*` inside PT component maps

---

### 2026-09-07 — Part 5: Experiences + migration ship — `291ca20`

- **What:** Experiences catalog routes, demo template cleanup, post-ship fix specs written and partially implemented.
- **Why:** `/experiences` is the second major public page; ShittySites demo routes/plugins must be removed from the BOL fork.
- **How:**
  - Routes: `/experiences`, `/hu/experiences`, `/de/experiences`
  - `ExperiencesRoute.astro` shared layout + `ExperienceCard.astro`
  - `ExperienceFilter.tsx` — **only page-level React island** (`client:load` on page files, slot into route)
  - Removed: demo-blocks plugin, posts/category/tag routes, ShittySites shell components (`SiteHeader`, `SiteFooter`, etc. from `src/components/`)
  - Collection `experiences`: `search` + `seo`; taxonomy `experience_category`; `cta_type` tel/mailto/ask
  - Wrote post-ship fix specs: PT blocks/islands, final refactor, Lucide icons (archived under `2026-09-07/`)

- **Problems → fixes:**
  - `ExperienceFilter` hook error when island lived inside nested `ExperiencesRoute` — moved to page file + slot (same Astro rule as PT blocks)

---

### 2026-09-07 — Post-ship fix 1: PT blocks + islands

- **What:** Fixed empty CMS fields and React hook SSR errors across all PT blocks and home routes.
- **Why:** Part 4 + 5 ship exposed two systemic Astro + EmDash integration bugs.
- **How:**
  - **`getPtNode<T>(props)`** helper — reads `props.node` (EmDash) with flat-props fallback
  - **`types/pt-blocks.ts`** — one interface per block matching seed/admin field IDs
  - **Deleted React islands from PT blocks:** `MenuTabs.tsx`, `OpenNowBadge.tsx`, `VenueMap.tsx`, `HomeRoute.astro`
  - **Replacements (vanilla only in PT blocks):**

    | Removed | Replacement |
    |---------|-------------|
    | `MenuTabs.tsx` | CSS radio tabs in `Menu.astro` + tiny JS for `aria-selected` / `hidden` |
    | `OpenNowBadge.tsx` | `contact-open-now.ts` + JSON config in `Contact.astro`; 30s poll |
    | `VenueMap.tsx` | Dynamic `import("leaflet")` in `Contact.astro` `<script>`; `[data-venue-map]` roots |

  - Home inlined in `index.astro` / `hu/` / `de/` — no wrapper route component

---

### 2026-09-07 — Post-ship fix 2: Menu tab layout

- **What:** Fixed mobile menu tab pill alignment — active indicator mis-sized on 375px.
- **Why:** First CSS-tab pass put hidden radios inside flex tablist → wrong pill sizing.
- **How:** Radios above tablist; tablist = labels only in `inline-flex` pill row; active state via `aria-selected` (later iteration in final refactor).

---

### 2026-09-07 — Post-ship fix 3: Final refactor (CMS-first taxonomies)

- **What:** Removed hardcoded category unions, deduplicated social links, centralized experiences page loader.
- **Why:** Filter labels existed in both i18n and CMS taxonomy terms; menu tabs ignored new admin terms; social link markup copy-pasted across three theme files.
- **How:**
  - **`loadExperiencesPageData(locale, origin)`** — single loader; parallel fetch entries + terms + venue + SEO
  - **`utils/taxonomy.ts`** — `flattenCategoryTerms`, `primaryTermSlug`, `categoryLabelMap`
  - **`types/taxonomies.ts`** — `DEFAULT_*` arrays for seed only; runtime slugs = plain `string`
  - **Labels from CMS only** — i18n keeps `all` + `filterLabel`; removed `gaming`/`social`/`events` i18n keys
  - **Menu tabs iterate `getTaxonomyTerms("menu_category")`** — active style `[aria-selected="true"]`
  - **`utils/socials.ts`** — `socialLinksFromVenue()`, `socialNavLinksFromVenue()`; dedupe Contact, SiteFooter, MobileNav
  - **`experienceChipClass(slug)`** — themed chip for known slugs; neutral fallback for unknown CMS terms

- **Decisions:**
  - Keep `ExperiencesRoute.astro` (unlike deleted `HomeRoute`) — shared experiences logic stays
  - No custom chip colors in CMS — CSS maps known slugs; unknown gets neutral fallback

---

### 2026-09-07 — Post-ship fix 4: Lucide icons

- **What:** Replaced hand-rolled inline SVGs with `@lucide/astro` via thin `Icon.astro` wrapper.
- **Why:** Inconsistent icon sizing/stroke; footer contact icons especially messy.
- **How:**
  - Wrapper imports 14 mapped Lucide components; tree-shaken
  - Default `class="size-5"`; `aria-hidden="true"` on decorative icons
  - Social brands stay inline SVG (Instagram, Facebook, TikTok) — Lucide removed brand icons
  - Deleted dead `astro/icons/icons.tsx`

---

## Key decisions (summary)

| Decision | Alternatives considered | Rationale |
|----------|------------------------|-----------|
| Monolith `bol-theme` plugin | Separate theme + blocks plugins | One install, one admin entry, shared utils |
| Venue in plugin KV | CMS collection + Field Kit | Structured facts fit KV + custom admin; not editorial content |
| CMS collections for menu/experiences/gallery | Hardcoded data files | Editors manage content without deploys |
| Five-part incremental migration | Monolithic single session | Manual QA per part; abandoned monolith attempt same day |
| Vanilla JS/CSS in PT blocks only | React islands in blocks | Astro ignores `client:*` in PT component maps |
| `ExperienceFilter` page-level island only | Island inside route component | Same hydration rule; slot pattern works |
| CMS-first taxonomy labels | i18n + CMS duplicate labels | Single source of truth; new admin terms work without deploy |
| `@cloudflare/kumo` for plugin admin | `@emdash-cms/admin` Card/Input | Not exported on EmDash 0.36 |
| Remove all ShittySites demo on ship | Keep demo routes alongside BOL | Clean fork; no orphaned routes/components |
| No legacy KV shims | Read old keys on rename | Active development; breaking changes OK |

---

## Template takeaways

- **Template demo is not a client site** — BOL deleted ~80% of Spec 2 demo (posts, category archives, demo-blocks, hub-feedback, theme switcher). Template fork checklist must be explicit about bulk deletion.
- **Native theme plugin pattern works** — monolith plugin with PT blocks, theme partials, KV settings, and admin page is a repeatable agency pattern. Template should ship a scaffold plugin, not just demo-blocks.
- **Document Astro PT block rules prominently:**
  - Block components receive data via **`Astro.props.node`**, not flat props
  - **No React islands inside PT `components` map** — use vanilla JS/CSS or page-level islands with slots
- **Document EmDash 0.36 admin API gaps** — `usePluginAPI`, Card/Input not exported; Kumo + `apiFetch` is the working pattern.
- **i18n seed pattern** — row-per-locale content entries + `getUiStrings(locale)` for chrome strings; template should demonstrate this, not en-only demo content.
- **Taxonomy labels belong in CMS** — template i18n should not duplicate taxonomy term names; use `getTaxonomyTerms()` at runtime.
- **Seed generator script** (`generate-bol-seed.ts`) is client-specific — template should document when to write one vs hand-edit seed.json.
- **Block Kit field types** — verify media picker / repeater support before committing to field types in block definitions (hero URL field changed in phase 3).
- **`import.meta.url` in plugins** — must be inside factory function, not top-level (Workers runtime crash — fixed in phase 4).
- **Venue-as-KV pattern** — reusable for any site with structured business facts (hours, phone, address); template could ship a minimal version.
