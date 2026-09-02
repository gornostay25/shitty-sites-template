# ShittySites Template

Agency base template for client websites built on [EmDash](https://github.com/emdash-cms/emdash) and Cloudflare Workers (D1 + R2). Fork this repo, strip what the client does not need, style with Tailwind, and configure site identity in the admin panel.

**Not a finished design.** Demo markup is intentionally unstyled semantic HTML. Tailwind is wired in `src/styles/global.css` for client theming.

## What's Included (Foundation)

- Admin-driven site identity (`src/utils/site-identity.ts`)
- SEO pipeline (`src/utils/seo.ts`, `src/components/SeoHead.astro`)
- Base layout shell with header, footer, search, plugin hooks
- Built-in `/sitemap.xml` and `/robots.txt` (requires Site URL in admin)
- i18n configured for English only — see [AGENTS.md](./AGENTS.md) to add locales
- Posts, pages, categories, tags with minimal demo content

Full EmDash capability demo: widgets, sections, comments, page layouts, showcase collection, taxonomies, bylines, redirects. See [docs/SEED-REFERENCE.md](./docs/SEED-REFERENCE.md) and [/feature-guide](/feature-guide) after seed applies.

## Fork Workflow

When adapting for a client:

1. Remove unused collections and content from `seed/seed.json`
2. Delete matching page routes under `src/pages/`
3. Delete orphaned components
4. Trim menus, widget areas, and taxonomies in seed
5. Add Tailwind classes to layout/components
6. Set site title, logo, canonical URL, and SEO defaults in admin (**Settings**)

## Local Development

```bash
bun install
bun dev
```

Admin UI: `http://localhost:4321/_emdash/admin`

```bash
bun run typecheck   # Astro type check
bun deploy          # Build + deploy to Cloudflare Workers
```

## SEO & Sitemap

Set **Settings → General → Site URL** (e.g. `http://localhost:4321` in dev, production URL when deployed). EmDash generates:

- `/sitemap.xml` — sitemap index
- `/sitemap-{collection}.xml` — per-collection sitemaps
- `/robots.txt` — default or custom via Settings → SEO

Canonical URLs and Open Graph tags use `resolveSiteIdentity()` and `getSeoMeta()`.

## Pages

| Page | Route |
|------|-------|
| Homepage | `/` |
| All posts | `/posts` |
| Single post | `/posts/:slug` |
| Category archive | `/category/:slug` |
| Tag archive | `/tag/:slug` |
| Static pages | `/:slug` |
| 404 | fallback |

## Infrastructure

- **Runtime:** Cloudflare Workers
- **Database:** D1
- **Storage:** R2
- **Framework:** Astro 7 with `@astrojs/cloudflare`
- **CSS:** Tailwind CSS 4 (`@tailwindcss/vite`) — imported, not used on demo markup

## Documentation

- [Seed reference](./docs/SEED-REFERENCE.md) — seed sections → template files + fork guidance
- [EmDash docs](https://docs.emdashcms.com/) — live reference via MCP at `https://docs.emdashcms.com/mcp`
- [AGENTS.md](./AGENTS.md) — AI agent guide for this template
