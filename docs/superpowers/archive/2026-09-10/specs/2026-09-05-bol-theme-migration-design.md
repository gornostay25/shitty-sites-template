# Bar of Legends — Theme Migration Design Spec

**Status:** Implemented (archived 2026-09-10) — plan at [`../plans/2026-09-05-bol-theme-migration.md`](../plans/2026-09-05-bol-theme-migration.md)  
**Part 2 shipped (2026-09-05):** single React `/venue` admin (no `settingsSchema`); `mapsUrl` derived from coordinates; opening hours support closed days  
**Part 3 shipped (2026-09-06):** theme chrome wired; `MobileNav` is Astro + native `<dialog popover>` (not React island); popover styles co-located in component  
**Part 4 shipped (2026-09-06):** five PT blocks registered + rendered; home seed PT stack (en/hu/de); `index.astro` queries `pages/home`; Leaflet contact map with scoped z-index; hero fallback `src/assets/hero.webp`  
**Part 5 shipped (2026-09-07):** `/experiences` + locale routes; demo-blocks and ShittySites demo routes removed; `ExperienceFilter` page-level island  
**PT fix shipped (2026-09-07):** blocks read `Astro.props.node` via `getPtNode()`; PT interactivity is CSS/vanilla scripts (no React in blocks) — [fix spec](../../2026-09-07/specs/2026-09-07-bol-pt-blocks-islands-fix-design.md)  
**Menu tab layout fix (2026-09-07):** `radiogroup` pattern + CMS-driven tabs — see [PT fix spec — post-ship follow-up](../../2026-09-07/specs/2026-09-07-bol-pt-blocks-islands-fix-design.md#post-ship-follow-up-2026-09-07)  
**Final refactor shipped (2026-09-07):** CMS-first taxonomies, social dedupe, `loadExperiencesPageData()` — [refactor spec](../../2026-09-07/specs/2026-09-07-bol-final-refactor-design.md)  
**Lucide icons shipped (2026-09-07):** `@lucide/astro` via `Icon.astro` wrapper — [icons spec](../../2026-09-07/specs/2026-09-07-bol-lucide-icons-design.md)  
**Date:** 2026-09-05  
**EmDash version:** 0.36.0 (+ bun patch for `byline`)  
**Reference:** `docs/design/v1/` (Next.js visual prototype — **reference only, do not copy code**)  
**Scope:** Migrate Bar of Legends from the design prototype to a production EmDash + Astro site with a native theme plugin, CMS collections, block-builder landing, and JSON-LD SEO

### Amendment log

| Date       | Note |
| ---------- | ---- |
| 2026-09-07 | **Superseded (partial):** PT block `node` props, no React islands in PT blocks. See [`../../2026-09-07/specs/2026-09-07-bol-pt-blocks-islands-fix-design.md`](../../2026-09-07/specs/2026-09-07-bol-pt-blocks-islands-fix-design.md). |
| 2026-09-07 | **Superseded (partial):** CMS-first taxonomies, shared utils, no unsafe slug casts. See [`../../2026-09-07/specs/2026-09-07-bol-final-refactor-design.md`](../../2026-09-07/specs/2026-09-07-bol-final-refactor-design.md). |
| 2026-09-07 | **Icons:** bol-theme uses `@lucide/astro`. See [`../../2026-09-07/specs/2026-09-07-bol-lucide-icons-design.md`](../../2026-09-07/specs/2026-09-07-bol-lucide-icons-design.md). |
| 2026-09-10 | **Hero background:** `backgroundImageUrl` editor field is Block Kit `media_picker` (media library) instead of manual URL `text_input`; stored value remains a URL string. |

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
| Dev schema changes | **No legacy shims** — site is in active development; when KV keys or settings shapes change, update code and admin data directly — do not read renamed/removed keys for backward compatibility |
| Venue address | **Single `address` string** in plugin settings — locale-agnostic; admin labels English-only |
| Plugin admin UI | **English only** — `/venue` settings page; no Lingui catalog or translated admin labels |
| Theme UI copy | **`utils/i18n/`** — en/hu/de strings for header, footer, action bar, contact block labels (`getUiStrings(locale)`); separate from plugin admin |
| Google Maps link | **Derived at read time** from `lat` / `lng` via `buildMapsUrl()` — not stored in KV or edited in admin |
| Phone display | **Derived at read time** via `libphonenumber-js` — single stored `phone`; `phoneDisplay` + `phoneTel` on public API |
| Venue admin | **Single React page `/venue`** — all venue fields + opening hours; no auto-generated `settingsSchema` form |
| Opening hours — closed days | Each Mon–Sun row may set **`closed: true`**; open/close times ignored; omitted from JSON-LD; status logic skips closed days |
| `hub-feedback` | **Removed** — not part of BOL migration; drop plugin, deps, and `Base.astro` mount |
| Mobile nav | **Native `<dialog popover>`** in `MobileNav.astro` — CSS transitions (`:popover-open`, `@starting-style`); minimal JS for ARIA + close-on-link; panel below sticky header (`inset: 4rem 0 0`); styles in component `<style is:global>`, not site `global.css` |
| Collection features | **No drafts / revisions** — BOL collections use `search` (+ `seo` on `pages` and `experiences` only); edits publish directly |
| Page layout | **No template field** — `pages` has `title` + `content` only; single full-width `<article>` in routes (no Default / Full Width / Sidebar select) |
| Seed / CMS media | **WebP** in `.emdash/uploads/` (`img2webp -lossy -q 82`); `$media.file` references `.webp` filenames |
| Hero background (static) | **`src/assets/hero.webp`** — imported in `bol.hero` block; optional `media_picker` field `backgroundImageUrl` (EmDash media library → URL string) overrides |
| PT block props | Read CMS fields from **`Astro.props.node`** via `getPtNode()` — not flat `Astro.props` ([EmDash Embed pattern](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/)) |
| React islands in PT blocks | **Forbidden** — Astro ignores `client:*` inside Portable Text `components` map; use CSS or co-located `<script>` in block `.astro` files |
| Page-level React islands | **`ExperienceFilter` only** — `client:load` on `experiences.astro` / `hu/` / `de/` page files, passed into `ExperiencesRoute` via slot |

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
  integrations: [emdash({ plugins: [bolThemePlugin()] })]
  i18n: { defaultLocale: "en", locales: ["en", "hu", "de"], fallback: { hu: "en", de: "en" } }

src/plugins/bol-theme/          ← native plugin (new)
  index.ts                      descriptor + createPlugin + hooks
  admin.tsx                       React venue settings page (all fields + hours)
  utils/                          venue loader, hours logic, JSON-LD, phone, theme i18n (en/hu/de)
  astro/                          PT block renderers + theme partials
  styles/                         BOL design tokens (or contribute to site global.css)

seed/seed.json                  BOL collections, menus, home page demo content
src/pages/
  index.astro                     home EN → CMS `pages/home` + PortableText (inlined)
  hu/index.astro, de/index.astro  locale home routes
  [slug].astro                    other CMS pages — single `<article>`; redirects `/hu` → `/hu/` (locale slug guard)
  experiences.astro               experiences catalog (Part 5)
  hu/experiences.astro, de/experiences.astro
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
| `MobileNav` | Full-screen nav — Astro + native `<dialog popover>`; CSS transitions; panel below header (header stays visible, logo stable) |
| `SiteFooter` | Tagline, socials, address, phone, email — **no opening hours** |
| `MobileActionBar` | Call, menu anchor, maps link, book (mailto) |
| UI string dictionaries | `getUiStrings(locale)` from `utils/i18n/` — nav, action bar, contact section labels, day names (en/hu/de); **not** venue address text |

Theme reads **venue settings** from plugin KV for phone, email, address, social URLs, coordinates, and opening hours. **Maps links** use `buildMapsUrl(lat, lng)` (or `mapsUrl` on the `venue/public` response) — not a stored setting.

### Portable Text blocks (plugin — editor-controlled on pages)

| Block type | Block fields (marketing) | External data |
|------------|--------------------------|---------------|
| `bol.hero` | kicker, title lines, subtitle, CTA labels, optional `backgroundImageUrl` (`media_picker`, images only) | fallback `src/assets/hero.webp`; tel from venue settings |
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

Single custom React page **`/venue`** ([React admin docs](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/)) — **no `settingsSchema`** auto-form. All venue data is edited and saved in one place.

**Page sections (Kumo + EmDash admin chrome):**

| Section | Fields |
|---------|--------|
| Contact | `phone`, `email` — display/`tel:` derived via `libphonenumber-js` (region from `+` prefix, else `HU`) |
| Location | `address`, `lat`, `lng` |
| Social | `socialInstagram`, `socialFacebook`, `socialTiktok` |
| SEO | `schemaType` (`BarOrPub` / `Restaurant`), `priceRange` (optional) |
| Opening hours | Seven rows (Mon–Sun): **Open** switch per day; when open, `open` / `close` time inputs (`HH:MM`) |

**UI stack (EmDash 0.36):**

- Layout/actions: `EditorHeader`, `SaveButton` from `@emdash-cms/admin`
- Form primitives: `@cloudflare/kumo` (`Input`, `InputArea`, `Select`, `Switch`, `Table`, `LayerCard`, `Banner`, `Grid`, `Loader`) — docs mention `Card`/`Input` from `@emdash-cms/admin` but those are **not exported** on 0.36
- **English-only copy in admin** — `/venue` React page only; theme public UI uses `getUiStrings(Astro.currentLocale)`
- Load/save: `apiFetch` + `parseApiResponse` via `components/plugin-api.ts` (not `usePluginAPI()`)

**API routes:**

| Route | Method | Auth | Returns |
|-------|--------|------|---------|
| `venue/settings` | GET / POST | Admin | Full `VenueSettings` (stored shape — no `mapsUrl`) |
| `venue/public` | GET | **`public: true`** | `PublicVenueSettings` = settings + computed `mapsUrl` |

Opening hours stored as JSON in KV at `settings:openingHours`. Each row:

```typescript
type OpeningHoursRow = {
  closed?: boolean;  // when true, open/close ignored
  open: string;      // "HH:MM"
  close: string;     // "HH:MM" — may exceed midnight (e.g. 01:00, 24:00)
};
```

**Maps URL (derived, not stored):**

```typescript
buildMapsUrl(lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
```

**EmDash 0.36 implementation notes** (verify against installed `emdash@0.36.0` + `@emdash-cms/admin@0.36.0`):

| Docs / plan may say | Ship this on 0.36 |
|---------------------|-------------------|
| `usePluginAPI()` | **Not exported** — use `apiFetch()` + `parseApiResponse()`; helper lives in `components/plugin-api.ts` |
| `@emdash-cms/admin` Card / Alert / Input | **Not exported** — use `@cloudflare/kumo` for plugin admin pages; `EditorHeader` + `SaveButton` **are** exported |
| Separate scalar settings form + hours page | **Single `/venue` page** saves everything via `venue/settings` POST |
| Stored `mapsUrl` KV key | **Removed** — derive from coordinates at read time |
| Raw `response.json()` on plugin routes | Responses are `{ success, data }` — always unwrap via `parseApiResponse` |
| `import type { PublicPageContext } from "emdash/page"` | Import `PublicPageContext` from **`emdash`** |
| Public venue loader route | Route `venue/public` must set **`public: true`** or SSR/unauthenticated GET returns 401 |

**No legacy migration:** when renaming settings keys (e.g. dropping `addressEn` / `addressHu` / `addressDe` for a single `address`, or removing stored `mapsUrl`), do not fall back to old KV keys — re-enter in admin or re-run `plugin:install` on a fresh DB.

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

**Reading venue on the Astro side:** `GET venue/public` ( **`public: true`** ) returns `PublicVenueSettings` including computed `mapsUrl`. Theme partials, contact block, and JSON-LD use `loadVenueSettings()` / `loadPublicVenueSettings()` from `utils/venue.ts`.

### Plugin structure (target)

```
src/plugins/bol-theme/
├── index.ts
├── admin.tsx
├── constants.ts
├── components/
│   ├── VenueSettingsPage.tsx
│   └── plugin-api.ts              # apiFetch + parseApiResponse wrapper
├── utils/
│   ├── venue.ts
│   ├── hours.ts
│   ├── jsonld.ts
│   ├── phone.ts
│   ├── format.ts                # formatHUF, applyTemplate
│   ├── pt-node.ts               # getPtNode<T>() for PT block props
│   └── i18n/                    # theme UI copy (en/hu/de) — not used in admin
│       ├── en.ts
│       ├── hu.ts
│       ├── de.ts
│       └── index.ts
├── types/
│   └── pt-blocks.ts             # BolHeroNode, BolMenuNode, …
├── styles/
│   └── leaflet.css              # scoped map overrides + z-index caps
└── astro/
    ├── index.ts                 # export blockComponents
    ├── islands/
    │   └── ExperienceFilter.tsx # page-level only — NOT inside PT blocks
    ├── routes/
    │   ├── ExperiencesRoute.astro
    │   └── experiences-filter-props.ts
    ├── components/
    │   └── ExperienceCard.astro
    ├── theme/
    │   ├── SiteHeader.astro
    │   ├── SiteFooter.astro
    │   ├── MobileActionBar.astro
    │   ├── MobileNav.astro      # native popover dialog; styles co-located
    │   └── LanguageSwitcher.astro
    └── blocks/
        ├── Hero.astro
        ├── Benefits.astro
        ├── Menu.astro           # CSS :has() radio tabs + minimal aria sync script
        ├── Gallery.astro
        ├── Contact.astro        # open-now + Leaflet via co-located scripts
        └── contact-open-now.ts  # client init for open/closed badge
```

**Interactivity (production):**

- **`Menu.astro`** — CSS radio tabs (`:has()`); tiny script syncs `aria-selected` / `hidden`
- **`Contact.astro`** — `contact-open-now.ts` + dynamic Leaflet import in `<script>`; no React
- **`ExperienceFilter.tsx`** — React island on `/experiences` page files only (`client:load` + slot)

**Removed after PT fix (2026-09-07):** `MenuTabs.tsx`, `OpenNowBadge.tsx`, `VenueMap.tsx`, `HomeRoute.astro`

---

## Seed schema (collections)

Replace ShittySites demo collections used on the public site. Remove or hide `posts`, `showcase` if unused.

### Collection features (`supports`)

| Collection | Supports | Notes |
|------------|----------|-------|
| `pages` | `search`, `seo` | No drafts, revisions, or template field |
| `menu_items` | `search` | |
| `experiences` | `search`, `seo` | |
| `gallery_items` | `search` | |

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

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | |
| `content` | portableText | Home composed of `bol.*` blocks |

**Supports:** `search`, `seo` — no `drafts`, `revisions`, or `template` select.

Home entry slug `home` (en/hu/de translations). Route wiring: `src/pages/index.astro` queries `getEmDashEntry("pages", "home", { locale })`. Other pages use `src/pages/[slug].astro` with a single inline `<article>` — no layout map (`PageDefault` / `PageFullWidth` / `PageSidebar` removed).

### Menus

**`primary`** menu per locale: Home, Menu (`#menu`), Experiences (`/experiences`), Contact (`#contact`).

### Site settings (EmDash global)

Title, logo, favicon, URL, timezone (`Europe/Budapest`), date/time formats — standard EmDash settings. Venue-specific data stays in the plugin, not duplicated in global settings.

### Seed media (local files)

Per [Creating Themes — Including Media](https://docs.emdashcms.com/themes/creating-themes/#including-media), demo images for seed content use **local files**, not prototype `public/` paths or hotlinked URLs.

**Layout:**

```plaintext
.emdash/
  uploads/          ← WebP files referenced by seed (menu, gallery, experiences)
src/assets/         ← theme-static assets (e.g. hero.webp for bol.hero fallback)
seed/seed.json      ← $media references by filename (this repo’s seed path)
```

**Workflow:**

1. Copy needed images from `docs/design/v1/public/placeholders/` into `.emdash/uploads/`.
2. Convert to WebP (lossy, ~q82): `img2webp -lossy -q 82 -m 4 input.png -o output.webp` — then remove source PNGs from `uploads/`.
3. Reference in `seed/seed.json` (via `scripts/generate-bol-seed.ts`) with `$media.file`, not `url`:

```json
{
  "image": {
    "$media": {
      "file": "beer-pour.webp",
      "alt": "Craft beer poured fresh from the tap"
    }
  }
}
```

4. On seed apply, EmDash reads `.emdash/uploads/` and uploads files to R2 — editors then manage them in the Media Library.

**Hero block background** is not seed media — use `src/assets/hero.webp` (Astro-optimized import) unless the block’s optional `backgroundImageUrl` field is set via the admin `media_picker` (stores the selected image URL).

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
| `/hu/`, `/de/` | Locale home via `hu/index.astro`, `de/index.astro` |
| `/hu`, `/de` (no trailing slash) | `[slug].astro` redirects to `/hu/`, `/de/` — avoids treating locale codes as CMS slugs |
| `/experiences` | Dedicated Astro page querying `experiences` collection |
| `/hu/experiences`, `/de/experiences` | Locale-prefixed variants |

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

Public UI uses semantic HTML + Tailwind utilities. No `components/ui/*`, no Radix dependency tree from the prototype. Plugin **admin pages** use `@cloudflare/kumo` primitives (via EmDash’s admin stack), not shadcn.

---

## Prototype component mapping (rewrite targets)

| Prototype | Production |
|-----------|------------|
| `globals.css` | BOL tokens in `global.css` / plugin CSS — re-authored |
| `Hero.tsx` | `bol.hero` Astro block |
| `Benefits.tsx` | `bol.benefits` Astro block |
| `MenuTabs.tsx` | `Menu.astro` — CSS radio tabs; radios outside `tablist`, labels in `inline-flex` pill row |
| `GalleryBento.tsx` | `bol.gallery` — rewritten grid with explicit mobile spans |
| `ContactSection.tsx` | `bol.contact` — hours/map/open-now via vanilla scripts |
| `Footer.tsx` | `SiteFooter.astro` — no hours section |
| `Header.tsx` / `MobileNav.tsx` | `SiteHeader.astro` + `MobileNav.astro` (native popover) — rewritten |
| `MobileActionBar.tsx` | Theme partial — rewritten |
| `ExperienceGrid.tsx` / `ExperienceCard.tsx` | `/experiences` page — `ExperiencesRoute` + `ExperienceCard.astro` |
| `VenueMap.tsx` | Leaflet init in `Contact.astro` `<script>`; CSS scoped under `.leaflet-container` |
| `data/menu.ts` etc. | seed content + collections |
| `data/hours.ts` | `utils/hours.ts` in plugin — port logic, not UI |
| `data/i18n/*.ts` | `utils/i18n/` theme dictionaries + translatable CMS fields; venue `address` from settings |
| shadcn `Button` | `<a class="…">` with Tailwind |

---

## Known prototype issues to fix during rewrite

These were identified in review; the rewrite must not regress them:

1. **Gallery bento** — prototype `col-span-2 row-span-2` classes may break on 2-column mobile grid; define explicit mobile vs `md:` spans.
2. **Menu tabs** — long HU/DE labels on narrow screens; allow horizontal scroll or smaller type. **Fixed (2026-09-07):** radios outside flex tablist so active pill aligns correctly inside `p-1` track.
3. **Main content padding** — bottom padding must clear fixed mobile action bar + safe area.
4. **Mobile nav** — panel is a **sibling** of `<header>`, not a child; positioned below the sticky bar (`inset: 4rem 0 0`) so `backdrop-blur` does not trap the overlay and the logo does not resize on open. Native `<dialog popover>` for open/close animations (CSS-first, not React state).
5. **Leaflet** — load client-only; scope overrides for dark popup/controls.
6. **Map z-index vs sticky header** — Leaflet panes default to z-index 400–1000, which paints **above** the sticky header (`z-50`) when scrolling. Fix during rewrite:
   - Wrap the map in a scoped container (e.g. `.venue-map`) with `relative z-0 isolate overflow-hidden`.
   - Override Leaflet pane/control z-index **inside that container only** so tiles, zoom buttons, and popups stay below site chrome.
   - Keep header at `z-50`; mobile nav panel **below** header (not full-screen over it); mobile action bar `z-40`.
   - Verify: scroll contact section — map tiles/controls must never cover the header.
7. **Open/closed badge** — port `computeStatus()` logic; status copy from `getUiStrings()` templates

---

## Other plugins

| Plugin | Role |
|--------|------|
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
- [ ] Mobile menu opens/closes with symmetric CSS transition; header/logo stable; scroll locked while open
- [x] Menu tabs switch categories; prices format as HUF (375px verified 2026-09-07; hu/de labels pending full pass)
- [ ] Gallery bento grid balanced on mobile and desktop
- [ ] Contact block: hours table, open/closed badge, map pin, tel/mailto work
- [ ] Scroll page with map visible — sticky header stays **above** map tiles and Leaflet controls (no z-index bleed)
- [ ] Footer shows no hours; socials and contact present
- [ ] `/experiences` filters work; CTAs match `cta_type`
- [ ] Language switcher preserves page context
- [ ] JSON-LD validates (Google Rich Results or schema validator)
- [ ] Admin: venue settings save and reflect on frontend (including closed days and coordinate-derived maps link)
- [ ] Home page blocks reorder correctly in admin preview
- [ ] `Astro.cache.set(cacheHint)` on all content pages

---

## Next step

Migration **shipped** (2026-09-07). Post-ship fixes (archived):

- [PT blocks + islands fix](../../2026-09-07/specs/2026-09-07-bol-pt-blocks-islands-fix-design.md) — shipped 2026-09-07
- [Final refactor](../../2026-09-07/specs/2026-09-07-bol-final-refactor-design.md) — shipped 2026-09-07: CMS-first taxonomies, social dedupe, `loadExperiencesPageData()` loader, no unsafe category casts
- [Lucide icons](../../2026-09-07/specs/2026-09-07-bol-lucide-icons-design.md) — shipped 2026-09-07: `@lucide/astro` wrapper in bol-theme

Remaining: full manual QA checklist above (375px + 1440px, en/hu/de).
