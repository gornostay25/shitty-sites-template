# Lighthouse Performance & A11y Optimization

**Status:** Implemented (archived 2026-09-17) — plan at [`../plans/2026-09-13-lighthouse-perf.md`](../plans/2026-09-13-lighthouse-perf.md)

### Amendment log

| Date       | Note                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-17 | **Shipped:** Hero block field is `backgroundImage` (Block Kit `action_id`), seed `$media` on that key. Types use `ImageValue` from `emdash` (`BolHeroNode.backgroundImage?: ImageValue \| string`). Map deferral finished via `VenueMap` + `client:visible` in [`2026-09-17-prod-interactivity-polish-design.md`](./2026-09-17-prod-interactivity-polish-design.md) (not custom `IntersectionObserver`). |

**Date:** 2026-09-13  
**Scope:** Mobile home `/` (primary), shared patterns for desktop  
**Goal:** Performance ≥90 mobile home, Accessibility ~100, Best Practices unchanged on staging (Cloudflare challenge scripts)

## Baseline (Lighthouse exports)

| Page | Perf | A11y | Best | LCP |
|------|------|------|------|-----|
| Mobile `/` | 75 | 95 | 81 | 6.6s |
| Desktop `/` | 92 | 95 | 100 | 1.8s |
| Mobile `/experiences` | 95 | 98 | 81 | 2.8s |

**Root cause (mobile home):** Hero is LCP element with `loading="lazy"`, no `fetchpriority="high"`, and Astro `_image` re-encodes bundled `src/assets/hero.webp` (94 KB source → ~586 KB transfer at 1024w).

**Out of scope (third-party):** Cloudflare `cdn-cgi/challenge-platform` deprecations (Best Practices 81), CF Insights legacy JS, ArcGIS tile HTTP/1.1 and cache TTL.

---

## 1. Hero image → CMS media (`seed/media`)

### Asset

- Move `src/assets/hero.webp` → `seed/media/hero.webp`
- Optimize with ffmpeg before commit:

  ```bash
  ffmpeg -i src/assets/hero.webp -vf "scale='min(1920,iw)':-2" \
    -c:v libwebp -quality 82 -compression_level 6 seed/media/hero.webp
  ```

- Target: ≤100 KB at 1920×1097 max (aspect ~16:9 from 1344×768 source)
- Delete `src/assets/hero.webp` after copy

### Seed

Add to all three `bol.hero` blocks (`home-hero-en`, `home-hero-hu`, `home-hero-de`):

```json
"backgroundImageUrl": {
  "$media": {
    "file": "hero.webp",
    "alt": "Bar of Legends interior"
  }
}
```

Mirror in `scripts/generate-bol-seed.ts` so regen keeps the ref.

`upload-seed-media.ts` already walks `revisions.data` for `$media` — no script change required.

### Plugin & types

- Keep admin field `backgroundImageUrl` (`media_picker`) — stores `ImageValue`, not a URL string
- Update `BolHeroNode.backgroundImageUrl` type to EmDash image object (or union with legacy string during migration — prefer object only after seed patch)

### `Hero.astro`

- Remove `import heroFallback from "../../../../assets/hero.webp"` and `astro:assets` `Image`
- Render with `<Image image={backgroundImageUrl} priority sizes="100vw" placeholder={false} class="..." />` from `emdash/ui`
- `priority` → `loading="eager"` + `fetchpriority="high"` (built into EmDash Image)
- Decorative hero: `alt=""` via prop override
- No fallback asset — CMS image is required in seed; empty field → gradient-only background (optional dark overlay only)

**Why CMS path:** Same pipeline as gallery/menu images (R2 + `/_emdash/api/media/file/…`), editable in admin, avoids bundling hero into Astro asset graph and double `_image` transform of a local import.

**Fallback if `_image` still bloats:** Serve direct media URL (`image.src` or `meta.storageKey`) via plain `<img>` for hero only — verify after deploy; prefer EmDash Image first.

---

## 2. Leaflet map — defer below fold

**File:** `Contact.astro`

| Before | After |
|--------|-------|
| Static `import "../../styles/leaflet.css"` (render-blocking) | CSS loaded inside dynamic `import("leaflet/dist/leaflet.css")` |
| `initVenueMaps()` on DOM ready | `IntersectionObserver` on `[data-venue-map]`, `rootMargin: 200px` |
| Leaflet + ArcGIS tiles on every home load | Map init only when contact section near viewport |

Removes ~45 KB JS + ~7 KB CSS + ArcGIS tiles from critical path on mobile home.

---

## 3. Accessibility fixes

### Menu tabs (`Menu.astro`)

**Issue:** `aria-selected` on `<label>` — invalid for label role.

**Fix:** Replace radio+label pattern with WAI-ARIA tabs:

- Container: `role="tablist"`
- Tab buttons: `role="tab"`, `aria-selected`, `aria-controls="{panelId}"`, `id="{tabId}"`
- Panels: `role="tabpanel"`, `aria-labelledby="{tabId}"`, `hidden` / `tabindex="0"` when active
- Keyboard: Arrow keys, Home/End (optional minimal: click-only OK if radiogroup removed — implement full tab keyboard for 100 score)
- Remove `.menu-tab-input` radio hack; use button `click` + `aria-selected` sync (same visual CSS)

### Site header logo (`SiteHeader.astro`)

**Issue:** `aria-label="Bar of Legends — Home"` but visible text `"BAR OF LEGENDS"` not in accessible name.

**Fix:** Remove `aria-label`; visible text is sufficient. Keep icon decorative (`aria-hidden` on icon wrapper).

---

## 4. Expected outcomes

| Metric | Mobile home (est.) |
|--------|-------------------|
| Performance | 88–95 (LCP ~2–3s from ~6.6s) |
| Accessibility | 98–100 |
| Best Practices | ~81 on staging (CF scripts) |
| SEO | 100 (unchanged) |

Experiences page unchanged except shared header a11y fix.

---

## 5. Verification (manual)

1. `bun dev` → re-seed or `bun run seed:media-upload:local` if DB lacks hero media
2. Lighthouse mobile on `/` — LCP element hero, no `loading="lazy"`, transfer <150 KB for hero
3. Network tab: no `leaflet` until scroll to `#contact`
4. axe / Lighthouse: menu tabs + logo pass
5. Admin: hero background editable via media picker

---

## 6. Files touched

| File | Change |
|------|--------|
| `seed/media/hero.webp` | Add (ffmpeg optimized) |
| `src/assets/hero.webp` | Delete |
| `seed/seed.json` | `$media` on 3 hero blocks |
| `scripts/generate-bol-seed.ts` | Hero media ref |
| `src/plugins/bol-theme/types/pt-blocks.ts` | Image type for `backgroundImageUrl` |
| `src/plugins/bol-theme/astro/blocks/Hero.astro` | EmDash `Image`, `priority` |
| `src/plugins/bol-theme/astro/blocks/Contact.astro` | Lazy map + dynamic CSS |
| `src/plugins/bol-theme/astro/blocks/Menu.astro` | Tab a11y pattern |
| `src/plugins/bol-theme/astro/theme/SiteHeader.astro` | Logo accessible name |

No new dependencies. No test files.
