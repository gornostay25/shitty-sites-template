# Gallery grid fix + native lightbox

**Status:** Implemented (archived 2026-09-12) — plan at [`../plans/2026-09-12-gallery-grid-lightbox.md`](../plans/2026-09-12-gallery-grid-lightbox.md)  
**Supersedes (partially):** [`../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md`](../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md) — gallery bento mobile spans, image fill, lightbox  
**Scope:** `src/plugins/bol-theme/astro/blocks/Gallery.astro` + i18n strings  
**Related:** Prototype `docs/design/v1/src/components/GalleryBento.tsx`, `MobileNav.astro` dialog pattern

---

## Problem

1. **Grid tiles show empty figure boxes** — images render smaller than their grid cells. Root cause: EmDash `<Image>` applies `.emdash-image-media { max-width: 100%; height: auto; }`, which overrides the gallery’s `absolute inset-0 size-full object-cover` intent.
2. **Mobile bento spans break the 2-column grid** — CMS `grid_span` values (`col-span-2`, `row-span-2`) apply at all breakpoints. On mobile this produces awkward tall/wide cells (flagged in migration design spec).
3. **No lightbox** — clicking a gallery image should open a full-size view in a native `<dialog>`.

---

## Decisions (brainstorming)

| Topic | Choice |
|-------|--------|
| Mobile grid | Uniform 1×1 tiles; bento spans from `md:` only |
| Lightbox content | Single image + alt as caption; close via X, backdrop, Esc |
| Lightbox navigation | None (no prev/next carousel) |
| Implementation style | Astro-only; native `popover="auto"` dialog like `MobileNav` |

---

## Approach (recommended)

### Grid fill — scoped CSS override

Keep EmDash `<Image>` for responsive srcset. Add gallery-scoped CSS:

```css
.bol-gallery__tile .emdash-image-media {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
}
```

Tile structure:

- Outer `<button type="button">` — keyboard accessible, carries `data-src` / `data-alt`
- Inner `<figure class="bol-gallery__tile relative min-h-0 overflow-hidden …">`
- `<Image>` with `class="absolute inset-0 size-full object-cover …"` (hover scale unchanged)

Grid row height continues to come from `auto-rows-37.5` / `sm:auto-rows-42.5`.

### Mobile spans — responsive `SPAN_CLASSES`

Remap CMS keys to `md:`-prefixed Tailwind only:

| CMS `grid_span` | Classes |
|-----------------|---------|
| `default` | *(empty)* |
| `col-2` | `md:col-span-2` |
| `row-2` | `md:row-span-2` |
| `col-2-row-2` | `md:col-span-2 md:row-span-2` |

No seed or schema changes.

### Lightbox — single shared dialog

One `<dialog id="bol-gallery-lightbox" popover="auto">` per gallery section (bottom of `Gallery.astro`).

**Layout:**

- Full-viewport overlay; dark `::backdrop`
- Centered image: `max-h-[85vh] max-w-[min(90vw,72rem)] object-contain`
- Caption below image (alt text from CMS)
- Close button top-right (Lucide `x` via existing `Icon.astro`)

**Script (~30 lines, inline `<script>`):**

1. Tile button click → read `dataset.src` / `dataset.alt` → set modal `<img>` + caption text → `dialog.showPopover()`
2. Close button → `dialog.hidePopover()`
3. Optional: backdrop click on dialog (not on image) closes
4. Esc handled natively by `<dialog>`

**Image URL:** use `item.data.image.src` (EmDash media proxy path). Same URL as grid tile — sufficient for lightbox; no separate “full res” field needed.

---

## Accessibility

| Element | Attribute |
|---------|-----------|
| Tile button | `aria-label={item.data.alt}` |
| Dialog | `aria-label={ui.gallery.lightboxLabel}` |
| Caption | `id="bol-gallery-lightbox-caption"` + img `aria-describedby` |
| Close button | `aria-label={ui.gallery.close}` |

Focus trap and Esc dismissal are built into `<dialog popover="auto">`.

---

## i18n

Add `gallery` block to `utils/i18n/en.ts`, `hu.ts`, `de.ts` and extend `UiStrings` type:

```ts
gallery: {
  lightboxLabel: string;  // e.g. "Gallery image preview"
  close: string;          // e.g. "Close image"
  openImageTpl: string;   // e.g. "View larger: {alt}" — optional for aria-label
}
```

`Gallery.astro` imports `getUiStrings(locale)` (same pattern as `Contact.astro`).

Eyebrow / title / subtitle remain CMS-driven via PT block props — not i18n.

---

## Files changed

| File | Change |
|------|--------|
| `src/plugins/bol-theme/astro/blocks/Gallery.astro` | Responsive spans, tile buttons, scoped CSS, dialog, script |
| `src/plugins/bol-theme/utils/i18n/en.ts` | `gallery.*` strings + type |
| `src/plugins/bol-theme/utils/i18n/hu.ts` | `gallery.*` strings |
| `src/plugins/bol-theme/utils/i18n/de.ts` | `gallery.*` strings |

**Out of scope:** seed/CMS schema, React islands, prev/next carousel, automated tests.

---

## Manual verification

1. `bun dev` → home page gallery section
2. **Mobile (<768px):** all tiles uniform 1×1; images fill cells edge-to-edge
3. **Desktop (≥768px):** bento layout matches CMS spans (hero 2×2, tall 1×2, wide 2×1)
4. Click any tile → dialog opens with image + caption
5. Close via X, Esc, and (if implemented) backdrop click
6. Repeat on `/hu/` and `/de/` — UI strings localized; CMS alt text per locale
7. Keyboard: Tab to tile, Enter opens; Tab to close button works inside dialog

---

## Risks / notes

- **EmDash Image CSS changes upstream** — scoped override in gallery only; monitor on EmDash upgrades.
- **Object cache / media** — unrelated; gallery reads already-resolved image objects from content query.
- **Multiple gallery blocks on one page** — use unique dialog id per section instance (`bol-gallery-lightbox-{blockKey}` from PT node key if needed). Current home has one gallery block; id `bol-gallery-lightbox` is fine for now.
