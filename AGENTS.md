This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
bun dev              # Start the Astro dev server
bunx emdash types      # Regenerate TypeScript types from a running site
```

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, D1, R2, KV object cache                  |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                           |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `src/assets/`            | **Preferred** — import in components; Astro optimizes at build time (`import img from "../assets/…"`) |
| `public/`                | Fallback only — fixed URL, no processing (favicons, `robots.txt`, legacy PDFs) |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/types/content.ts`   | Shared type aliases (`PageTemplate`) — not generated                               |
| `patches/emdash@0.36.0.patch` | Adds `byline` to type generator until upstream EmDash fix                     |
| `src/layouts/Base.astro` | Site shell: SEO, header, footer, plugin page contributions |
| `src/components/`        | SiteHeader, SiteFooter, SeoHead, MenuNav, SocialLinks      |
| `src/utils/site-identity.ts` | `resolveSiteIdentity()` — admin settings → template props |
| `src/utils/seo.ts`         | `buildContentSeo()` / `buildStaticPageSeo()` wrappers      |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Documentation

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp`. When you need to verify an API, hook, config option, field type, or pattern, call `search_docs` against the live documentation rather than relying on training-data recall. The docs reflect current behaviour; assumptions may not.

This template ships with `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json` so Claude Code, Cursor, and VS Code auto-discover the docs server. Other tools (OpenCode, Windsurf, etc.) need a manual one-time setup -- see [docs.emdashcms.com/docs-mcp](https://docs.emdashcms.com/docs-mcp).

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- Always call `Astro.cache.set(cacheHint)` on pages that query content.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).
- `emdash-env.d.ts` is auto-generated — never hand-edit. Regenerates on dev server start.
- `entry.data.byline` and `entry.data.bylines` are typed via `patches/emdash@0.36.0.patch` (EmDash 0.36 generator omits `byline`). Remove the patch when upstream ships the fix.
- Use `PageTemplate` from `src/types/content.ts` for page layout map keys.
- **Static assets** — prefer `src/assets/` (import in `.astro`/`.tsx`; Astro optimizes and hashes). CMS images: `<Image image={...} />`. Use `public/` only when a fixed root URL is required (`/favicon.ico`, unprocessed PDFs).

## ShittySites Template

Agency base for rebuilding client sites on EmDash + Cloudflare. Every route is server-rendered. Demo markup is unstyled on purpose — Tailwind is wired in `src/styles/global.css` for client theming.

**Fork rules:** delete unused seed sections, matching `src/pages/` routes, and orphaned components together. Set site title, logo, URL, and SEO in admin **Settings** before deploy.

### File map

| Path | Purpose |
|------|---------|
| `src/layouts/Base.astro` | Site shell: SEO, header, footer, plugin page contributions |
| `src/components/SiteHeader.astro` | Logo, primary menu, LiveSearch |
| `src/components/SiteFooter.astro` | Footer widgets, footer menu, social links |
| `src/components/SeoHead.astro` | Title, description, canonical, OG, Twitter meta |
| `src/components/MenuNav.astro` | Flat + nested menu renderer |
| `src/components/SocialLinks.astro` | Social handles from site settings |
| `src/utils/site-identity.ts` | `resolveSiteIdentity()` — admin settings → template props |
| `src/utils/seo.ts` | `buildContentSeo()` / `buildStaticPageSeo()` wrappers |
| `src/types/content.ts` | Shared type aliases (`PageTemplate`) |
| `seed/seed.json` | Schema + demo content (collections, taxonomies, menus, widgets) |

### Feature → documentation

| Feature | Guide | Primary files |
|---------|-------|---------------|
| Site settings | [site-settings](https://docs.emdashcms.com/guides/site-settings/) | `site-identity.ts`, `SocialLinks.astro`, `SeoHead.astro` |
| Menus | [menus](https://docs.emdashcms.com/guides/menus/) | `MenuNav.astro`, `SiteHeader.astro` |
| Widgets | [widgets](https://docs.emdashcms.com/guides/widgets/) | `SiteFooter.astro` |
| Taxonomies | [taxonomies](https://docs.emdashcms.com/guides/taxonomies/) | archive pages |
| Querying | [querying-content](https://docs.emdashcms.com/guides/querying-content/) | all content pages |
| SEO / sitemap | [site-settings](https://docs.emdashcms.com/guides/site-settings/) | `seo.ts`, `SeoHead.astro`, `Base.astro` |
| Search | [search](https://docs.emdashcms.com/guides/search/) | `SiteHeader.astro` (Spec 2 wires LiveSearch) |
| Dark mode | [dark-mode](https://docs.emdashcms.com/guides/dark-mode/) | `Base.astro`, `global.css` |
| Object cache | [object-cache](https://docs.emdashcms.com/deployment/object-cache/) | `astro.config.mjs`, `wrangler.jsonc` |
| Native plugins | [creating-native-plugins](https://docs.emdashcms.com/plugins/creating-native-plugins/) | Spec 2: `src/plugins/demo-blocks/` |
| Themes | [creating-themes](https://docs.emdashcms.com/themes/creating-themes/) | overall structure |
| i18n | [internationalization](https://docs.emdashcms.com/guides/internationalization/) | `astro.config.mjs` |

### i18n — adding locales

Currently English only in `astro.config.mjs`:

```js
i18n: {
  defaultLocale: "en",
  locales: ["en"],
},
```

To add Ukrainian (example):

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "uk"],
  fallback: { uk: "en" },
  // NEVER set prefixDefaultLocale: true — breaks /_emdash/admin
},
```

See [internationalization guide](https://docs.emdashcms.com/guides/internationalization/) for translated content and menu locales.

### Pages

| Page        | Path               | What it shows                    |
| ----------- | ------------------ | -------------------------------- |
| Home        | `/`                | Recent posts list                |
| All posts   | `/posts`           | Post list                        |
| Post detail | `/posts/[slug]`    | Post content + sidebar widgets   |
| Page        | `/[slug]`          | Static page (e.g. `/about`)      |
| Category    | `/category/[slug]` | Posts filtered by category       |
| Tag         | `/tag/[slug]`      | Posts filtered by tag            |

### Object cache tuning

In `astro.config.mjs`, `objectCache: kvCache({ ... })`:

- **`defaultTtl`** (seconds, default 3600) — lower when scheduled publishing must appear quickly without waiting for a collection change
- **`keyPrefix`** (default `"em"`) — change when multiple EmDash sites share one KV namespace

Requires `CACHE` KV binding in `wrangler.jsonc`. Create with `bunx wrangler kv namespace create CACHE`.

### Media usage tracking

One-time admin activation at **Settings → Media usage tracking**. Keep the tab open until Ready. No `mediaUsageCron` in wrangler.

### LiveSearch locale (0.36)

`LiveSearch` scopes results to the current locale when i18n is enabled; omit locale to search all locales.

### Schema (current seed)

- `posts`: `title`, `featured_image` (darkVariant), `content`, `excerpt` — comments enabled
- `pages`: `title`, `content`, `template` (Default / Full Width / Sidebar)
- `showcase`: all 16 field types — dev reference only
- Taxonomies: `category`, `tag`, `service-area`
- Menus: `primary`, `footer`
- Widget areas: `sidebar`, `footer`
- Native plugin: `demo-blocks` (`demo.callout`, `demo.cta`, `demo.stats`)

See `docs/SEED-REFERENCE.md` and `/feature-guide`.
