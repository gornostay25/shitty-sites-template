# Prod interactivity polish (post–Lighthouse)

**Status:** Implemented (archived 2026-09-17) — plan at [`../plans/2026-09-17-prod-interactivity-polish.md`](../plans/2026-09-17-prod-interactivity-polish.md)

**Supersedes (partially):** [`../specs/2026-09-13-lighthouse-perf-design.md`](../specs/2026-09-13-lighthouse-perf-design.md) — map lazy-load via Astro `client:visible`; removed global `public-page.ts` boot; hero PT types use `ImageValue` from `emdash`.

**Date:** 2026-09-17  
**Scope:** Bar of Legends public theme (`bol-theme`) — client JS architecture, types, dead code  
**Goal:** Production-ready polish after Lighthouse perf work: no global page boot, no hand-rolled `IntersectionObserver`, co-located interactivity, consistent types, clean build.

**Builds on:** [`2026-09-13-lighthouse-perf-design.md`](./2026-09-13-lighthouse-perf-design.md) (hero CMS media in `seed/media/`, menu/header a11y).

---

## Success criteria

- `Base.astro` does **not** import a global public client boot script.
- Leaflet map loads only when near viewport, via Astro **`client:visible`** (not custom `IntersectionObserver`).
- Menu tabs, open-now badge, gallery lightbox, mobile nav: **processed** Astro `<script>` in **child components** statically imported from PT blocks or theme — not hoisted scripts inside PT block `.astro` files.
- No `is:inline` scripts where processed scripts + `data-*` props suffice.
- `bun run build` succeeds; manual smoke on `/`, `/experiences`, one prefixed locale (`/hu/…`).
- Image-related types align with EmDash image objects (`<Image image={…} />` from `"emdash/ui"`).

**Out of scope:** New CMS fields, Cloudflare third-party scripts, automated tests (project has no test suite).

---

## Constraints (EmDash + Astro)

- **Portable Text blocks** receive `Astro.props.node`; block `.astro` files must **not** use hoisted `<script>` (Vite HMR / script index issues under PT). Interactivity lives in **separately imported** `.astro` children or React islands.
- **`client:*` directives** apply only to **UI framework** components (React here), not plain `.astro` components ([Astro docs](https://docs.astro.build/en/guides/framework-components/#can-i-hydrate-astro-components)).
- **Processed** `<script>` tags (no extra attributes): TypeScript, bundling, **deduplication** once per page ([script processing](https://docs.astro.build/en/guides/client-side-scripts/#script-processing)).
- **Pass server data to client** via `data-*` on HTML, read in script via `dataset` — not frontmatter in browser.
- **No legacy re-export shims** when moving modules; update imports and delete old files.

---

## Approach: Cα (mixed)

| Surface | Mechanism | Load priority |
|--------|-----------|----------------|
| Venue map | React island `VenueMap.tsx` | `client:visible={{ rootMargin }}` |
| Gallery lightbox | `GalleryLightbox.astro` + bundled script | On pages with gallery (click-driven) |
| Menu tabs | `MenuTabsEnhancer.astro` + `menu-tabs.ts` | With menu block |
| Open-now badge | `OpenNowBadge.astro` + `contact-open-now.ts` | With contact block |
| Mobile nav | `MobileNavEnhancer.astro` + `data-*` labels | `client:media` **not** required — nav is in header; small processed script |
| Experiences filter | Existing `ExperienceFilter.tsx` | Change `client:load` → `client:idle` |

Shared constant (single file):

```ts
// src/plugins/bol-theme/astro/islands/constants.ts
export const VIEWPORT_LAZY_ROOT_MARGIN = "200px";
```

Used for map island only (matches prior perf spec root margin).

---

## Architecture

```
src/plugins/bol-theme/astro/
  islands/
    constants.ts          # VIEWPORT_LAZY_ROOT_MARGIN
    VenueMap.tsx          # NEW — Leaflet init (dynamic import)
    ExperienceFilter.tsx  # client:idle tweak
  components/
    OpenNowBadge.astro    # NEW — badge markup + script
    GalleryLightbox.astro # NEW — dialog + script
    MenuTabsEnhancer.astro# NEW — script only / minimal wrapper
    MobileNavEnhancer.astro # NEW — popover a11y script
    VenueMapIsland.astro  # DELETE or fold into VenueMap.tsx markup
  blocks/
    Contact.astro         # import OpenNowBadge, VenueMap island
    Menu.astro            # import MenuTabsEnhancer at end
    Gallery.astro         # import GalleryLightbox; remove inline script
  theme/
    MobileNav.astro       # import MobileNavEnhancer; remove is:inline
  client/
    public-page.ts        # DELETE

src/layouts/Base.astro    # remove public-page script import

DELETE after migration:
  venue-map-mount.ts
  public-page.ts
```

---

## Component behavior

### Venue map (`VenueMap.tsx`)

- **Props:** `lat`, `lng`, `title`, `address`, `ariaLabel` (same as current `VenueMapIsland`).
- **Markup:** Preserve existing classes/structure (`venue-map`, canvas, loading spinner) for CSS parity.
- **On mount (after `client:visible` hydrates):** Dynamic import `leaflet` + `leaflet/dist/leaflet.css` + theme `leaflet.css`; build map, tiles, marker, popup; remove loading overlay; guard double-init.
- **Contact.astro:** Replace `<VenueMapIsland />` with `<VenueMap client:visible={{ rootMargin: VIEWPORT_LAZY_ROOT_MARGIN }} … />`.

### Open now (`OpenNowBadge.astro`)

- Move badge `<span>` markup from `Contact.astro`.
- `data-open-now-config` JSON on root element (same payload as today).
- Script: parse config, call `initOpenNowBadge(rootId, config)` — prefer scoping by element ref / `data-badge-id` over hard-coded document-wide IDs if a small markup change is enough.

### Menu tabs (`MenuTabsEnhancer.astro`)

- Imported once at bottom of `Menu.astro` (sibling to `.menu-tabs` markup, or wrapping no extra DOM).
- Script: `document.querySelectorAll(".menu-tabs").forEach(initMenuTabs)` — deduped once per page.
- Keep `menu-tabs.ts` as pure DOM helper (no document-wide boot).

### Gallery (`GalleryLightbox.astro`)

- Owns lightbox dialog, image, caption, close control; grid triggers stay in `Gallery.astro` or move into lightbox component via slot — prefer **one component** owning dialog + script that delegates clicks from `.bol-gallery-grid` within a scoped wrapper (`data-bol-gallery-root`).
- Replace `is:inline` with processed `<script>` importing handlers from a small `.ts` module if logic grows beyond ~30 lines.

### Mobile nav (`MobileNavEnhancer.astro`)

- Trigger/nav: `data-open-label`, `data-close-label` on elements (from server props).
- Processed script: popover `toggle` → update `aria-expanded` / `aria-label`; link click → `hidePopover()`.
- Remove `is:inline define:vars` from `MobileNav.astro`.

### Experiences filter

- `experiences.astro`: `client:idle` on `ExperienceFilter` (filters visible but not LCP-critical).

---

## Types and cleanup

- **`pt-blocks.ts`:** `BolHeroNode.backgroundImage?: ImageValue | string` (import `ImageValue` from `emdash` — no custom `BolMediaImage` type).
- **`Hero.astro`:** `<Image image={…} />` from `emdash/ui` with `safe-media-url.ts` for legacy string values only.
- **`resolve-media-picker-url.ts`:** Removed; replaced by `safe-media-url.ts`.
- **Imports:** No references to `public-page.ts`, `venue-map-mount.ts`, or deleted `VenueMapIsland` after map island ships.
- **IDs:** Avoid duplicate `open-now-badge` assumptions across pages (only one contact block per page today — document assumption).

---

## Verification (manual)

1. `bun run build` — zero errors.
2. **Home `/`:** Menu tabs switch panels + keyboard; scroll to contact → map loads, spinner clears; open-now updates; gallery opens/closes lightbox.
3. **Mobile width:** Hamburger labels toggle; nav closes on link tap.
4. **`/experiences`:** Category filter works after idle hydration.
5. **`/hu/` (or `/de/`):** Same smoke on one localized home if PT blocks present.
6. **Optional:** Lighthouse mobile home — performance should not regress vs post-hero fix (map still deferred).

---

## References

- [Astro client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives) — `client:visible`, `rootMargin`
- [Astro client-side scripts](https://docs.astro.build/en/guides/client-side-scripts/)
- [EmDash getting started](https://docs.emdashcms.com/getting-started/) — image fields, server-rendered content
- Project `AGENTS.md` — PT blocks, i18n, no `prefixDefaultLocale`
