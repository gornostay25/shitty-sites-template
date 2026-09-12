# Gallery Grid + Lightbox — Implementation Plan

**Status:** Implemented (archived 2026-09-12) — spec at [`../specs/2026-09-12-gallery-grid-lightbox-design.md`](../specs/2026-09-12-gallery-grid-lightbox-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix gallery bento grid image fill on all breakpoints, restrict bento spans to `md+`, and add a native `<dialog>` lightbox on tile click.

**Architecture:** Extend `Gallery.astro` only — responsive `SPAN_CLASSES`, scoped CSS override for EmDash `.emdash-image-media`, tile `<button>` wrappers with `data-*` attrs, one shared popover dialog + inline script (same pattern as `MobileNav.astro`). i18n strings in bol-theme locale files.

**Tech Stack:** Astro 7, EmDash 0.37 `<Image>`, Tailwind CSS 4, native Popover API / `<dialog popover="auto">`.

**Spec:** [2026-09-12-gallery-grid-lightbox-design.md](../specs/2026-09-12-gallery-grid-lightbox-design.md)

## Global Constraints

- **Scope:** `src/plugins/bol-theme/` only — no seed/CMS/schema changes.
- **No automated tests** — manual browser verification + `bun run typecheck` only.
- **No git commits** unless user explicitly asks.
- **No React islands** — Astro + inline script only.
- **Mobile grid:** uniform 1×1 tiles; bento spans from `md:` only.
- **Lightbox:** single image + alt caption; close via X, backdrop click, Esc; no prev/next.
- **i18n:** en / hu / de UI strings; CMS alt text stays per-locale content.

---

## File map

| Path | Action |
|------|--------|
| `src/plugins/bol-theme/utils/i18n/en.ts` | **Modify** — add `gallery` block + extend `UiStrings` type |
| `src/plugins/bol-theme/utils/i18n/hu.ts` | **Modify** — add `gallery` block |
| `src/plugins/bol-theme/utils/i18n/de.ts` | **Modify** — add `gallery` block |
| `src/plugins/bol-theme/astro/blocks/Gallery.astro` | **Modify** — spans, tiles, CSS, dialog, script |
| `docs/superpowers/plans/README.md` | **Modify** — link active plan |

---

### Task 1: Gallery i18n strings

**Files:**
- Modify: `src/plugins/bol-theme/utils/i18n/en.ts`
- Modify: `src/plugins/bol-theme/utils/i18n/hu.ts`
- Modify: `src/plugins/bol-theme/utils/i18n/de.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `UiStrings.gallery.lightboxLabel: string`
  - `UiStrings.gallery.close: string`
  - `UiStrings.gallery.openImageTpl: string` — `{alt}` placeholder for tile `aria-label`

- [ ] **Step 1: Add `gallery` to `en.ts`**

In the `const en = { … }` object (before `footer`), add:

```ts
gallery: {
  lightboxLabel: "Gallery image preview",
  close: "Close image",
  openImageTpl: "View larger: {alt}",
},
```

Extend the exported `UiStrings` type with the same `gallery` block (three `string` fields).

- [ ] **Step 2: Add `gallery` to `hu.ts`**

```ts
gallery: {
  lightboxLabel: "Galéria kép nagyítása",
  close: "Kép bezárása",
  openImageTpl: "Nagyítás: {alt}",
},
```

- [ ] **Step 3: Add `gallery` to `de.ts`**

```ts
gallery: {
  lightboxLabel: "Galeriebild-Vorschau",
  close: "Bild schließen",
  openImageTpl: "Vergrößern: {alt}",
},
```

- [ ] **Step 4: Typecheck**

Run: `bun run typecheck`
Expected: PASS (hu/de satisfy `UiStrings` via structural typing through `getUiStrings`).

---

### Task 2: Gallery grid fix + lightbox

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Gallery.astro`

**Interfaces:**
- Consumes: `getUiStrings(locale)` → `ui.gallery.*` from Task 1
- Produces: updated gallery block render + lightbox behavior

- [ ] **Step 1: Update frontmatter imports and helpers**

Add imports:

```astro
import Icon from "../icons/Icon.astro";
import { getUiStrings } from "../../utils/i18n/index.ts";
```

After `const locale = …`:

```ts
const ui = getUiStrings(locale);
```

Replace `SPAN_CLASSES`:

```ts
const SPAN_CLASSES: Record<string, string> = {
  default: "",
  "col-2": "md:col-span-2",
  "row-2": "md:row-span-2",
  "col-2-row-2": "md:col-span-2 md:row-span-2",
};
```

Add helper for tile aria-label:

```ts
function galleryOpenLabel(tpl: string, alt: string): string {
  return tpl.replace("{alt}", alt);
}
```

Add helper for lightbox src (grid + modal share same URL):

```ts
function galleryImageSrc(image: GalleryItem["image"]): string {
  return image.src ?? `/_emdash/api/media/file/${image.meta?.storageKey ?? image.id}`;
}
```

Import `GalleryItem` type from `emdash-env` or infer from collection entry — use inline `typeof items[number]["data"]["image"]` if import is awkward.

- [ ] **Step 2: Replace tile markup**

Replace the `items.map` body with:

```astro
{
  items.map((item) => {
    const span = item.data.grid_span ?? "default";
    const spanClass = SPAN_CLASSES[span] ?? "";
    const alt = item.data.alt;
    const src = galleryImageSrc(item.data.image);
    return (
      <button
        type="button"
        class:list={[
          "bol-gallery__trigger group cursor-pointer rounded-card border border-border p-0 text-left",
          spanClass,
        ]}
        data-src={src}
        data-alt={alt}
        aria-label={galleryOpenLabel(ui.gallery.openImageTpl, alt)}
      >
        <figure class="bol-gallery__tile relative min-h-0 overflow-hidden rounded-[inherit]">
          <Image
            image={item.data.image}
            alt={alt}
            class="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
          />
        </figure>
      </button>
    );
  })
}
```

Notes:
- Button carries grid span classes (not figure) so grid placement works on the interactive cell.
- `rounded-[inherit]` keeps figure corners aligned with button border.

- [ ] **Step 3: Add lightbox dialog after grid `</div>`**

Inside the section container, after the grid:

```astro
<dialog
  id="bol-gallery-lightbox"
  popover="auto"
  class="bol-gallery-lightbox"
  aria-label={ui.gallery.lightboxLabel}
>
  <div class="bol-gallery-lightbox__inner">
    <button
      type="button"
      class="bol-gallery-lightbox__close grid size-10 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-brand/40"
      aria-label={ui.gallery.close}
      data-gallery-close
    >
      <Icon name="x" class="size-5" />
    </button>
    <img
      id="bol-gallery-lightbox-img"
      class="bol-gallery-lightbox__img max-h-[85vh] max-w-[min(90vw,72rem)] object-contain"
      alt=""
      aria-describedby="bol-gallery-lightbox-caption"
    />
    <p
      id="bol-gallery-lightbox-caption"
      class="bol-gallery-lightbox__caption mt-4 max-w-[min(90vw,42rem)] text-center text-sm text-muted-foreground"
    />
  </div>
</dialog>
```

- [ ] **Step 4: Add scoped + global styles**

Before closing `</section>`, add:

```astro
<style>
  .bol-gallery__trigger {
    display: block;
    width: 100%;
    min-height: 0;
  }

  .bol-gallery__tile {
    aspect-ratio: auto;
    height: 100%;
    width: 100%;
  }

  .bol-gallery__tile :global(.emdash-image-media) {
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: cover;
  }
</style>

<style is:global>
  .bol-gallery-lightbox {
    position: fixed;
    inset: 0;
    margin: 0;
    padding: 0;
    border: none;
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    overflow: hidden;
    background: transparent;
  }

  .bol-gallery-lightbox::backdrop {
    background: rgb(0 0 0 / 0.85);
  }

  .bol-gallery-lightbox__inner {
    display: flex;
    min-height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  .bol-gallery-lightbox__close {
    position: fixed;
    top: max(1rem, env(safe-area-inset-top));
    right: max(1rem, env(safe-area-inset-right));
    z-index: 1;
  }

  html:has(.bol-gallery-lightbox:popover-open) {
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .bol-gallery__tile :global(.emdash-image-media) {
      transition: none !important;
    }
  }
</style>
```

- [ ] **Step 5: Add inline script**

After styles:

```astro
<script is:inline>
  const dialog = document.getElementById("bol-gallery-lightbox");
  const img = document.getElementById("bol-gallery-lightbox-img");
  const caption = document.getElementById("bol-gallery-lightbox-caption");
  const grid = document.querySelector(".bol-gallery__trigger")?.closest(".mt-10.grid");

  grid?.addEventListener("click", (event) => {
    const trigger =
      event.target instanceof Element ? event.target.closest(".bol-gallery__trigger") : null;
    if (!trigger || !dialog || !img || !caption) return;

    const src = trigger.dataset.src;
    const alt = trigger.dataset.alt ?? "";
    if (!src) return;

    img.src = src;
    img.alt = alt;
    caption.textContent = alt;
    dialog.showPopover();
  });

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.hidePopover();
    }
  });

  document.querySelector("[data-gallery-close]")?.addEventListener("click", () => {
    dialog?.hidePopover();
  });
</script>
```

Optional hardening (include if trivial): guard `showPopover` with `typeof dialog.showPopover === "function"`.

- [ ] **Step 6: Manual verification**

Run: `bun dev` (if not already running)

| Check | Expected |
|-------|----------|
| Mobile (<768px) | 2-col uniform tiles; images fill cells edge-to-edge |
| Desktop (≥768px) | Bento layout: 2×2 hero, tall 1×2, wide 2×1 per CMS spans |
| Click tile | Dialog opens; image + alt caption visible |
| Close X | Dialog closes |
| Esc | Dialog closes |
| Backdrop click | Dialog closes |
| `/hu/`, `/de/` | Close button aria-label localized |
| Keyboard | Tab to tile → Enter opens; focus trapped in dialog |

- [ ] **Step 7: Typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| EmDash image CSS override | Task 2 Step 4 |
| Mobile uniform 1×1 / md bento spans | Task 2 Step 1–2 |
| Tile buttons + data-src/alt | Task 2 Step 2 |
| Native dialog lightbox | Task 2 Step 3–5 |
| i18n en/hu/de | Task 1 |
| a11y aria labels | Task 1–2 |
| No seed/schema/React/tests | Global constraints |
| Manual verification list | Task 2 Step 6 |

---

## Execution handoff

Plan saved. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — implement all tasks in this session with checkpoints

Which approach?
