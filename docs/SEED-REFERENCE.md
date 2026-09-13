# Seed Reference — ShittySites Template

Companion to `seed/seed.json`. Maps each seed section to template files, EmDash docs, and fork guidance.

**Fresh database:** seed applies automatically on first request when the database is empty and setup has not been completed. If you already ran the old starter seed, delete the local D1 database (`.wrangler/state`) or use a clean project before expecting this seed to apply.

**Demo content:** schema/settings apply on first boot; entries (posts, pages, showcase) require dev bypass with `content=1`:

`http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin&content=1`

If dev bypass returns **500**, check the terminal — common cause: invalid keys inside `content.*.data` (e.g. `seo` belongs in `_emdash_seo`, not in collection field data). Fix the seed and reset `.wrangler/state`.

If **Settings → SEO** will not save, check `settings.seo.robotsTxt` in seed/DB — `null` breaks the form; use a string (see [settings → robotsTxt](#settingsseorobotstxt--must-not-be-null)).

---

## settings

| What | Site title, tagline, URL, pagination, dates, social, SEO defaults |
| Admin | Settings → General, Settings → SEO |
| Template | `src/utils/site-identity.ts`, `SeoHead.astro`, `Base.astro` |
| Docs | [Site settings](https://docs.emdashcms.com/guides/site-settings/) |
| Fork | **Keep** — every client site needs identity + SEO URL for sitemap |

### `settings.seo.robotsTxt` — must not be `null`

EmDash admin **Settings → SEO** fails to save when `robotsTxt` is `null` in the database (validation expects a string). Use at least `""` in seed; never omit or set `null`.

This template seeds **deny-all** until a client opens indexing:

```json
"robotsTxt": "User-agent: *\nDisallow: /"
```

Replace with client-specific rules (or `""` to fall back to EmDash default `/robots.txt`) before production launch. After changing seed, reset local DB (`.wrangler/state`) or update the value in admin.

---

## collections

| Collection | Purpose | Routes | Fork |
|------------|---------|--------|------|
| `posts` | Blog with comments, bylines, SEO | `/posts`, `/posts/[slug]` | Delete if no blog |
| `pages` | Static pages + page layouts | `/[slug]` | **Keep** for most sites |
| `showcase` | All field types demo | `/showcase/[slug]` | Delete — dev reference only |

Docs: [Collections](https://docs.emdashcms.com/concepts/collections/), [Querying content](https://docs.emdashcms.com/guides/querying-content/)

---

## taxonomies

| Name | Type | Used on | Archive routes |
|------|------|---------|----------------|
| `category` | hierarchical | posts | `/category/[slug]` |
| `tag` | flat | posts | `/tag/[slug]` |
| `service-area` | flat | pages | (demo only — extend if needed) |

Docs: [Taxonomies](https://docs.emdashcms.com/guides/taxonomies/)

Fork: remove unused taxonomies from seed **and** delete archive routes + `PostTerms.astro` references.

---

## menus

| Menu | Used in |
|------|---------|
| `primary` | `SiteHeader.astro` via `getMenu("primary")` |
| `footer` | `SiteFooter.astro`, sidebar menu widget |

Demo item types: custom, collection, page, post, taxonomy, nested children.

Docs: [Menus](https://docs.emdashcms.com/guides/menus/)

Fork: trim items to client navigation; delete unused menus from seed.

---

## widgetAreas

| Area | Used in |
|------|---------|
| `sidebar` | `PageSidebar.astro`, `posts/[slug].astro` |
| `footer` | `SiteFooter.astro` |

Widget types: component (`core:*`), content (Portable Text), menu.

Manual rendering: `WidgetRenderer.astro` (prefer `<WidgetArea />` in layouts).

Docs: [Widgets](https://docs.emdashcms.com/guides/widgets/)

Fork: remove unused areas from seed and delete `<WidgetArea />` calls in templates.

---

## sections

| Slug | Purpose |
|------|---------|
| `hero-centered` | Hero block — insert via `/section` |
| `newsletter-cta` | CTA — rendered on `/` via `getSection()` |
| `feature-callout` | Feature highlight |

Docs: [Sections](https://docs.emdashcms.com/guides/sections/)

Fork: replace with client-specific sections or delete unused slugs.

---

## bylines

| Slug | Profile |
|------|---------|
| `editorial` | ShittySites Editorial |
| `guest-author` | Guest contributor |

Assigned on `welcome` post. Rendered in `PostMeta.astro`.

Fork: delete if client has no multi-author content; remove `bylines` from seed and `PostMeta.astro`.

---

## redirects

| Source | Destination |
|--------|-------------|
| `/old-about` | `/about` |
| `/blog` | `/posts` |

Docs: built-in EmDash redirect middleware.

Fork: replace with client redirects; remove demo entries.

---

## demo-blocks plugin (native)

| Block type | Renderer |
|------------|----------|
| `demo.callout` | `src/plugins/demo-blocks/astro/Callout.astro` |
| `demo.cta` | `src/plugins/demo-blocks/astro/CtaStrip.astro` |
| `demo.stats` | `src/plugins/demo-blocks/astro/Stats.astro` |

Registered via `demoBlocksPlugin()` in `astro.config.mjs`. PT renderers auto-merge — pages only override site-specific types (e.g. `htmlBlock`).

Docs: [Native plugins](https://docs.emdashcms.com/plugins/creating-native-plugins/)

Fork: remove plugin from `astro.config.mjs` and delete `src/plugins/demo-blocks/`.

---

## Internationalization

Demo locales: `en` (default) + `uk` in `astro.config.mjs`. Ukrainian routes use `/uk/…` prefix (never `prefixDefaultLocale`).

EmDash uses **one set of page templates** (not `src/pages/uk/` folders). Set `routing: { fallbackType: "rewrite" }` in `astro.config.mjs` so `/uk/…` rewrites to root templates with `Astro.currentLocale = "uk"`. Guard non-default locale slugs in root `[slug].astro` via `src/utils/i18n/locales.ts`.

### Seed rules

1. Source entry must appear **before** translations in the seed file
2. `translationOf` references source seed `id`, not slug
3. Menus: same `name`, per-locale rows with `id`, `locale`, optional `translationOf`
4. Taxonomy term labels: per-locale rows with `translationOf`; query via `getTerm(..., { locale })` — not `getUiStrings`
5. Add explicit `"locale": "en"` on source rows when a collection has translations

### Demo translations (this template)

| Entity | EN | UK |
|--------|----|----|
| Page | `about` / `/about` | `about-uk` / `/uk/pro-nas` |
| Post | `welcome` / `/posts/welcome` | `welcome-uk` / `/uk/vitayemo` |
| Menu | `primary` | `primary-uk` (translated labels, `/uk/…` URLs) |
| Category term | `guides` → Guides | `guides-uk` → Посібники |

Template chrome strings: `src/utils/i18n/` (`getUiStrings`). Language switcher: `LanguageSwitcher.astro`.

Docs: [Internationalization](https://docs.emdashcms.com/guides/internationalization/)

---

## Seed media

**Preferred:** `$media.file` pointing at filenames in committed `seed/media/`:

```json
"featured_image": {
  "$media": { "file": "welcome-featured.webp", "alt": "…" }
}
```

CLI seed and upload scripts use `seed/media/` directly:

```bash
bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir seed/media
```

EmDash apply does not upload `$media.file` to R2. After seed or D1 import, run media upload:

| Script | Target |
|--------|--------|
| `bun run seed:media-upload:local` | Local R2 + dev D1 (after `bun dev`) |
| `bun run seed:media-upload` | Remote R2 + remote D1 (production swap) |
| `bun run seed:d1-export` | SQLite → `.emdash/d1-import.sql` for D1 execute |

**Alternative:** `$media.url` for external URLs (no upload script needed).

Docs: [CLOUDFLARE-DEPLOYMENT.md](./CLOUDFLARE-DEPLOYMENT.md)

---

## object cache (config, not seed)

KV-backed query cache in `astro.config.mjs` → `objectCache: kvCache({ binding: "shittysites-template-CACHE" })`.

Requires `shittysites-template-CACHE` and `shittysites-template-SESSION` KV bindings in `wrangler.jsonc`. Tune `defaultTtl` and `keyPrefix` per site.

**Production:** bulk seed via setup wizard can hit KV 429 / subrequest limits when object cache is enabled. Use CLI seed + D1 import ([CLOUDFLARE-DEPLOYMENT.md](./CLOUDFLARE-DEPLOYMENT.md)). After direct SQL import, stale cache may hide patched media — see deployment doc.

Docs: [Object cache](https://docs.emdashcms.com/deployment/object-cache/)

---

## dark mode (template, not seed)

Theme switcher demo in `Base.astro` + minimal `light-dark()` tokens in `global.css`.

Fork light-only sites: see AI comment block at top of `Base.astro`.

Docs: [Dark mode](https://docs.emdashcms.com/guides/dark-mode/)

---

## media usage tracking (admin one-time step)

**Settings → Media usage tracking** → enable and keep tab open until Ready. No cron in wrangler (removed in EmDash 0.36).

Docs: [Media Library — Used in](https://docs.emdashcms.com/guides/media-library/)

---

## content (demo entries)

| Entry | Route | Notes |
|-------|-------|-------|
| `about` | `/about` | Default layout |
| `feature-guide` | `/feature-guide` | Full Width layout — feature index |
| `contact` | `/contact` | Sidebar layout |
| `welcome` | `/posts/welcome` | Bylines, comments, featured image |
| `seo-demo` | `/posts/seo-demo` | SEO panel demo — set overrides in admin (not in seed `data`) |
| `scheduled-post` | (draft) | Schedule in admin — seed uses draft placeholder |
| `all-fields` | `/showcase/all-fields` | Field type reference |

Fork: replace all demo content with client copy; delete showcase entries entirely for production.

**Do not put `seo` inside `content.*.data`.** Per-entry SEO is stored in `_emdash_seo`. At runtime it appears as `entry.data.seo` when loaded, but seed `data` must only contain collection field slugs.

---

## public/ (static assets)

| Path | Served at | Purpose |
|------|-----------|---------|
| `public/hero-visual.svg` | `/hero-visual.svg` | Light-theme demo SVG |
| `public/hero-visual-alt.svg` | `/hero-visual-alt.svg` | Dark-theme demo SVG |

Files in `public/` are served from the site root with no build processing. Use root-relative URLs in templates (`/hero-visual.svg`). For optimized Astro assets use `src/assets/`; for CMS images use `<Image image={...} />`.

---

## Template file map

| Feature | Files |
|---------|-------|
| Identity | `site-identity.ts`, `Base.astro` |
| SEO | `seo.ts`, `SeoHead.astro` |
| Demo blocks plugin | `src/plugins/demo-blocks/`, `astro.config.mjs` |
| Page layouts | `PageDefault/FullWidth/Sidebar.astro`, `[slug].astro` |
| Blog | `posts/index.astro`, `posts/[slug].astro` |
| Taxonomies | `category/[slug].astro`, `tag/[slug].astro`, `PostTerms.astro` |
| Search | `search.astro`, `SiteHeader.astro` (LiveSearch) |
| Comments | `posts/[slug].astro` |
| HTML blocks | `HtmlBlock.astro` |
| i18n demo | `LanguageSwitcher.astro`, `src/utils/i18n/`, `astro.config.mjs` |
