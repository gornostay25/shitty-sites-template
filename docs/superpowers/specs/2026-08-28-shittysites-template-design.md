# ShittySites Template — Design Spec

**Date:** 2026-08-28  
**Status:** Draft
**Template name:** ShittySites Template

## Summary

Transform the minimal EmDash Cloudflare starter into **ShittySites Template** — an agency base template for rebuilding bad business websites. The template is not a finished visual design. It is a **fully wired, unstyled reference** with inline comments so AI agents (and developers) can fork a copy, delete what a client project does not need, and add Tailwind styling.

Core goals:

1. **Common structure** every client site inherits (layout, identity, SEO, sitemap)
2. **Admin-customizable site identity** via `src/utils/site-identity.ts` and [site settings](https://docs.emdashcms.com/guides/site-settings/)
3. **Full EmDash capability demo** — collections, taxonomies, menus, widgets, sections, page layouts, search, comments, bylines, media, preview, visual editing
4. **Tailwind wired but unused** on demo markup (installed via `@tailwindcss/vite`)
5. **Heavy documentation** in code comments, README, and AGENTS.md

## Context

- **Business model:** Find businesses with poor websites; offer new sites built from this template.
- **Workflow:** Copy repo → strip unused features → style with Tailwind → configure admin settings for client.
- **Runtime:** Cloudflare Workers (D1 + R2), Astro SSR (`output: "server"`).
- **i18n:** English only in config; docs explain how to add locales ([internationalization guide](https://docs.emdashcms.com/guides/internationalization/)).

## Architecture

### Two implementation specs

| Spec | Scope |
|------|-------|
| **Spec 1 — Foundation** | Rename template, config, `site-identity`, SEO pipeline, Base layout, Tailwind shell, docs rename |
| **Spec 2 — Full demo** | Comprehensive seed, components, pages, comment conventions, feature index |

Spec 2 depends on Spec 1. Each spec should produce a working site when implemented sequentially.

### Approach: Kitchen sink on real routes

Use production-shaped routes (`/posts`, `/search`, `/category/...`) — not isolated `/demo/*` paths. Demo content lives in seed + a `feature-guide` page. Forking agents delete unused routes, seed sections, and components together.

### Fork model

When adapting for a client:

1. Remove unused collections and content from `seed/seed.json`
2. Delete matching page routes under `src/pages/`
3. Delete orphaned components
4. Trim menus, widget areas, taxonomies in seed
5. Add Tailwind classes to layout/components
6. Set site title, logo, canonical URL, and SEO defaults in admin (`Settings`)

## File structure

```
src/
├── layouts/
│   ├── Base.astro              # Shell: SEO, header, footer, Tailwind import
│   ├── PageDefault.astro       # Page layout: narrow column
│   ├── PageFullWidth.astro     # Page layout: wide, no sidebar
│   └── PageSidebar.astro       # Page layout: content + sidebar widgets
├── components/
│   ├── SiteHeader.astro        # Logo, primary menu, LiveSearch
│   ├── SiteFooter.astro        # Footer menu, social links, footer widgets
│   ├── SeoHead.astro           # getSeoMeta + site settings
│   ├── WidgetRenderer.astro    # All widget types (manual render pattern)
│   ├── MenuNav.astro           # Flat + nested menus
│   ├── SocialLinks.astro       # From site settings
│   ├── PostMeta.astro          # Bylines, terms, dates
│   ├── PostTerms.astro         # Category + tag links
│   ├── HtmlBlock.astro         # Custom Portable Text htmlBlock component
│   ├── LanguageSwitcher.astro  # Commented stub — enable when adding locales
│   └── widgets/                # Optional per-component widgets (if not using WidgetArea shortcut)
├── utils/
│   ├── site-identity.ts        # resolveSiteIdentity(settings)
│   └── seo.ts                  # getSeoMeta helpers, canonical URL builder
├── pages/
│   ├── index.astro
│   ├── [slug].astro              # CMS pages incl. feature-guide, about, etc.
│   ├── posts/index.astro
│   ├── posts/[slug].astro
│   ├── category/[slug].astro
│   ├── tag/[slug].astro
│   ├── search.astro
│   ├── showcase/[slug].astro     # Field-type reference collection
│   └── 404.astro
├── styles/global.css             # @import "tailwindcss" only
seed/seed.json
docs/SEED-REFERENCE.md            # Seed section → doc links (companion to seed.json)
```

## Spec 1 — Foundation

### Template identity

- `package.json` → `emdash.label`: `"ShittySites Template"`
- `seed/seed.json` → `meta.name`: `"ShittySites Template"`
- Update `README.md` and `AGENTS.md` § "This Template"

### astro.config.mjs

- Keep Tailwind via `@tailwindcss/vite` plugin (already installed)
- Enable i18n with single locale:

```js
i18n: {
  defaultLocale: "en",
  locales: ["en"],
  // Do NOT use prefixDefaultLocale — breaks /_emdash/admin
  // To add locales: locales: ["en", "uk"], fallback: { uk: "en" }
},
```

- Keep `fonts` commented with pointer to Astro fonts docs
- EmDash integration unchanged (D1 + R2)

### site-identity.ts

Replace `resolveStarterSiteIdentity` with `resolveSiteIdentity`:

- Input: `Partial<SiteSettings>` from `getSiteSettings()`
- Output: normalized identity object:
  - `siteTitle`, `siteTagline`
  - `siteLogo`, `siteFavicon` (resolved media refs or null)
  - `siteUrl` (canonical base for SEO/sitemap)
  - `social`, `seo` defaults
  - `postsPerPage`, `dateFormat`, `timezone`
- Fallback constants only when admin values are unset
- JSDoc on each field: admin path (`Settings → General`, `Settings → SEO`, etc.)
- Update all imports from old function name

Reference: [Site Settings guide](https://docs.emdashcms.com/guides/site-settings/)

### SEO pipeline

**Built-in (no custom routes):**

- `/sitemap.xml` and `/sitemap-{collection}.xml` — EmDash auto-generated
- `/robots.txt` — EmDash default or custom via `settings.seo.robotsTxt`

**Requires `settings.url`** in seed and admin for absolute URLs in sitemap and canonical tags.

**Template layer:**

- `src/utils/seo.ts` — wrapper around `getSeoMeta()` from `emdash/seo`
- `src/components/SeoHead.astro` — renders title, description, canonical, OG, robots
- Content pages pass entry to `getSeoMeta` with `siteTitle`, `siteUrl`, path
- `Base.astro` uses `createPublicPageContext` + `EmDashHead` / `EmDashBodyStart` / `EmDashBodyEnd` for plugin page contributions

Reference: [Site Settings — SEO Meta Tags](https://docs.emdashcms.com/guides/site-settings/), EmDash `packages/core/src/seo/index.ts`

### Base.astro

- Import `../styles/global.css`
- Call `resolveSiteIdentity(await getSiteSettings())`
- No hardcoded site title or navigation
- Compose `SiteHeader`, `<main><slot /></main>`, `SiteFooter`
- Accept props: `title`, `description`, `image`, `canonical`, `content?` (for page contributions)
- Comment: add Tailwind utility classes when building client site

### README.md (foundation sections)

- Purpose: ShittySites agency template
- Fork workflow (5 steps)
- Dev commands (`bun install`, `bun dev`)
- Link to feature checklist and EmDash docs
- Note: demo is intentionally unstyled

### AGENTS.md § "This Template"

Replace starter description with:

- ShittySites purpose and fork rules
- File map (layouts, components, utils)
- Feature → doc URL cross-reference table
- Rules: SSR only, `entry.id` vs `entry.data.id`, image fields as objects, `cacheHint`, taxonomy name exact match
- i18n: how to add `uk` or other locales

## Spec 2 — Full demo

### Seed settings block

Populate all settings fields with demo values:

```json
{
  "title": "ShittySites Demo",
  "tagline": "Full EmDash capability reference — unstyled on purpose",
  "url": "http://localhost:4321",
  "postsPerPage": 5,
  "dateFormat": "MMMM d, yyyy",
  "timezone": "UTC",
  "social": { "twitter": "shittysites", "github": "example" },
  "seo": {
    "titleSeparator": " | ",
    "robotsTxt": null,
    "googleVerification": "",
    "bingVerification": ""
  }
}
```

Logo/favicon via `$media` references if seed media uploads are added; otherwise document upload path in admin.

### Collections

#### posts

- **Supports:** `drafts`, `revisions`, `preview`, `scheduling`, `search`, `seo`
- **commentsEnabled:** `true`
- **Fields:** `title`, `featured_image`, `content` (portableText), `excerpt`
- **Demo content:** 3+ posts including one with bylines, one scheduled, one with SEO overrides

Reference: [Working with Content](https://docs.emdashcms.com/guides/working-with-content/), [Querying Content](https://docs.emdashcms.com/guides/querying-content/)

#### pages

- **urlPattern:** `/{slug}`
- **Supports:** `drafts`, `revisions`, `search`, `seo`
- **Fields:** `title`, `content`, `template` (select: `Default`, `Full Width`, `Sidebar`)
- **Demo content:** `about`, `feature-guide` (master index of all demos + admin paths), page with embedded section via `/section`
- **urlPattern:** `/{slug}` (feature-guide renders at `/feature-guide` via `[slug].astro`)

Reference: [Page Layouts](https://docs.emdashcms.com/guides/page-layouts/)

#### showcase

- **Purpose:** One entry demonstrating every field type
- **urlPattern:** `/showcase/{slug}`
- **Fields:** all 16 EmDash field types (string, text, slug, number, boolean, date, datetime, image, file, url, email, color, json, reference, portableText, select)
- **Single demo entry** slug `all-fields`

Reference: [Collections & Fields](https://docs.emdashcms.com/concepts/collections/)

### Taxonomies

| Name | Type | Collections | Demo |
|------|------|-------------|------|
| `category` | hierarchical | posts | parent + child terms |
| `tag` | flat | posts | several tags |
| `service-area` | flat (custom) | pages | 2–3 terms |

Reference: [Taxonomies](https://docs.emdashcms.com/guides/taxonomies/)

### Menus

**primary** — demonstrate all item types:

- `custom` → Home `/`
- `collection` → Posts `/posts`
- `page` → About
- `post` → specific post
- `taxonomy` → category term
- Nested child items under one parent (dropdown)

**footer** — flat custom + page links

Reference: [Navigation Menus](https://docs.emdashcms.com/guides/menus/)

### Widget areas

**sidebar:**

- `core:search`
- `core:categories` (hierarchical)
- `core:recent-posts` (count: 5, showDate)
- `core:tags` (limit: 10)
- `core:archives`
- `content` widget (Portable Text blurb)
- `menu` widget → footer menu

**footer:**

- `content` widget
- `menu` widget

Use `<WidgetArea name="..." />` in layouts; `WidgetRenderer.astro` documents manual rendering alternative.

Reference: [Widget Areas](https://docs.emdashcms.com/guides/widgets/)

### Sections

Seed array with at least:

- `hero-centered` — keywords: hero, banner
- `newsletter-cta` — keywords: newsletter, subscribe
- `feature-callout` — keywords: feature, cta

Demo page content embeds a section via editor slash command. `index.astro` or `feature-guide` also shows `getSection("newsletter-cta")` programmatic render.

Reference: [Sections](https://docs.emdashcms.com/guides/sections/)

### Bylines

Seed 2 byline profiles (one guest). Assign multi-author credits on one post. Render via `post.data.byline` and `post.data.bylines` in `PostMeta.astro`.

### Redirects

```json
[
  { "source": "/old-about", "destination": "/about", "type": 301 },
  { "source": "/blog", "destination": "/posts", "type": 308 }
]
```

### Page routes

| Route | File | Features demonstrated |
|-------|------|----------------------|
| `/` | `index.astro` | Recent posts, link to feature guide |
| `/feature-guide` | CMS page or dedicated route | Index of all demos + admin paths |
| `/{slug}` | `[slug].astro` | Page layout map, PortableText, sections |
| `/posts` | `posts/index.astro` | `getEmDashCollection`, pagination via `postsPerPage`, cacheHint |
| `/posts/{slug}` | `posts/[slug].astro` | getSeoMeta, Image, terms, bylines, Comments, isPreview, entry.edit |
| `/category/{slug}` | `category/[slug].astro` | getTerm, where filter, hierarchical label |
| `/tag/{slug}` | `tag/[slug].astro` | Flat taxonomy archive |
| `/search` | `search.astro` | LiveSearch, search query param |
| `/showcase/all-fields` | `showcase/[slug].astro` | All field types rendered |
| fallback | `404.astro` | Not found |

**No `getStaticPaths`** on any CMS content route.

Reference: [Querying Content](https://docs.emdashcms.com/guides/querying-content/)

### Page layout wiring

In `[slug].astro`:

```astro
const layouts = {
  "Default": PageDefault,
  "Full Width": PageFullWidth,
  "Sidebar": PageSidebar,
};
const Layout = layouts[page.data.template] ?? PageDefault;
```

Each layout component wraps content in `Base.astro` with different structure (sidebar widget area on `PageSidebar` only).

Reference: [Page Layouts](https://docs.emdashcms.com/guides/page-layouts/)

### Media patterns

- Featured images: `<Image image={post.data.featured_image} />` from `emdash/ui`
- Never use image field as string URL directly
- Showcase collection renders `image` and `file` fields with comments on `MediaValue` shape

Reference: [Media Library](https://docs.emdashcms.com/guides/media-library/)

### Search

- `LiveSearch` in header — collections: `["posts", "pages"]`
- Dedicated `/search` page
- Comment on CSS variables for theming search UI later

### Comments

On `posts/[slug].astro`:

```astro
<Comments collection="posts" contentId={post.data.id} threaded />
<CommentForm collection="posts" contentId={post.data.id} />
```

Note: use `post.data.id` (ULID), not `post.id` (slug).

### Portable Text extras

- Standard `<PortableText value={...} />`
- `HtmlBlock.astro` registered as custom `htmlBlock` component with sanitize-html pattern (from working-with-content guide)
- Comment on `/section`, `/image`, `/code`, `/html` slash commands

### Visual editing & preview

- Spread `{...entry.edit}` and `{...entry.edit.title}` on post/page elements
- Render preview banner when `isPreview === true`
- Comment: preview works via `_preview` token middleware — no special query code needed

Reference: [Querying Content — Preview & Visual Editing](https://docs.emdashcms.com/guides/querying-content/)

### Comment convention (all .astro files)

Top-of-file block comment:

```astro
/**
 * POST DETAIL — /posts/[slug]
 * Features: getEmDashEntry, getSeoMeta, PortableText, Image, getEntryTerms,
 *           Comments, CommentForm, cacheHint, createPublicPageContext, isPreview, entry.edit
 * Admin: Content → Posts
 * Docs: https://docs.emdashcms.com/guides/querying-content/
 * Fork: delete this file + posts collection if client has no blog
 */
```

### docs/SEED-REFERENCE.md

Companion doc mapping each seed section to:

- What it configures
- Which template files consume it
- Link to EmDash guide
- Fork guidance (keep/delete)

### Styling rules

- Demo markup: semantic HTML only (`<article>`, `<nav>`, `<ul>`) — no Tailwind classes
- `global.css`: `@import "tailwindcss";` only
- One comment in Base: `<!-- Apply Tailwind classes when theming a client site -->`
- No `theme.css`, no custom fonts in demo

## Feature → documentation cross-reference

| Feature | Guide | Primary template files |
|---------|-------|------------------------|
| Site settings | [site-settings](https://docs.emdashcms.com/guides/site-settings/) | `site-identity.ts`, `SocialLinks.astro`, `SeoHead.astro` |
| Sections | [sections](https://docs.emdashcms.com/guides/sections/) | seed `sections`, demo pages |
| Page layouts | [page-layouts](https://docs.emdashcms.com/guides/page-layouts/) | `PageDefault/FullWidth/Sidebar.astro`, `[slug].astro` |
| Widgets | [widgets](https://docs.emdashcms.com/guides/widgets/) | `WidgetRenderer.astro`, `PageSidebar.astro`, Base |
| Menus | [menus](https://docs.emdashcms.com/guides/menus/) | `MenuNav.astro`, `SiteHeader.astro` |
| Taxonomies | [taxonomies](https://docs.emdashcms.com/guides/taxonomies/) | archive pages, `PostTerms.astro` |
| Media | [media-library](https://docs.emdashcms.com/guides/media-library/) | posts, showcase |
| Querying | [querying-content](https://docs.emdashcms.com/guides/querying-content/) | all content pages |
| Content admin | [working-with-content](https://docs.emdashcms.com/guides/working-with-content/) | comments, scheduling notes |
| Themes | [creating-themes](https://docs.emdashcms.com/themes/creating-themes/) | overall structure |
| i18n | [internationalization](https://docs.emdashcms.com/guides/internationalization/) | astro.config, LanguageSwitcher stub |

## Out of scope

- Visual design / Tailwind component library
- Custom EmDash plugins
- i18n translated content in seed (en-only; docs for adding locales)
- Cloudflare Images/Stream media providers (comment-only in astro.config)
- Node/SQLite template variant
- Automated test suite (project has no tests; manual verification only)
- RSS feed (optional future addition; mention in SEED-REFERENCE if desired)

## Manual verification

After implementation:

1. `bun dev` — site loads at `http://localhost:4321`
2. Admin at `/_emdash/admin` — settings editable (title, logo, url, SEO)
3. `/sitemap.xml` returns index when `settings.url` is set
4. `/robots.txt` accessible
5. Search returns results for indexed collections
6. Post page shows comments form, terms, bylines where seeded
7. Page with `Full Width` template renders via layout map
8. Widget areas render in sidebar/footer
9. Redirect `/old-about` → `/about` works
10. `resolveSiteIdentity` reflects admin changes after publish

## Implementation order

1. **Spec 1:** config, identity, SEO utils, Base refactor, README/AGENTS rename, global.css import
2. **Spec 2:** seed expansion, components, page routes, comments, SEED-REFERENCE.md
3. Manual verification pass

Next step after spec approval: write implementation plans to `docs/superpowers/plans/` (separate plan per spec).
