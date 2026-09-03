# Seed Reference — ShittySites Template

Companion to `seed/seed.json`. Maps each seed section to template files, EmDash docs, and fork guidance.

**Fresh database:** seed applies automatically on first request when the database is empty and setup has not been completed. If you already ran the old starter seed, delete the local D1 database (`.wrangler/state`) or use a clean project before expecting this seed to apply.

**Demo content:** schema/settings apply on first boot; entries (posts, pages, showcase) require dev bypass with `content=1`:

`http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin&content=1`

If dev bypass returns **500**, check the terminal — common cause: invalid keys inside `content.*.data` (e.g. `seo` belongs in `_emdash_seo`, not in collection field data). Fix the seed and reset `.wrangler/state`.

---

## settings

| What | Site title, tagline, URL, pagination, dates, social, SEO defaults |
| Admin | Settings → General, Settings → SEO |
| Template | `src/utils/site-identity.ts`, `SeoHead.astro`, `Base.astro` |
| Docs | [Site settings](https://docs.emdashcms.com/guides/site-settings/) |
| Fork | **Keep** — every client site needs identity + SEO URL for sitemap |

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

## object cache (config, not seed)

KV-backed query cache in `astro.config.mjs` → `objectCache: kvCache({ binding: "CACHE" })`.

Requires `CACHE` KV namespace in `wrangler.jsonc`. Tune `defaultTtl` and `keyPrefix` per site.

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
| i18n stub | `LanguageSwitcher.astro`, `astro.config.mjs` |
