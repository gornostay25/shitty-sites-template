# BOL Migration — Part 4: Portable Text Blocks

> **Part 4 of 5** · Index: [2026-09-05-bol-theme-migration.md](./2026-09-05-bol-theme-migration.md) · Spec: [design doc](../specs/2026-09-05-bol-theme-migration-design.md)

**Prerequisites:** Part 3 complete (seed collections exist, theme chrome wired).

**Delivers:** Five PT block types registered in admin and rendered on home page — hero, benefits, menu, gallery, contact (with map + open-now badge).

**Next:** [Part 5 — Pages + ship](./2026-09-05-bol-theme-migration-05-pages-ship.md)

---

## Official documentation

Verify against live docs ([Docs MCP](https://docs.emdashcms.com/docs-mcp/) · [llms.txt](https://docs.emdashcms.com/llms.txt)) before implementing.

| Task | Read first |
|------|------------|
| 13 — block types | [Block Kit](https://docs.emdashcms.com/plugins/creating-plugins/block-kit/) · [Your first native plugin — PT blocks](https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/) |
| 14–17 — renderers | [Portable Text components](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/) · [Querying content](https://docs.emdashcms.com/guides/querying-content/) · [Media library / Image](https://docs.emdashcms.com/guides/media-library/) |
| 15 — menu block | [Taxonomies](https://docs.emdashcms.com/guides/taxonomies/) (category terms on `menu_items`) |

**Reference in repo:** `src/plugins/demo-blocks/` (Block Kit + `blockComponents` pattern — rewrite, do not copy).

**Project skills:** `.agents/skills/creating-plugins/references/portable-text-blocks.md` · `.agents/skills/building-emdash-site/references/querying-and-rendering.md`

---

## Files touched in this part

| Path | Responsibility |
|------|----------------|
| `src/plugins/bol-theme/index.ts` | `admin.portableTextBlocks` |
| `src/plugins/bol-theme/astro/index.ts` | `blockComponents` map |
| `src/plugins/bol-theme/astro/blocks/*.astro` | PT block renderers |
| `src/plugins/bol-theme/astro/islands/*.tsx` | MenuTabs, OpenNowBadge, VenueMap |
| `src/plugins/bol-theme/utils/format.ts` | `formatHUF(price, locale)` |
| `src/plugins/bol-theme/styles/leaflet.css` | Scoped Leaflet + z-index caps |
| `package.json` | Add `leaflet`, `@types/leaflet` |

---

## Task 13: Register block types in plugin admin

**Files:**
- Modify: `src/plugins/bol-theme/index.ts`

- [ ] **Step 1: Define Block Kit fields** — `bol.hero`, `bol.benefits`, `bol.menu`, `bol.gallery`, `bol.contact`

- [ ] **Step 2: Flatten nested shapes** — follow demo-blocks constraints (no object groups in block modal)

- [ ] **Step 3: Manual check** — blocks in admin PT inserter under category "Bar of Legends"

---

## Task 14: Block renderers — hero + benefits

**Files:**
- Create: `src/plugins/bol-theme/astro/blocks/Hero.astro`
- Create: `src/plugins/bol-theme/astro/blocks/Benefits.astro`
- Modify: `src/plugins/bol-theme/astro/index.ts`

- [ ] **Step 1: Hero** — full-viewport, EmDash Image background, CTAs `#menu` + `tel:`

- [ ] **Step 2: Benefits** — 3-col → 1-col grid, icon keys → inline SVG

- [ ] **Step 3: Register in blockComponents**

- [ ] **Step 4: Manual check** — insert on home page, preview renders

---

## Task 15: Block renderer — menu + MenuTabs island

**Files:**
- Create: `src/plugins/bol-theme/astro/blocks/Menu.astro`
- Create: `src/plugins/bol-theme/astro/islands/MenuTabs.tsx`
- Create: `src/plugins/bol-theme/utils/format.ts`

- [ ] **Step 1: Query menu items** grouped by category (`getEmDashCollection`, taxonomy filter)

- [ ] **Step 2: Rewrite MenuTabs** — tablist a11y, horizontal scroll for long DE/HU labels

- [ ] **Step 3: Section wrapper** `id="menu"` + `scroll-mt-20`

- [ ] **Step 4: Manual check** — three tabs, HUF prices, images load

---

## Task 16: Block renderer — gallery bento

**Files:**
- Create: `src/plugins/bol-theme/astro/blocks/Gallery.astro`

- [ ] **Step 1: Define span map**

```typescript
const SPAN_CLASSES: Record<string, string> = {
  default: "",
  "col-2": "col-span-2 md:col-span-2",
  "row-2": "row-span-2 md:row-span-2",
  "col-2-row-2": "col-span-2 row-span-2 md:col-span-2 md:row-span-2",
};
```

Adjust after 375px pass — do not copy prototype classes blindly.

- [ ] **Step 2: Grid** — `auto-rows`, `md:grid-flow-dense`, 2 col mobile / 4 col desktop

- [ ] **Step 3: Manual check** — no broken layout at 375px

---

## Task 17: Block renderer — contact + map island

**Files:**
- Create: `src/plugins/bol-theme/astro/blocks/Contact.astro`
- Create: `src/plugins/bol-theme/astro/islands/OpenNowBadge.tsx`
- Create: `src/plugins/bol-theme/astro/islands/VenueMap.tsx`
- Create: `src/plugins/bol-theme/styles/leaflet.css`

- [ ] **Step 1: Contact.astro** — hours table (skip closed days), `venue.address`, phone, email, socials; map link from `mapsUrl` on public venue payload; respect block toggles; section labels from `getUiStrings(locale)`

- [ ] **Step 2: OpenNowBadge** — client island, local time via `computeStatus()`

- [ ] **Step 3: Rewrite VenueMap** — dynamic `import("leaflet")`, Esri dark tiles, amber pin

- [ ] **Step 4: Fix z-index** — wrapper `.venue-map { position: relative; z-index: 0; isolation: isolate; overflow: hidden; }`

```css
.venue-map .leaflet-pane,
.venue-map .leaflet-top,
.venue-map .leaflet-bottom { z-index: 1 !important; }
.venue-map .leaflet-popup { z-index: 2 !important; }
```

Header stays `z-50`. Scroll: map never covers header.

- [ ] **Step 5: Import leaflet.css + overrides** in island or layout

- [ ] **Step 6: Add `leaflet` + `@types/leaflet` to package.json**

- [ ] **Step 7: Manual check** — map renders, popup works, header on top when scrolling

---

## Part 4 completion gate

- [ ] All five blocks in admin inserter + `blockComponents`
- [ ] Home page PT stack renders end-to-end (hero → contact)
- [ ] Menu tabs, gallery bento, contact/map work at 375px
- [ ] Map z-index bug fixed
- [ ] Ready for Part 5 routes + cleanup
