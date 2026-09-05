# Bar of Legends — Theme Migration Design Spec

**Status:** Approved (2026-09-05)  
**Date:** 2026-09-05  
**EmDash version:** 0.36.0 (+ bun patch for `byline`)  
**Reference:** `docs/design/v1/` (Next.js visual prototype — **reference only, do not copy code**)  
**Scope:** Migrate Bar of Legends from the design prototype to a production EmDash + Astro site with a native theme plugin, CMS collections, block-builder landing, and JSON-LD SEO

---

## Summary

Bar of Legends is an esports bar in Győr (Hungary). The client needs a multilingual (en / hu / de) marketing site with a block-composed home page, a separate Experiences catalog, editable menu and gallery content, venue contact data, and structured SEO (JSON-LD).

The Next.js prototype in `docs/design/v1/` establishes visual direction and information architecture. Production implementation **rewrites** all UI and logic in Astro + a native `bol-theme` plugin. The prototype must not be copied file-for-file — it was AI-generated and may contain style bugs, unnecessary dependencies, and incorrect patterns.

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Landing page control | **Block builder** — editors add/reorder/remove PT blocks on the home page |
| Plugin shape | **Monolith native plugin** `bol-theme` (theme + blocks + venue + JSON-LD) |
| Venue facts (hours, phone, map, socials) | **Plugin settings** (KV), not a CMS collection |
| Opening hours in footer | **Removed** — hours appear only in the contact block |
| Menu / experiences / gallery | **CMS collections** with taxonomies; blocks query them |
| Hero / benefits copy | **PT block fields** |
| Field Kit | **Remove** — unused; drop `@emdash-cms/plugin-field-kit` from deps and `astro.config.mjs` |
| JSON-LD | `page:metadata` hook with `kind: "jsonld"` ([docs](https://docs.emdashcms.com/plugins/creating-native-plugins/page-fragments/#when-to-use-pagemetadata-instead)) |
| i18n | Astro + EmDash row-per-locale; `en` default, `hu` / `de` with fallback to `en` |
| shadcn/ui | **No** — public site uses Astro + Tailwind only |
| Code from prototype | **Rewrite only** — preserve look, not source |

---

## Implementation principle: reference, don’t copy

The prototype is a **visual and IA reference**:

- Design tokens (colors, fonts, radii, glow)
- Section order and content hierarchy
- Component boundaries (hero, benefits, menu tabs, bento gallery, contact)
- Mobile patterns (sticky action bar, full-screen nav)

Production code must:

1. Rebuild components in Astro (and minimal React islands where interactivity requires it)
2. Re-derive Tailwind classes and CSS tokens; do not paste prototype component files
3. Manually verify responsive layout at 375px before treating a section as done
4. Drop prototype-only deps (Next.js, shadcn tree, unused Radix packages, Prisma stubs)
5. Use EmDash patterns (`<Image>`, `getEmDashCollection`, `Astro.cache.set`, portable text blocks)

---

## Architecture

```
astro.config.mjs
  integrations: [emdash({ plugins: [bolThemePlugin(), hubFeedbackPlugin()] })]
  i18n: { defaultLocale: "en", locales: ["en", "hu", "de"], fallback: { hu: "en", de: "en" } }

src/plugins/bol-theme/          ← native plugin (new)
  index.ts                      descriptor + createPlugin + hooks
  admin.tsx                       React venue settings page (hours grid)
  utils/                          venue loader, hours logic, JSON-LD builder, i18n UI strings
  astro/                          PT block renderers + theme partials
  styles/                         BOL design tokens (or contribute to site global.css)

seed/seed.json                  BOL collections, menus, home page demo content
src/pages/
  index.astro                     home → CMS page entry
  experiences.astro               experiences catalog
src/layouts/Base.astro            shell; EmDashHead for metadata + JSON-LD
```

### Data flow

```
Plugin venue settings (KV)
  ├── bol.contact block (hours table, map, phone, socials)
  ├── theme: footer, mobile action bar, header CTAs
  └── page:metadata → JSON-LD LocalBusiness / BarOrPub

CMS collections
  ├── menu_items ← bol.menu block
  ├── gallery_items ← bol.gallery block
  └── experiences ← /experiences page

CMS page (home)
  └── portableText: [ bol.hero, bol.benefits, bol.menu, bol.gallery, bol.contact, … ]
```

---

## Theme vs blocks vs collections

### Theme (plugin — always rendered, not PT)

| Piece | Responsibility |
|-------|----------------|
| Design tokens | `--bol-bg`, `--bol-accent`, `font-display`, `font-body`, `rounded-card`, `shadow-glow` |
| `Base.astro` contributions | Skip link, main padding for mobile action bar, `class="dark"` pin |
| `SiteHeader` | Logo, primary menu, language switcher, mobile menu trigger |
| `MobileNav` | Full-screen nav (React island or Astro + minimal script) |
| `SiteFooter` | Tagline, socials, address, phone, email — **no opening hours** |
| `MobileActionBar` | Call, menu anchor, maps link, book (mailto) |
| UI string dictionaries | Nav labels, day names, open/closed templates, a11y strings (en/hu/de) |

Theme reads **venue settings** from plugin KV for phone, email, address, social URLs, maps URL.

### Portable Text blocks (plugin — editor-controlled on pages)

| Block type | Block fields (marketing) | External data |
|------------|--------------------------|---------------|
| `bol.hero` | kicker, title lines, subtitle, CTA labels, background image | optional tel/mailto from venue settings |
| `bol.benefits` | eyebrow, title, repeater: icon key, title, body (max 3) | — |
| `bol.menu` | eyebrow, title, subtitle, footnote | queries `menu_items` + `menu_category` taxonomy |
| `bol.gallery` | eyebrow, title, subtitle | queries `gallery_items` ordered by sort field |
| `bol.contact` | eyebrow, title, subtitle, toggles: showHours, showMap, showPhone, showSocials | venue settings |

Blocks are registered in `admin.portableTextBlocks` and rendered via `astro/blockComponents` (same pattern as `demo-blocks`).

EmDash **sections** (`seed.sections`, `/section` slash command) are **not used** for landing layout — they are reusable rich-text snippets, not structured UI sections.

### Collections (CMS — structured repeating content)

Editors manage items in dedicated admin lists; blocks only provide section chrome and query logic.

---

## Plugin: `bol-theme`

### Descriptor (build time)

Registered in `astro.config.mjs` alongside existing plugins. Native format, single entrypoint, optional `adminEntry` for React admin.

### Admin UI

Two layers ([React admin docs](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/)):

**1. Auto-generated settings (`settingsSchema`)** for scalar venue fields:

- `phone`, `phoneDisplay`, `email`
- `lat`, `lng`, `mapsUrl`
- `addressEn`, `addressHu`, `addressDe` (or equivalent localized keys)
- `socialInstagram`, `socialFacebook`, `socialTiktok`
- `bookingMailtoSubject`, `eventMailtoSubject` (optional)
- SEO extras: `schemaType` (select: `BarOrPub` / `Restaurant`), `priceRange` (optional)

**2. Custom React page `/venue`** for opening hours:

- Seven rows (Mon–Sun), each with open/close time inputs (text `HH:MM` or time-native inputs)
- Stored as JSON in KV, e.g. `settings:openingHours`
- Uses `@emdash-cms/admin` components and `usePluginAPI()` for load/save
- Parses to the same minute-based logic as prototype `hours.ts` (including post-midnight close)

Venue settings use plugin KV + custom React admin — not Field Kit (which only attaches to collection `json` fields and is not installed on this site).

### Runtime hooks

**`page:metadata`** — contribute JSON-LD on public pages:

```typescript
// Conceptual — implement in plugin
"page:metadata": async (event, ctx) => {
  const venue = await loadVenueSettings(ctx);
  if (!venue) return null;
  return {
    kind: "jsonld",
    graph: buildLocalBusinessGraph(venue, event.page),
  };
};
```

Use [`page:metadata`](https://docs.emdashcms.com/plugins/creating-native-plugins/page-fragments/#when-to-use-pagemetadata-instead), not `page:fragments`, for JSON-LD. `<EmDashHead />` in `Base.astro` already renders metadata contributions.

**Reading venue on the Astro side:** expose a small public API route on the plugin (e.g. `GET venue`) or a shared loader invoked during SSR that reads the same KV keys. Exact mechanism is an implementation detail; the design requires a single `loadVenueSettings()` used by theme partials, contact block, and JSON-LD builder.

### Plugin structure (target)

```
src/plugins/bol-theme/
├── index.ts
├── admin.tsx
├── constants.ts
├── utils/
│   ├── venue.ts
│   ├── hours.ts
│   ├── jsonld.ts
│   └── i18n/
│       ├── en.ts
│       ├── hu.ts
│       ├── de.ts
│       └── index.ts
└── astro/
    ├── index.ts                 # export blockComponents
    ├── theme/
    │   ├── SiteHeader.astro
    │   ├── SiteFooter.astro
    │   ├── MobileActionBar.astro
    │   └── MobileNav.tsx        # client island if needed
    └── blocks/
        ├── Hero.astro
        ├── Benefits.astro
        ├── Menu.astro
        ├── Gallery.astro
        └── Contact.astro
```

Interactive subcomponents (small React islands, **no shadcn**):

- `MenuTabs.tsx` — tab state, plain buttons + Tailwind
- `OpenNowBadge.tsx` — client local time via `hours.ts` logic
- `VenueMap.tsx` — Leaflet, dynamic import, SSR-safe
- `ExperienceFilter.tsx` — filter chips on `/experiences`

---

## Seed schema (collections)

Replace ShittySites demo collections used on the public site. Remove or hide `posts`, `showcase` if unused.

### `menu_items`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | translatable |
| `description` | text | translatable |
| `price` | integer | HUF |
| `image` | image | |
| `sort_order` | integer | non-translatable |

Taxonomy **`menu_category`**: `alcoholic`, `nonalcoholic`, `snacks` (flat, per-locale terms).

### `experiences`

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | translatable |
| `description` | text | translatable |
| `meta` | string | translatable (e.g. "From 1 hour · 1–6 players") |
| `image` | image | |
| `cta_type` | select | `tel` \| `mailto` \| `ask` |
| `sort_order` | integer | non-translatable |

Taxonomy **`experience_category`**: `gaming`, `social`, `events`.

### `gallery_items`

| Field | Type | Notes |
|-------|------|-------|
| `image` | image | |
| `alt` | string | translatable |
| `grid_span` | select | `default`, `col-2`, `row-2`, `col-2-row-2` — maps to bento Tailwind classes |
| `sort_order` | integer | non-translatable |

### `pages`

Keep existing `pages` collection. Home entry slug `home` (or dedicated route wiring) with `content` portable text composed of `bol.*` blocks.

Remove template field requirement for home if unused, or use **Full Width** template.

### Menus

**`primary`** menu per locale: Home, Menu (`#menu`), Experiences (`/experiences`), Contact (`#contact`).

### Site settings (EmDash global)

Title, logo, favicon, URL, timezone (`Europe/Budapest`), date/time formats — standard EmDash settings. Venue-specific data stays in the plugin, not duplicated in global settings.

### Seed media (local files)

Per [Creating Themes — Including Media](https://docs.emdashcms.com/themes/creating-themes/#including-media), demo images for seed content use **local files**, not prototype `public/` paths or hotlinked URLs.

**Layout:**

```plaintext
.emdash/
  uploads/          ← binary files referenced by seed (menu, gallery, hero, experiences)
seed/seed.json      ← $media references by filename (this repo’s seed path)
```

**Workflow:**

1. Copy needed images from `docs/design/v1/public/placeholders/` into `.emdash/uploads/` (keep descriptive filenames, e.g. `beer-pour.png`, `hero.png`).
2. Reference in `seed/seed.json` with `$media.file`, not `url`:

```json
{
  "image": {
    "$media": {
      "file": "beer-pour.png",
      "alt": "Craft beer poured fresh from the tap"
    }
  }
}
```

3. On first seed apply, EmDash reads `.emdash/uploads/` and uploads files to R2 — editors then manage them in the Media Library.

**Do not:**

- Point seed at `docs/design/v1/public/…` (reference repo only, not runtime path)
- Use raw URL strings on image fields (invalid seed shape)
- Put CMS demo photos in `public/` unless a fixed root URL is required (favicon, etc.)

**Theme/static assets** (logo markup, icons, CSS backgrounds not stored as CMS fields) belong in `src/assets/` and are imported in Astro — separate from `.emdash/uploads/`.

---

## Pages and routing

| URL | Source |
|-----|--------|
| `/` | Home page CMS entry; default locale unprefixed |
| `/hu/`, `/de/` | Same home via Astro i18n ([i18n guide](https://docs.emdashcms.com/guides/internationalization/)) |
| `/experiences` | Dedicated Astro page querying `experiences` collection |
| `/hu/experiences`, etc. | Locale-prefixed variants |

**Do not** enable `prefixDefaultLocale` — breaks `/_emdash/admin`.

Language switcher uses `getTranslations` + `getRelativeLocaleUrl` from `astro:i18n` where applicable; for static routes like home/experiences, map locale to equivalent path.

---

## Styling and fonts

### Tokens (from prototype reference)

| Token | Value |
|-------|-------|
| Background | `#0d0d0f` |
| Surface / surface-2 | `#16161a` / `#1e1e24` |
| Accent (amber) | `#f2b33d` |
| Accent muted (teal) | `#45d0c8` |
| Display font | Bebas Neue (latin-ext) |
| Body font | Manrope (latin-ext) |
| Card radius | `1rem` |

Implement via Tailwind 4 `@theme inline` in site or plugin CSS. Dark-only site — pin `class="dark"` on `<html>`, remove ShittySites theme switcher demo from `Base.astro`.

### shadcn/ui — explicitly excluded

Public UI uses semantic HTML + Tailwind utilities. No `components/ui/*`, no Radix dependency tree from the prototype. Plugin admin uses `@emdash-cms/admin` primitives only.

---

## Prototype component mapping (rewrite targets)

| Prototype | Production |
|-----------|------------|
| `globals.css` | BOL tokens in `global.css` / plugin CSS — re-authored |
| `Hero.tsx` | `bol.hero` Astro block |
| `Benefits.tsx` | `bol.benefits` Astro block |
| `MenuTabs.tsx` | `MenuTabs.tsx` island inside `bol.menu` — rewritten |
| `GalleryBento.tsx` | `bol.gallery` — rewritten grid with explicit mobile spans |
| `ContactSection.tsx` | `bol.contact` — rewritten; hours from venue settings |
| `Footer.tsx` | `SiteFooter.astro` — no hours section |
| `Header.tsx` / `MobileNav.tsx` | Theme partials — rewritten |
| `MobileActionBar.tsx` | Theme partial — rewritten |
| `ExperienceGrid.tsx` / `ExperienceCard.tsx` | `/experiences` page — rewritten |
| `VenueMap.tsx` | Leaflet island — rewritten; CSS scoped under `.leaflet-container` |
| `data/menu.ts` etc. | seed content + collections |
| `data/hours.ts` | `utils/hours.ts` in plugin — port logic, not UI |
| `data/i18n/*.ts` | plugin UI dictionaries + translatable CMS fields |
| shadcn `Button` | `<a class="…">` with Tailwind |
| `FeedbackWidget.tsx` | existing `hub-feedback` plugin — unchanged |

---

## Known prototype issues to fix during rewrite

These were identified in review; the rewrite must not regress them:

1. **Gallery bento** — prototype `col-span-2 row-span-2` classes may break on 2-column mobile grid; define explicit mobile vs `md:` spans.
2. **Menu tabs** — long HU/DE labels on narrow screens; allow horizontal scroll or smaller type.
3. **Main content padding** — bottom padding must clear fixed mobile action bar + safe area.
4. **Mobile nav** — overlay must not be trapped inside a `backdrop-blur` containing block (prototype bugfix).
5. **Leaflet** — load client-only; scope overrides for dark popup/controls.
6. **Map z-index vs sticky header** — Leaflet panes default to z-index 400–1000, which paints **above** the sticky header (`z-50`) when scrolling. Fix during rewrite:
   - Wrap the map in a scoped container (e.g. `.venue-map`) with `relative z-0 isolate overflow-hidden`.
   - Override Leaflet pane/control z-index **inside that container only** so tiles, zoom buttons, and popups stay below site chrome.
   - Keep header at `z-50`; mobile nav overlay above header (`z-[60]` or higher); mobile action bar `z-40`.
   - Verify: scroll contact section — map tiles/controls must never cover the header.
7. **Open/closed badge** — port `computeStatus()` logic; display uses localized templates from plugin i18n.

---

## Other plugins

| Plugin | Role |
|--------|------|
| `hub-feedback` | Visual feedback widget — keep as-is |
| `field-kit` | **Remove** — uninstall `@emdash-cms/plugin-field-kit`, remove from `astro.config.mjs` and `package.json` |
| `demo-blocks` | Remove from `astro.config.mjs` and delete when BOL blocks ship |

---

## Out of scope (v1)

- Blog / posts
- Booking engine or forms backend
- Video hero (static image + optional CSS kenburns is sufficient)
- Waze deep link (removed in prototype v10)
- Copying or fixing the Next.js prototype in place
- Automated test suite (per project rules — manual verification only)

---

## Manual verification checklist

After implementation, verify at **375px** and **1440px** in **en**, **hu**, **de**:

- [ ] No horizontal scroll on home and experiences
- [ ] Mobile action bar clears footer content; safe-area respected
- [ ] Mobile menu opens/closes; focus trap reasonable
- [ ] Menu tabs switch categories; prices format as HUF
- [ ] Gallery bento grid balanced on mobile and desktop
- [ ] Contact block: hours table, open/closed badge, map pin, tel/mailto work
- [ ] Scroll page with map visible — sticky header stays **above** map tiles and Leaflet controls (no z-index bleed)
- [ ] Footer shows no hours; socials and contact present
- [ ] `/experiences` filters work; CTAs match `cta_type`
- [ ] Language switcher preserves page context
- [ ] JSON-LD validates (Google Rich Results or schema validator)
- [ ] Admin: venue settings save and reflect on frontend
- [ ] Home page blocks reorder correctly in admin preview
- [ ] `Astro.cache.set(cacheHint)` on all content pages

---

## Next step

After this spec is approved, invoke the **writing-plans** skill to produce a phased implementation plan (`docs/superpowers/plans/2026-09-05-bol-theme-migration.md`).
