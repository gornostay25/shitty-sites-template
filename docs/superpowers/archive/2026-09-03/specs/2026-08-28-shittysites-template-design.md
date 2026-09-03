# ShittySites Template — Design Spec

**Status:** Implemented (archived 2026-09-03) — plans at [`../plans/2026-09-02-shittysites-spec1-foundation.md`](../plans/2026-09-02-shittysites-spec1-foundation.md), [`../plans/2026-09-02-shittysites-spec2-full-demo.md`](../plans/2026-09-02-shittysites-spec2-full-demo.md)  
**Date:** 2026-08-28 (revised 2026-09-02)  
**Template name:** ShittySites Template  
**EmDash version:** `@0.36.0`

### Amendment log

| Date       | Note                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-03 | **Superseded (partial):** Content entry types and byline patch documented separately. See [`./2026-09-03-content-entry-types-design.md`](./2026-09-03-content-entry-types-design.md). |

## Summary

Transform the EmDash Cloudflare starter into **ShittySites Template** — an agency base for rebuilding bad business websites. Not a finished visual design. A **fully wired, minimally styled reference** with inline comments so AI agents (and developers) can fork, delete what a client does not need, and add Tailwind styling.

Core goals:

1. **Common structure** every client site inherits (layout, identity, SEO, sitemap, object cache)
2. **Admin-customizable site identity** via `src/utils/site-identity.ts` and [site settings](https://docs.emdashcms.com/guides/site-settings/)
3. **Full EmDash capability demo** — collections, taxonomies, menus, widgets, sections, page layouts, search, comments, bylines, media, preview, visual editing, **demo plugin blocks**
4. **Tailwind wired but unused** on demo markup (via `@tailwindcss/vite`)
5. **Heavy documentation** in code comments, README, and AGENTS.md

## Re-scope changelog (2026-09-02)

| Topic | Original (Aug 28) | Revised |
|-------|-------------------|---------|
| Starting point | Minimal starter | Replace current **Marketing** template entirely |
| Object cache | Not mentioned | `kvCache({ binding: "CACHE" })` + tuning comments |
| Dark mode | Not mentioned | Demo theme switcher + fork comments for light-only sites |
| EmDash version | Unpinned | Pin `@0.36.0`; document 0.36 behaviour changes |
| Media usage | Not mentioned | Admin Settings workflow (no cron on Cloudflare) |
| Plugins | Out of scope | **In scope:** inline `demo-blocks` native plugin |
| React | (implicit remove with Marketing) | **Keep** `@astrojs/react` wired; demo pages Astro-only |
| Styling | Pure unstyled | Unstyled semantic markup + minimal `light-dark()` tokens for theme demo |

## Context

- **Business model:** Find businesses with poor websites; offer new sites built from this template.
- **Workflow:** Copy repo → strip unused features → style with Tailwind → configure admin settings for client.
- **Runtime:** Cloudflare Workers (D1 + R2 + KV), Astro SSR (`output: "server"`).
- **i18n:** English only in config; docs explain how to add locales ([internationalization guide](https://docs.emdashcms.com/guides/internationalization/)).

## Architecture

### Two implementation specs

| Spec | Scope |
|------|-------|
| **Spec 1 — Foundation** | Rename template, config (D1 + R2 + KV cache), `site-identity`, SEO pipeline, Base layout + dark mode shell, Tailwind shell, docs rename |
| **Spec 2 — Full demo** | Comprehensive seed, components, pages, demo-blocks plugin, comment conventions, feature index |

Spec 2 depends on Spec 1. Each spec should produce a working site when implemented sequentially.

### Approach: Kitchen sink on real routes

Use production-shaped routes (`/posts`, `/search`, `/category/...`) — not isolated `/demo/*` paths. Demo content lives in seed + a `feature-guide` page. Forking agents delete unused routes, seed sections, components, and plugins together.

### Fork model

When adapting for a client:

1. Remove unused collections and content from `seed/seed.json`
2. Delete matching page routes under `src/pages/`
3. Delete orphaned components and plugin directories
4. Remove plugin registration from `astro.config.mjs` if unused
5. Trim menus, widget areas, taxonomies in seed
6. Add Tailwind classes to layout/components
7. Set site title, logo, canonical URL, and SEO defaults in admin (`Settings`)

## File structure

```
src/
├── layouts/
│   ├── Base.astro              # Shell: SEO, header, footer, theme switcher, global.css
│   ├── PageDefault.astro
│   ├── PageFullWidth.astro
│   └── PageSidebar.astro
├── components/
│   ├── SiteHeader.astro
│   ├── SiteFooter.astro
│   ├── SeoHead.astro
│   ├── WidgetRenderer.astro
│   ├── MenuNav.astro
│   ├── SocialLinks.astro
│   ├── PostMeta.astro
│   ├── PostTerms.astro
│   ├── HtmlBlock.astro
│   ├── LanguageSwitcher.astro  # Commented stub — enable when adding locales
├── plugins/
│   └── demo-blocks/
│       ├── index.ts            # demoBlocksPlugin() descriptor + createPlugin()
│       └── astro/
│           ├── index.ts        # export blockComponents (required name)
│           ├── Callout.astro
│           ├── CtaStrip.astro
│           └── Stats.astro
├── utils/
│   ├── site-identity.ts
│   └── seo.ts
├── pages/
│   ├── index.astro
│   ├── [slug].astro
│   ├── posts/index.astro
│   ├── posts/[slug].astro
│   ├── category/[slug].astro
│   ├── tag/[slug].astro
│   ├── search.astro
│   ├── showcase/[slug].astro
│   └── 404.astro
├── styles/global.css           # Tailwind + minimal light-dark tokens
seed/seed.json
docs/SEED-REFERENCE.md
wrangler.jsonc                  # D1 + R2 + KV CACHE binding
```

**Removed from Marketing template:** `tokens.css`, `theme.css`, marketing-blocks plugin, styled block components (Hero, Pricing, FAQ, etc.), `pricing.astro`, `contact.astro`, astro-iconset, Google fonts (unless re-added at fork time).

**Kept from Marketing template:** `@astrojs/react`, `react`, `react-dom` — wired in `astro.config.mjs` for client islands and future native-plugin React admin UI; demo pages stay Astro-only.

## Spec 1 — Foundation

### Template identity

- `package.json` → `emdash.label`: `"ShittySites Template"`
- `seed/seed.json` → `meta.name`: `"ShittySites Template"`
- Dependencies: `emdash@^0.36.0`, `@emdash-cms/cloudflare@^0.36.0`, `@tailwindcss/vite`, `tailwindcss`, `@astrojs/react`, `react`, `react-dom` (keep wired; demo pages are Astro-only)
- Update `README.md` and `AGENTS.md` § "This Template"

### astro.config.mjs

```js
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { d1, r2, kvCache } from "@emdash-cms/cloudflare";
import emdash from "emdash/astro";
import { demoBlocksPlugin } from "./src/plugins/demo-blocks/index.ts";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: { plugins: [tailwindcss()] },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    // Do NOT use prefixDefaultLocale — breaks /_emdash/admin
    // To add locales: locales: ["en", "uk"], fallback: { uk: "en" }
  },
  integrations: [
    react(), // kept for client islands / native plugin React admin UI
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      /**
       * OBJECT CACHE — KV-backed query cache for Cloudflare Workers.
       *
       * Caches content queries, site settings, menus, and taxonomy terms.
       * Admin edits auto-invalidate affected entries. Preview/visual editing
       * bypass the cache.
       *
       * defaultTtl (seconds, default 3600):
       *   Lower (e.g. 300) when scheduled publishing must appear quickly
       *   without waiting for a collection change. Default is fine for most sites.
       *
       * keyPrefix (default "em"):
       *   Change when multiple EmDash sites share one KV namespace
       *   (e.g. keyPrefix: "client-acme") to avoid key collisions.
       *
       * Docs: https://docs.emdashcms.com/deployment/object-cache/
       */
      objectCache: kvCache({
        binding: "CACHE",
        defaultTtl: 3600,
        keyPrefix: "em",
      }),
      // Native plugin — descriptor factory, not a raw { id, entrypoint } object.
      // PT block renderers auto-merge via componentsEntry (no manual type map in pages).
      plugins: [demoBlocksPlugin()],
    }),
  ],
  // fonts: commented with pointer to Astro fonts docs
  devToolbar: { enabled: false },
});
```

### wrangler.jsonc

Add KV namespace alongside existing D1 and R2 bindings:

```jsonc
"kv_namespaces": [
  { "binding": "CACHE", "id": "<namespace-id>" }
]
```

Create locally with `bunx wrangler kv namespace create CACHE`.

Keep D1, R2, LOADER, and the general maintenance cron trigger. **Do not** add `mediaUsageCron` — removed in EmDash 0.36.

Reference: [Object Cache](https://docs.emdashcms.com/deployment/object-cache/), [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)

### site-identity.ts

Replace any starter helper with `resolveSiteIdentity`:

- Input: `Partial<SiteSettings>` from `getSiteSettings()`
- Output: normalized identity object:
  - `siteTitle`, `siteTagline`
  - `siteLogo`, `siteFavicon` (resolved media refs or null)
  - `siteUrl` (canonical base for SEO/sitemap)
  - `social`, `seo` defaults
  - `postsPerPage`, `dateFormat`, `timezone`
- Fallback constants only when admin values are unset
- JSDoc on each field: admin path (`Settings → General`, `Settings → SEO`, etc.)

Reference: [Site Settings guide](https://docs.emdashcms.com/guides/site-settings/)

### SEO pipeline

**Built-in (no custom routes):**

- `/sitemap.xml` and `/sitemap-{collection}.xml` — EmDash auto-generated
- `/robots.txt` — EmDash default or custom via `settings.seo.robotsTxt`

**Requires `settings.url`** in seed and admin for absolute URLs in sitemap and canonical tags.

**Template layer:**

- `src/utils/seo.ts` — wrapper around `getSeoMeta()` from `emdash/seo`
- `src/components/SeoHead.astro` — title, description, canonical, OG, robots
- Content pages pass entry to `getSeoMeta` with `siteTitle`, `siteUrl`, path
- `Base.astro` uses `createPublicPageContext` + `EmDashHead` for plugin page contributions

### Base.astro

- Import `../styles/global.css`
- Call `resolveSiteIdentity(await getSiteSettings())`
- No hardcoded site title or navigation
- Compose `SiteHeader`, `<main><slot /></main>`, `SiteFooter`
- Accept props: `title`, `description`, `image`, `canonical`, `content?`
- **Theme switcher** (Light / Dark / System) in footer — unstyled semantic buttons
- **Inline `<head>` script** reads `theme` cookie and sets `dark`/`light` on `<html>` before paint ([Dark Mode guide](https://docs.emdashcms.com/guides/dark-mode/))

Top-of-file AI comment block:

```astro
/**
 * THEME SWITCHER — optional fork customization
 *
 * Demo includes Light / Dark / System so editors can preview darkVariant images
 * and verify the EmDash Image component scheme switching.
 *
 * Light-only client site:
 *   1. Delete the theme-switcher block and its client <script>
 *   2. Delete the inline <head> cookie script
 *   3. Add class="light" on <html> to pin light scheme
 *   4. Remove darkVariant from image fields in seed if unused
 *
 * Docs: https://docs.emdashcms.com/guides/dark-mode/
 */
```

Comment in markup: `<!-- Apply Tailwind classes when theming a client site -->`

### global.css

```css
@import "tailwindcss";

/* Minimal tokens for theme switcher demo — not a design system */
:root {
  color-scheme: light dark;
  --color-bg: light-dark(#ffffff, #0d0d0d);
  --color-text: light-dark(#1a1a1a, #ededed);
}
:root.light { color-scheme: light; }
:root.dark  { color-scheme: dark; }

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

No `theme.css`, no custom fonts, no component styling in CSS.

### README.md (foundation sections)

- Purpose: ShittySites agency template
- Fork workflow (7 steps — includes plugin removal)
- Dev commands (`bun install`, `bun dev`)
- KV namespace setup (`wrangler kv namespace create CACHE`)
- **Media usage tracking** — one-time admin step (see below)
- Link to feature checklist and EmDash docs
- Note: demo markup is intentionally unstyled; Tailwind is for client theming

### AGENTS.md § "This Template"

- ShittySites purpose and fork rules
- File map (layouts, components, utils, plugins)
- Feature → doc URL cross-reference table (include dark mode, object cache, plugins)
- Rules: SSR only, `entry.id` vs `entry.data.id`, image fields as objects, `cacheHint`, taxonomy name exact match
- Object cache tuning: when to change `defaultTtl` and `keyPrefix`
- i18n: how to add `uk` or other locales; `LiveSearch` locale behaviour (0.36)

## Spec 2 — Full demo

### Seed settings block

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

Logo/favicon via `$media` references when seed media is added; site logo field uses `darkVariant: true`.

### Collections

#### posts

- **Supports:** `drafts`, `revisions`, `preview`, `scheduling`, `search`, `seo`
- **commentsEnabled:** `true`
- **Fields:** `title`, `featured_image` (`options: { darkVariant: true }`), `content` (portableText), `excerpt`
- **Demo content:** 3+ posts including one with bylines, one scheduled, one with SEO overrides, one with featured image dark variant

#### pages

- **urlPattern:** `/{slug}`
- **Supports:** `drafts`, `revisions`, `search`, `seo`
- **Fields:** `title`, `content`, `template` (select: `Default`, `Full Width`, `Sidebar`)
- **Demo content:** `about`, `feature-guide` (master index of all demos + admin paths), page with embedded section via `/section`, page with demo plugin blocks in content

#### showcase

- **Purpose:** One entry demonstrating every field type
- **urlPattern:** `/showcase/{slug}`
- **Fields:** all 16 EmDash field types
- **Single demo entry** slug `all-fields`; image field includes `darkVariant: true`

### Taxonomies

| Name | Type | Collections | Demo |
|------|------|-------------|------|
| `category` | hierarchical | posts | parent + child terms |
| `tag` | flat | posts | several tags |
| `service-area` | flat (custom) | pages | 2–3 terms |

### Menus

**primary** — all item types: custom, collection, page, post, taxonomy, nested children.

**footer** — flat custom + page links.

### Widget areas

**sidebar:** search, categories, recent-posts, tags, archives, content widget, menu widget.

**footer:** content widget, menu widget.

Use `<WidgetArea name="..." />` in layouts; `WidgetRenderer.astro` documents manual rendering alternative.

### Sections

Seed: `hero-centered`, `newsletter-cta`, `feature-callout`. Demo page embeds a section via editor slash command. `feature-guide` or `index.astro` shows `getSection("newsletter-cta")` programmatic render.

### Bylines

Seed 2 byline profiles (one guest). Multi-author credits on one post. Render in `PostMeta.astro`.

### Redirects

```json
[
  { "source": "/old-about", "destination": "/about", "type": 301 },
  { "source": "/blog", "destination": "/posts", "type": 308 }
]
```

### Demo-blocks plugin (native)

Template-local **native** plugin demonstrating Portable Text custom block types. Replaces the Marketing template's `marketing-blocks` plugin (which used the old raw `{ id, entrypoint }` registration and manual `MarketingBlocks.astro` type mapping).

**Why native:** Portable Text block renderers must load at build time via `componentsEntry`. Sandboxed plugins can declare Block Kit editing fields only — they cannot ship Astro renderers. See [Choosing a plugin format](https://docs.emdashcms.com/plugins/creating-plugins/choosing-a-format/) and [Portable Text rendering components](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/).

**File layout:**

```
src/plugins/demo-blocks/
├── index.ts          # demoBlocksPlugin() + createPlugin() + default export
└── astro/
    ├── index.ts      # export const blockComponents = { ... }
    ├── Callout.astro
    ├── CtaStrip.astro
    └── Stats.astro
```

**Descriptor + runtime** (`index.ts`):

```typescript
import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

const id = "demo-blocks";
const version = "0.1.0";
const dir = new URL(".", import.meta.url);

/** Descriptor factory — imported by astro.config.mjs at build time. */
export function demoBlocksPlugin(): PluginDescriptor {
  return {
    id,
    version,
    format: "native",
    entrypoint: new URL("./index.ts", dir).href,
    componentsEntry: new URL("./astro/index.ts", dir).href,
  };
}

/** Runtime — EmDash calls default export at request time. */
export function createPlugin() {
  return definePlugin({
    id,
    version,
    admin: {
      portableTextBlocks: [ /* see block table below */ ],
    },
  });
}

export default createPlugin;
```

**Registration** in `astro.config.mjs`:

```js
import { demoBlocksPlugin } from "./src/plugins/demo-blocks/index.ts";

emdash({ plugins: [demoBlocksPlugin()] });
```

Not a raw object `{ id, version, entrypoint }` — that shape is for legacy/sandboxed registration. Native plugins use a descriptor factory returning `format: "native"`.

**Block types (3):**

| `type` | Label | Block Kit fields | Astro renderer |
|--------|-------|------------------|----------------|
| `demo.callout` | Callout | `title`, `body` (multiline), `variant` (select: info, warning) | `astro/Callout.astro` |
| `demo.cta` | CTA strip | `headline`, `buttonLabel`, `buttonUrl` | `astro/CtaStrip.astro` |
| `demo.stats` | Stats row | repeater: `label`, `value` (max 6) | `astro/Stats.astro` |

**Site-side rendering** (`astro/index.ts`):

```typescript
import Callout from "./Callout.astro";
import CtaStrip from "./CtaStrip.astro";
import Stats from "./Stats.astro";

// Export name must be `blockComponents`
export const blockComponents = {
  "demo.callout": Callout,
  "demo.cta": CtaStrip,
  "demo.stats": Stats,
};
```

EmDash merges `blockComponents` into `<PortableText />` automatically — pages do **not** import plugin block types manually. Site pages only pass site-specific overrides (e.g. `htmlBlock`):

```astro
import { PortableText } from "emdash/ui";
import HtmlBlock from "../components/HtmlBlock.astro";

<PortableText value={content} components={{ type: { htmlBlock: HtmlBlock } }} />
```

User-provided `components.type` entries take precedence over plugin defaults.

**Plugin file header comment** (AI fork guide):

```typescript
/**
 * DEMO BLOCKS — native plugin (descriptor + createPlugin in one file)
 *
 * Fork — client does not need custom blocks:
 *   1. Remove demoBlocksPlugin() from astro.config.mjs plugins array
 *   2. Delete src/plugins/demo-blocks/
 *
 * Fork — keep blocks, restyle:
 *   Edit src/plugins/demo-blocks/astro/*.astro; add Tailwind classes there.
 *
 * Docs: https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/
 * PT renderers: https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/
 * Block Kit: https://docs.emdashcms.com/plugins/creating-plugins/block-kit/
 */
```

`feature-guide` page seed content includes at least one of each block type.

**Constraints** (document in plugin comments):

- Block Kit has no object groups — flatten nested shapes to sibling fields
- Repeater sub-fields are scalar only
- No media picker in block modal yet — use image fields on collections or `/image` slash command for media
- Plugin `id` must match `/^[a-z][a-z0-9_-]*$/` — use `demo-blocks`, not scoped names

Reference: [Your first native plugin](https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/), [Portable Text rendering components](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/), [Installing plugins](https://docs.emdashcms.com/plugins/installing/)

### Page routes

| Route | File | Features demonstrated |
|-------|------|----------------------|
| `/` | `index.astro` | Recent posts, link to feature guide |
| `/feature-guide` | CMS page via `[slug].astro` | Index of all demos + admin paths + demo blocks |
| `/{slug}` | `[slug].astro` | Page layout map, PortableText (+ auto plugin blocks), sections |
| `/posts` | `posts/index.astro` | pagination, cacheHint |
| `/posts/{slug}` | `posts/[slug].astro` | Image + darkVariant, Comments, bylines, preview |
| `/category/{slug}` | `category/[slug].astro` | hierarchical taxonomy |
| `/tag/{slug}` | `tag/[slug].astro` | flat taxonomy |
| `/search` | `search.astro` | LiveSearch, query param |
| `/showcase/all-fields` | `showcase/[slug].astro` | all field types |
| fallback | `404.astro` | not found |

**No `getStaticPaths`** on CMS content routes.

### Page layout wiring

Layout map in `[slug].astro`: `Default` → `PageDefault`, `Full Width` → `PageFullWidth`, `Sidebar` → `PageSidebar`.

### Media patterns

- Featured images: `<Image image={post.data.featured_image} />` from `emdash/ui`
- Image fields with `darkVariant: true` — `Image` renders both; scheme follows `<html>` class or `prefers-color-scheme`
- Never treat image fields as string URLs

### Search

- `LiveSearch` in header — `collections={["posts", "pages"]}`
- Dedicated `/search` page
- Comment: since 0.36, `LiveSearch` scopes to `Astro.currentLocale` when i18n is configured; pass `locale={null}` to search all locales

### Comments

```astro
<Comments collection="posts" contentId={post.data.id} threaded />
<CommentForm collection="posts" contentId={post.data.id} />
```

Use `post.data.id` (ULID), not `post.id` (slug).

### Portable Text extras

- `<PortableText />` with site overrides only (`htmlBlock`); plugin blocks auto-merge via `componentsEntry`
- `HtmlBlock.astro` for custom `htmlBlock` component
- Comment on `/section`, `/image`, `/code`, `/html` slash commands

### Visual editing & preview

- Spread `{...entry.edit}` on editable elements
- Preview banner when `isPreview === true`

### Media usage tracking (EmDash 0.36)

**What it is:** The admin Media Library **Used in** panel lists which content entries reference a file — helps editors know whether a file is safe to delete.

**How to enable (one-time, after deploy):**

1. Open **Settings → Media usage tracking** in admin
2. Click **Enable tracking** and confirm
3. **Keep that browser tab open** until status shows **Ready**
4. If you close the tab early, return to the same page — indexing resumes from saved progress

**What changed in 0.36:** Cloudflare sites no longer use a background cron (`mediaUsageCron`) for this. There is no dedicated media cron trigger in `wrangler.jsonc`. The general maintenance cron stays unchanged.

**Template responsibility:** Document in README and SEED-REFERENCE. The template does not automate activation. Sites work without it; only the **Used in** lists stay empty until enabled.

**Note:** Once enabled, tracking cannot be turned off. The list covers EmDash content references only — not custom code or external sites.

Reference: [Media Library — Used in](https://docs.emdashcms.com/guides/media-library/)

### Comment convention (all .astro files)

Top-of-file block comment listing route, features, admin path, docs URL, fork guidance.

### docs/SEED-REFERENCE.md

Map each seed section to: what it configures, consuming template files, EmDash guide link, fork guidance (keep/delete). Include object cache, dark mode, demo-blocks plugin, media usage.

### Styling rules

- Demo markup: semantic HTML only — **no Tailwind utility classes** on template markup
- `global.css`: Tailwind import + minimal `light-dark()` tokens for theme demo only
- Block renderers (`blocks/*.astro`): semantic `<aside>`, `<section>`, `<dl>` — unstyled
- No gradients, icon tiles, marketing CSS, or Google fonts in demo

## Feature → documentation cross-reference

| Feature | Guide | Primary template files |
|---------|-------|------------------------|
| Site settings | [site-settings](https://docs.emdashcms.com/guides/site-settings/) | `site-identity.ts`, `SocialLinks.astro`, `SeoHead.astro` |
| Object cache | [object-cache](https://docs.emdashcms.com/deployment/object-cache/) | `astro.config.mjs`, `wrangler.jsonc` |
| Dark mode | [dark-mode](https://docs.emdashcms.com/guides/dark-mode/) | `Base.astro`, `global.css`, image fields in seed |
| Plugin blocks | [your-first-native-plugin](https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/) | `src/plugins/demo-blocks/`, `astro/index.ts` (`blockComponents`) |
| Sections | [sections](https://docs.emdashcms.com/guides/sections/) | seed `sections`, demo pages |
| Page layouts | [page-layouts](https://docs.emdashcms.com/guides/page-layouts/) | `PageDefault/FullWidth/Sidebar.astro`, `[slug].astro` |
| Widgets | [widgets](https://docs.emdashcms.com/guides/widgets/) | `WidgetRenderer.astro`, `PageSidebar.astro` |
| Menus | [menus](https://docs.emdashcms.com/guides/menus/) | `MenuNav.astro`, `SiteHeader.astro` |
| Taxonomies | [taxonomies](https://docs.emdashcms.com/guides/taxonomies/) | archive pages, `PostTerms.astro` |
| Media | [media-library](https://docs.emdashcms.com/guides/media-library/) | posts, showcase, media usage settings |
| Querying | [querying-content](https://docs.emdashcms.com/guides/querying-content/) | all content pages |
| i18n | [internationalization](https://docs.emdashcms.com/guides/internationalization/) | `astro.config.mjs`, `LanguageSwitcher` stub |

## Out of scope

- Visual design / Tailwind component library (client adds at fork time)
- Publishing demo-blocks to the plugin registry (inline template plugin only)
- i18n translated content in seed (en-only; docs for adding locales)
- Cloudflare Images/Stream media providers (comment-only in astro.config)
- Node/SQLite template variant
- Automated test suite (manual verification only)
- RSS feed (optional future; mention in SEED-REFERENCE if desired)

## Manual verification

After implementation:

1. `bun dev` — site loads at `http://localhost:4321`
2. Admin at `/_emdash/admin` — settings editable
3. `/sitemap.xml` returns index when `settings.url` is set
4. `/robots.txt` accessible
5. Search returns results
6. Post page: comments, terms, bylines, darkVariant image swaps with theme
7. Page with `Full Width` template renders via layout map
8. Widget areas render in sidebar/footer
9. Redirect `/old-about` → `/about` works
10. `resolveSiteIdentity` reflects admin changes after publish
11. KV binding present — no startup error for missing `CACHE`
12. Theme switcher: Light / Dark / System toggles `<html>` class; System clears cookie
13. `/feature-guide` renders demo.callout, demo.cta, demo.stats blocks from seed content
14. Admin editor: slash menu shows Demo Callout, CTA strip, Stats row block types

## Implementation order

1. **Spec 1:** strip Marketing template, config + KV, identity, SEO, Base + theme shell, global.css, README/AGENTS
2. **Spec 2:** seed expansion, demo-blocks plugin + renderers, page routes, SEED-REFERENCE.md
3. Manual verification pass

Next step after spec approval: write implementation plans to `docs/superpowers/plans/` (separate plan per spec).
