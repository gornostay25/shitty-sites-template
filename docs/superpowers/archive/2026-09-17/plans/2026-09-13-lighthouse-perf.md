# Lighthouse Performance & A11y Implementation Plan

**Status:** Implemented (archived 2026-09-17) — spec at [`../specs/2026-09-13-lighthouse-perf-design.md`](../specs/2026-09-13-lighthouse-perf-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise mobile home Lighthouse Performance to ≥90 and Accessibility to ~100 by fixing hero LCP (CMS media + priority loading), deferring Leaflet, and correcting menu/header a11y.

**Architecture:** Move hero background from bundled `src/assets/hero.webp` into `seed/media/` as a `$media` ref on all `bol.hero` blocks; render with `emdash/ui` `Image` and `priority`. Defer map JS/CSS/tiles until `#contact` enters viewport via `IntersectionObserver`. Replace invalid menu radio+label ARIA with a proper tablist pattern.

**Tech Stack:** Astro 7, EmDash 0.37, Bun, ffmpeg, Leaflet 1.9.4, Tailwind 4

**Spec:** [`../specs/2026-09-13-lighthouse-perf-design.md`](../specs/2026-09-13-lighthouse-perf-design.md)

## Global Constraints

- No automated test files or test scripts (project has no test suite).
- Manual verification only (Lighthouse, Network tab, admin UI).
- Do not commit unless the user explicitly asks.
- Image fields are objects `{ id, src, alt, width, height, meta }` — use `<Image image={...} />` from `"emdash/ui"`.
- Seed media lives in `seed/media/`; patch DB via `bun run seed:media-upload:local` after seed changes.
- Out of scope: Cloudflare challenge scripts, CF Insights beacon, ArcGIS HTTP/1.1.

---

## File map

| File | Responsibility |
|------|----------------|
| `seed/media/hero.webp` | Optimized hero asset (ffmpeg) |
| `src/assets/hero.webp` | **Delete** — no longer used |
| `seed/seed.json` | `$media` on 3× `bol.hero` blocks |
| `scripts/generate-bol-seed.ts` | `backgroundImageUrl: media("hero.webp", …)` in `homePageContent` |
| `src/plugins/bol-theme/types/pt-blocks.ts` | `backgroundImageUrl` typed as image object |
| `src/plugins/bol-theme/astro/blocks/Hero.astro` | EmDash `Image` + `priority` |
| `src/plugins/bol-theme/astro/blocks/Contact.astro` | Lazy map; no render-blocking CSS |
| `src/plugins/bol-theme/astro/blocks/Menu.astro` | WAI-ARIA tabs |
| `src/plugins/bol-theme/astro/theme/SiteHeader.astro` | Logo accessible name fix |

---

### Task 1: Hero asset in `seed/media`

**Files:**
- Create: `seed/media/hero.webp`
- Delete: `src/assets/hero.webp`

**Interfaces:**
- Produces: `seed/media/hero.webp` (≤100 KB WebP, max width 1920px)

- [ ] **Step 1: Optimize and copy with ffmpeg**

Run from repo root:

```bash
ffmpeg -y -i src/assets/hero.webp \
  -vf "scale='min(1920,iw)':-2" \
  -c:v libwebp -quality 82 -compression_level 6 \
  seed/media/hero.webp
ls -lh seed/media/hero.webp
```

Expected: file exists, size roughly 80–100 KB.

- [ ] **Step 2: Verify dimensions**

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 seed/media/hero.webp
```

Expected: width ≤1920, height proportional to 1344×768 (~1097 at 1920w).

- [ ] **Step 3: Delete bundled asset**

```bash
rm src/assets/hero.webp
```

Expected: `src/assets/hero.webp` gone; no other imports remain (Task 4 removes Hero.astro import).

---

### Task 2: Seed + generator — hero `$media` ref

**Files:**
- Modify: `seed/seed.json` (3 hero blocks: `home-hero-en`, `home-hero-hu`, `home-hero-de`)
- Modify: `scripts/generate-bol-seed.ts` (`homePageContent`)

**Interfaces:**
- Consumes: `seed/media/hero.webp` from Task 1
- Produces: `$media` refs resolved to image objects after `seed:media-upload:local`

- [ ] **Step 1: Add media ref to `seed/seed.json`**

Inside each of the three `bol.hero` blocks, add (after `"scrollHint"` or equivalent last text field):

```json
"backgroundImageUrl": {
  "$media": {
    "file": "hero.webp",
    "alt": "Bar of Legends interior"
  }
}
```

Blocks to patch:
- `home-hero-en` (~line 2786)
- `home-hero-hu` (~line 2858)
- `home-hero-de` (~line 2930)

- [ ] **Step 2: Update `generate-bol-seed.ts`**

At top of file, `media()` helper already exists (~line 844):

```typescript
function media(file: string, alt: string) {
  return {
    $media: { file, alt },
  };
}
```

Change `homePageContent` hero block from:

```typescript
{
  _type: "bol.hero",
  _key: `home-hero-${locale}`,
  ...copy.hero,
},
```

To:

```typescript
{
  _type: "bol.hero",
  _key: `home-hero-${locale}`,
  ...copy.hero,
  backgroundImageUrl: media("hero.webp", "Bar of Legends interior"),
},
```

- [ ] **Step 3: Regenerate seed (optional sanity check)**

If you use the generator as source of truth:

```bash
bun scripts/generate-bol-seed.ts > /dev/null 2>&1 || true
```

Only needed if your workflow re-runs the generator; otherwise editing `seed.json` directly is sufficient.

- [ ] **Step 4: Upload hero media to local D1/R2**

Requires dev server has run at least once (local D1 exists):

```bash
bun run seed:media-upload:local
```

Expected: script reports `hero.webp` uploaded; no errors. If DB is empty, run `bun dev` once, let EmDash seed, then re-run upload.

---

### Task 3: Types — `backgroundImageUrl` as image object

**Files:**
- Modify: `src/plugins/bol-theme/types/pt-blocks.ts`

**Interfaces:**
- Produces: `BolHeroBackgroundImage` type used by `Hero.astro`

- [ ] **Step 1: Add image type and update `BolHeroNode`**

Replace `backgroundImageUrl?: string;` with:

```typescript
/** EmDash media_picker / image field value */
export type BolHeroBackgroundImage = {
  id?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  meta?: { storageKey?: string };
};

export type BolHeroNode = {
  _type?: "bol.hero";
  _key?: string;
  kicker?: string;
  titleTop?: string;
  titleAccent?: string;
  subtitle?: string;
  ctaMenu?: string;
  ctaBook?: string;
  scrollHint?: string;
  backgroundImageUrl?: BolHeroBackgroundImage;
};
```

---

### Task 4: Hero block — EmDash `Image` with LCP priority

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Hero.astro`

**Interfaces:**
- Consumes: `BolHeroNode.backgroundImageUrl` (image object from Task 2–3)
- Produces: Hero renders CMS image with `loading="eager"` + `fetchpriority="high"` via `priority` prop

- [ ] **Step 1: Replace imports and background markup**

Full frontmatter + background section replacement:

```astro
---
import { Image } from "emdash/ui";
import Icon from "../icons/Icon.astro";
import { fetchPublicVenue } from "../../utils/fetch-venue.ts";
import { getPtNode } from "../../utils/pt-node.ts";
import type { BolHeroNode } from "../../types/pt-blocks.ts";

const node = getPtNode<BolHeroNode>(Astro.props);
const {
  kicker,
  titleTop,
  titleAccent,
  subtitle,
  ctaMenu,
  ctaBook,
  scrollHint,
  backgroundImageUrl,
} = node;

const venue = await fetchPublicVenue(Astro.url.origin);
const heroImage =
  backgroundImageUrl?.src || backgroundImageUrl?.id
    ? backgroundImageUrl
    : null;
---

<section class="relative flex min-h-svh flex-col justify-end overflow-hidden bg-bg">
  <div class="absolute inset-0" aria-hidden="true">
    {
      heroImage ? (
        <Image
          image={heroImage}
          alt=""
          priority
          sizes="100vw"
          placeholder={false}
          class="size-full object-cover motion-safe:animate-kenburns [&_.emdash-image-media]:size-full [&_.emdash-image-media]:object-cover"
        />
      ) : null
    }
    <div class="absolute inset-0 bg-linear-to-b from-bg/70 via-bg/30 to-bg"></div>
    <div class="absolute inset-0 bg-linear-to-r from-bg/60 via-transparent to-bg/20"></div>
  </div>
  <!-- rest of section unchanged -->
```

Keep all content below the overlay divs unchanged (kicker, h1, CTAs, scroll hint).

- [ ] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors in `Hero.astro` or `pt-blocks.ts`.

- [ ] **Step 3: Manual smoke — hero visible**

```bash
bun dev
```

Open `http://localhost:4321/` — hero background must render (not empty gradient-only). If blank, re-run Task 2 Step 4 (`seed:media-upload:local`).

- [ ] **Step 4: Inspect LCP img attributes (DevTools)**

On `/`, inspect hero `<img>`:
- `loading="eager"` (not `lazy`)
- `fetchpriority="high"` present
- Hero request size ideally <150 KB (if Astro `_image` still bloats >300 KB, apply Task 4 fallback below)

**Task 4 fallback (only if hero transfer still >300 KB on mobile):**

Replace `Image` with direct media URL — no Astro re-encode:

```astro
---
function heroSrc(img: NonNullable<typeof heroImage>): string {
  if (img.src) return img.src;
  const key = img.meta?.storageKey ?? img.id;
  return `/_emdash/api/media/file/${key}`;
}
---
<img
  src={heroSrc(heroImage)}
  alt=""
  width={heroImage.width}
  height={heroImage.height}
  loading="eager"
  fetchpriority="high"
  decoding="async"
  sizes="100vw"
  class="size-full object-cover motion-safe:animate-kenburns"
/>
```

---

### Task 5: Contact block — lazy Leaflet

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Contact.astro`

**Interfaces:**
- Consumes: existing `[data-venue-map]` markup (unchanged)
- Produces: `initVenueMaps()` runs only when map roots intersect viewport

- [ ] **Step 1: Remove render-blocking CSS import**

Delete line 12 from frontmatter:

```typescript
import "../../styles/leaflet.css";
```

- [ ] **Step 2: Replace map `<script>` block**

Replace the second `<script>` block (lines 257–311) with:

```javascript
<script>
  async function loadLeafletStyles() {
    await import("leaflet/dist/leaflet.css");
    await import("../../styles/leaflet.css");
  }

  async function initVenueMap(root: HTMLElement) {
    const canvas = root.querySelector<HTMLElement>(".venue-map-canvas");
    const loading = root.querySelector<HTMLElement>(".venue-map-loading");
    if (!canvas || canvas.dataset.initialized === "true") return;

    await loadLeafletStyles();
    const L = (await import("leaflet")).default;

    const lat = Number(root.dataset.lat);
    const lng = Number(root.dataset.lng);
    const title = root.dataset.title ?? "";
    const address = root.dataset.address ?? "";

    const map = L.map(canvas, { scrollWheelZoom: false }).setView([lat, lng], 16);
    const tileOptions = { maxNativeZoom: 16, maxZoom: 19 } as const;

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        ...tileOptions,
        attribution:
          'Tiles &copy; Esri — Source: Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      },
    ).addTo(map);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      tileOptions,
    ).addTo(map);

    const pin = L.divIcon({
      className: "venue-pin-anchor",
      html: '<span class="venue-pin" aria-hidden="true"></span>',
      iconSize: [30, 30],
      iconAnchor: [15, 34],
      popupAnchor: [0, -30],
    });

    L.marker([lat, lng], { icon: pin, title })
      .addTo(map)
      .bindPopup(`<strong>${title}</strong><br/><span>${address}</span>`);

    canvas.dataset.initialized = "true";
    loading?.remove();
  }

  function observeVenueMaps() {
    const roots = document.querySelectorAll<HTMLElement>("[data-venue-map]");
    if (roots.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      for (const root of roots) void initVenueMap(root);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const root = entry.target as HTMLElement;
          obs.unobserve(root);
          void initVenueMap(root);
        }
      },
      { rootMargin: "200px" },
    );

    for (const root of roots) observer.observe(root);
  }

  observeVenueMaps();
</script>
```

- [ ] **Step 3: Manual verify — Leaflet deferred**

1. Open `/` with Network tab filtered to `leaflet` or `arcgisonline`
2. On initial load: **no** `leaflet-src` JS, **no** `_astro/leaflet*.css`, **no** ArcGIS tiles
3. Scroll to `#contact`: requests appear, map renders, pin visible

---

### Task 6: Menu tabs — WAI-ARIA tablist

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Menu.astro`

**Interfaces:**
- Produces: tab buttons with `role="tab"`, panels with `role="tabpanel"`; keyboard Arrow/Home/End support

- [ ] **Step 1: Replace tablist markup**

Replace the `menu-tabs` inner tab row (lines 75–101) with:

```astro
<div class="menu-tabs mt-10">
  <div
    role="tablist"
    aria-label={menuTitle}
    class="scrollbar-slim -mx-1 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 sm:mx-0 sm:inline-flex sm:w-auto sm:overflow-visible"
  >
    {
      categoryTerms.map((term, index) => (
        <button
          type="button"
          role="tab"
          id={`menu-tab-${term.slug}`}
          aria-selected={index === 0 ? "true" : "false"}
          aria-controls={`menu-panel-${term.slug}`}
          tabindex={index === 0 ? 0 : -1}
          class="menu-tab-btn inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors sm:px-6"
          data-tab={term.slug}
        >
          {tabLabels[term.slug] ?? term.slug}
        </button>
      ))
    }
  </div>
```

- [ ] **Step 2: Update panels**

Change each panel div (lines 105–110) to:

```astro
<div
  id={`menu-panel-${term.slug}`}
  role="tabpanel"
  aria-labelledby={`menu-tab-${term.slug}`}
  tabindex={index === 0 ? 0 : undefined}
  class="menu-tab-panel mt-8"
  hidden={index !== 0}
>
```

- [ ] **Step 3: Update CSS selectors**

In `<style is:global>`, replace `.menu-tab-label` with `.menu-tab-btn`:

```css
.menu-tab-btn[aria-selected="true"] {
  background-color: var(--color-brand);
  color: #1c1305;
}

.menu-tab-btn {
  color: var(--color-muted-foreground);
}

.menu-tab-btn:hover {
  color: var(--color-foreground);
}
```

Remove `.menu-tab-input` rules if any remain.

- [ ] **Step 4: Replace client script**

Replace `<script>` block (lines 177–194) with:

```javascript
<script>
  function initMenuTabs(root: HTMLElement) {
    const tabs = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    if (tabs.length === 0) return;

    const panels = new Map<string, HTMLElement>();
    for (const tab of tabs) {
      const slug = tab.dataset.tab;
      if (!slug) continue;
      const panel = root.querySelector<HTMLElement>(`#menu-panel-${slug}`);
      if (panel) panels.set(slug, panel);
    }

    const selectTab = (next: HTMLButtonElement) => {
      for (const tab of tabs) {
        const slug = tab.dataset.tab!;
        const panel = panels.get(slug);
        const selected = tab === next;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (panel) panel.hidden = !selected;
      }
      next.focus();
    };

    for (const tab of tabs) {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        const idx = tabs.indexOf(tab);
        let target: HTMLButtonElement | undefined;
        switch (event.key) {
          case "ArrowRight":
          case "ArrowDown":
            target = tabs[(idx + 1) % tabs.length];
            break;
          case "ArrowLeft":
          case "ArrowUp":
            target = tabs[(idx - 1 + tabs.length) % tabs.length];
            break;
          case "Home":
            target = tabs[0];
            break;
          case "End":
            target = tabs[tabs.length - 1];
            break;
          default:
            return;
        }
        event.preventDefault();
        if (target) selectTab(target);
      });
    }
  }

  document.querySelectorAll<HTMLElement>(".menu-tabs").forEach(initMenuTabs);
</script>
```

- [ ] **Step 5: Manual verify — menu tabs**

1. `/` → Menu section: three tabs switch content on click
2. Tab focus + Arrow keys move selection
3. Lighthouse a11y: no `aria-allowed-attr` on menu labels

---

### Task 7: Site header — logo accessible name

**Files:**
- Modify: `src/plugins/bol-theme/astro/theme/SiteHeader.astro`

- [ ] **Step 1: Fix home link**

Change:

```astro
<a
  href={homeHref}
  class="flex min-h-12 items-center gap-2 rounded-md"
  aria-label={`Bar of Legends — ${ui.nav.home}`}
>
  <span
    class="grid size-9 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand"
  >
    <Icon name="gamepad2" />
  </span>
```

To:

```astro
<a
  href={homeHref}
  class="flex min-h-12 items-center gap-2 rounded-md"
>
  <span
    class="grid size-9 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand"
    aria-hidden="true"
  >
    <Icon name="gamepad2" />
  </span>
```

Visible text `"BAR OF LEGENDS"` remains the accessible name.

- [ ] **Step 2: Manual verify**

Lighthouse a11y on `/`: `label-content-name-mismatch` on header link should pass.

---

### Task 8: Final verification

- [ ] **Step 1: Typecheck**

```bash
bun run typecheck
```

Expected: PASS

- [ ] **Step 2: Lighthouse mobile — home**

Run Lighthouse mobile on `https://bar-of-legends.gornostay25.dev/` (or localhost with throttling):

| Metric | Target |
|--------|--------|
| Performance | ≥90 |
| Accessibility | ≥98 |
| LCP | <3.5s |
| Hero img | eager + fetchpriority=high |

- [ ] **Step 3: Lighthouse mobile — experiences**

Confirm no regressions (perf ~95, a11y improved via header fix).

- [ ] **Step 4: Admin**

`/_emdash/admin` → edit home page → Hero block → background image shows `hero.webp` in media picker.

---

## Spec coverage checklist

| Spec section | Task |
|--------------|------|
| Hero → seed/media + ffmpeg | Task 1 |
| Seed `$media` on 3 locales | Task 2 |
| `generate-bol-seed.ts` mirror | Task 2 |
| `pt-blocks.ts` image type | Task 3 |
| Hero EmDash `Image` + priority | Task 4 |
| Lazy Leaflet | Task 5 |
| Menu tab a11y | Task 6 |
| Header logo a11y | Task 7 |
| Manual verification | Task 8 |
| Out of scope (CF scripts) | — |

## Self-review

- No TBD/TODO placeholders.
- All file paths explicit.
- Code blocks complete for each change.
- No test files (project rule).
- Commit steps omitted (user commits only on request).
