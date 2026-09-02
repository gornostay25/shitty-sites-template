# Seed Reference — ShittySites Template

Companion to `seed/seed.json`. Maps each seed section to template files, EmDash docs, and fork guidance.

**Fresh database:** seed applies automatically on first request when the database is empty and setup has not been completed. If you already ran the old starter seed, delete the local D1 database (`.wrangler` state) or use a clean project before expecting this seed to apply.

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

## content (demo entries)

| Entry | Route | Notes |
|-------|-------|-------|
| `about` | `/about` | Default layout |
| `feature-guide` | `/feature-guide` | Full Width layout — feature index |
| `contact` | `/contact` | Sidebar layout |
| `welcome` | `/posts/welcome` | Bylines, comments, featured image |
| `seo-demo` | `/posts/seo-demo` | Per-entry SEO overrides |
| `scheduled-post` | (draft) | Schedule in admin — seed uses draft placeholder |
| `all-fields` | `/showcase/all-fields` | Field type reference |

Fork: replace all demo content with client copy; delete showcase entries entirely for production.

---

## Template file map

| Feature | Files |
|---------|-------|
| Identity | `site-identity.ts`, `Base.astro` |
| SEO | `seo.ts`, `SeoHead.astro` |
| Page layouts | `PageDefault/FullWidth/Sidebar.astro`, `[slug].astro` |
| Blog | `posts/index.astro`, `posts/[slug].astro` |
| Taxonomies | `category/[slug].astro`, `tag/[slug].astro`, `PostTerms.astro` |
| Search | `search.astro`, `SiteHeader.astro` (LiveSearch) |
| Comments | `posts/[slug].astro` |
| HTML blocks | `HtmlBlock.astro` |
| i18n stub | `LanguageSwitcher.astro`, `astro.config.mjs` |
