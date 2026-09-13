# ShittySites Template

Agency base template for client websites built on [EmDash](https://github.com/emdash-cms/emdash) and Cloudflare Workers (D1 + R2 + KV). Fork this repo, strip what the client does not need, style with Tailwind, and configure site identity in the admin panel.

**Not a finished design.** Demo markup is intentionally unstyled semantic HTML. Tailwind is wired in `src/styles/global.css` for client theming.

Design spec: [docs/superpowers/archive/2026-09-03/specs/2026-08-28-shittysites-template-design.md](./docs/superpowers/archive/2026-09-03/specs/2026-08-28-shittysites-template-design.md)

## What's Included (Spec 1 Foundation)

- Admin-driven site identity (`src/utils/site-identity.ts`)
- SEO pipeline (`src/utils/seo.ts`, `src/components/SeoHead.astro`)
- Base layout with header, footer, dark-mode theme switcher demo
- KV object cache (`shittysites-template-CACHE` + SESSION bindings in `wrangler.jsonc`)
- Built-in `/sitemap.xml` and `/robots.txt` (requires Site URL in admin)
- i18n demo: English + Ukrainian (`/uk/…`) — see below, [AGENTS.md](./AGENTS.md), and [SEED-REFERENCE.md](./docs/SEED-REFERENCE.md#internationalization)

### i18n (English + Ukrainian)

EmDash uses **one page template set** with `locale: Astro.currentLocale` — not duplicate files under `src/pages/uk/`.

| Setting | Value |
|---------|--------|
| Default locale | `en` — unprefixed URLs (`/`, `/posts/…`) |
| Other locale | `uk` — prefixed URLs (`/uk/`, `/uk/pro-nas`) |
| Fallback | `uk → en` for missing translations |
| Required routing | `routing: { fallbackType: "rewrite" }` in `astro.config.mjs` |
| Forbidden | `prefixDefaultLocale: true` — breaks `/_emdash/admin` |

Root `[slug].astro` guards locale codes (`src/utils/i18n/locales.ts`); `/uk/` rewrites to home via `Astro.rewrite("/")`. 404 redirects use `notFoundPath()` for locale-aware paths.

Design: [docs/superpowers/archive/2026-09-13/specs/2026-09-13-post-backport-fixes-design.md](./docs/superpowers/archive/2026-09-13/specs/2026-09-13-post-backport-fixes-design.md)

Spec 2 adds full demo routes, seed content, widgets, search, and the `demo-blocks` plugin. See [docs/SEED-REFERENCE.md](./docs/SEED-REFERENCE.md) when available.

### Hub Feedback widget

Visual feedback widget for Shitty Hub. Set credentials in `.env`:

```
HUB_API_KEY=your-hub-api-key
HUB_SITE_ID=your-site-id
```

`astro.config.mjs` bakes them into the client bundle via `vite.define` (required for the React island). Restart `bun dev` after changing `HUB_API_KEY` or `HUB_SITE_ID` in `.env`. Enable on public pages in `src/layouts/Base.astro`:

```astro
import HubFeedback from "../hub-feedback/astro/HubFeedback.astro";
<!-- ... -->
<HubFeedback />
```

Remove `<HubFeedback />` (and its import) to disable the widget.

- Widget: `src/hub-feedback/`
- API: `https://shitty-hub.gornostay25.dev/support`
- Archived spec: [docs/superpowers/archive/2026-09-12/specs/2026-09-07-hub-feedback-vite-plugin-design.md](./docs/superpowers/archive/2026-09-12/specs/2026-09-07-hub-feedback-vite-plugin-design.md)

## Fork Workflow

When adapting for a client:

1. Remove unused collections and content from `seed/seed.json`
2. Delete matching page routes under `src/pages/`
3. Delete orphaned components and plugin directories
4. Remove plugin registration from `astro.config.mjs` if unused
5. Trim menus, widget areas, and taxonomies in seed
6. Add Tailwind classes to layout/components
7. Set site title, logo, canonical URL, and SEO defaults in admin (**Settings**)

## Local Development

```bash
bun install
bun dev
```

Admin UI: `http://localhost:4321/_emdash/admin`

### Fresh database + demo content

Schema applies on first request when the database is empty. **Demo content (posts, pages, showcase) is separate** — apply it once via dev bypass:

```
http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin&content=1
```

If routes like `/about` or `/showcase/all-fields` redirect to `/404`, content was not seeded. Reset and re-apply:

```bash
# Stop the dev server, then:
rm -rf .wrangler/state
bun dev
# Open dev bypass URL above in the browser (must return 200, not 500)
```

See [SEED-REFERENCE.md](./docs/SEED-REFERENCE.md) for troubleshooting.

### Static files (`public/`)

Files in `public/` are copied as-is to the site root — no bundling, no hashing.

| File | URL |
|------|-----|
| `public/hero-visual.svg` | `/hero-visual.svg` |
| `public/hero-visual-alt.svg` | `/hero-visual-alt.svg` |

Use `public/` for assets that must keep a fixed URL (favicons, `robots.txt` overrides, theme SVGs, PDFs linked from HTML). Reference them with root-relative paths:

```astro
<img src="/hero-visual.svg" alt="Demo illustration" />
```

For images processed by Astro (optimization, imports), use `src/assets/` instead. CMS media belongs in the EmDash media library (`<Image image={...} />`), not in `public/`.

```bash
bun run typecheck   # Astro type check
bun run deploy      # Build + deploy (template wrangler.jsonc)
```

### Seed media bootstrap

WebP assets live in `seed/media/` (committed). CLI seed and upload scripts read that path directly:

```bash
bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir seed/media
bun run seed:d1-export
```

After dev bypass or D1 import, upload images to R2:

```bash
bun run seed:media-upload:local   # dev
bun run seed:media-upload         # production
```

See [docs/SEED-REFERENCE.md](./docs/SEED-REFERENCE.md) and [docs/CLOUDFLARE-DEPLOYMENT.md](./docs/CLOUDFLARE-DEPLOYMENT.md).

## Production deploy

1. Copy `wrangler.jsonc` → `wrangler.prod.jsonc` (gitignored)
2. Provision D1, R2, KV; paste IDs into `wrangler.prod.jsonc` (**no `preview_id`**)
3. Bootstrap content via CLI seed + D1 import (see [CLOUDFLARE-DEPLOYMENT.md](./docs/CLOUDFLARE-DEPLOYMENT.md))
4. Deploy with swap pattern:

```bash
bun run deploy:prod
# cp wrangler.prod.jsonc wrangler.jsonc && build && deploy && git restore wrangler.jsonc
```

**Never** use `wrangler deploy --config wrangler.prod.jsonc` — use swap instead.

## Cloudflare KV (Object Cache)

Template `wrangler.jsonc` declares binding names only:

- `shittysites-template-CACHE` — EmDash object cache
- `shittysites-template-SESSION` — Astro sessions (`sessionKVBindingName` in `astro.config.mjs`)

Create namespaces once per client and paste `id` values into `wrangler.prod.jsonc`:

```bash
bunx wrangler kv namespace create shittysites-template-CACHE
bunx wrangler kv namespace create shittysites-template-SESSION
```

Object cache tuning in `astro.config.mjs`: `defaultTtl`, `keyPrefix`.

Docs: [Object Cache](https://docs.emdashcms.com/deployment/object-cache/) · [CLOUDFLARE-DEPLOYMENT.md](./docs/CLOUDFLARE-DEPLOYMENT.md)

## Media Usage Tracking

EmDash 0.36 tracks where media files are used via an **admin Settings workflow** — not a cron job.

1. Open **Settings → Media usage tracking** in the admin
2. Click **Activate** (or equivalent) to start the scan
3. Keep the tab open until status shows **Ready**

Do not add `mediaUsageCron` to `wrangler.jsonc` or astro config.

## SEO & Sitemap

Set **Settings → General → Site URL** (e.g. `http://localhost:4321` in dev, production URL when deployed). EmDash generates:

- `/sitemap.xml` — sitemap index
- `/sitemap-{collection}.xml` — per-collection sitemaps
- `/robots.txt` — default or custom via Settings → SEO

Canonical URLs and Open Graph tags use `resolveSiteIdentity()` and `getSeoMeta()`.

## Infrastructure

- **Runtime:** Cloudflare Workers
- **Database:** D1
- **Storage:** R2
- **Cache:** KV (`shittysites-template-CACHE` + SESSION)
- **Framework:** Astro 7 with `@astrojs/cloudflare`
- **CSS:** Tailwind CSS 4 (`@tailwindcss/vite`) — imported, not used on demo markup
- **Feedback widget:** `@fasterfixes/core`, `@floating-ui/react`, `modern-screenshot` (Hub Feedback plugin)

## Documentation

- [EmDash docs](https://docs.emdashcms.com/) — live reference via MCP at `https://docs.emdashcms.com/mcp`
- [AGENTS.md](./AGENTS.md) — AI agent guide for this template
- [Design spec](./docs/superpowers/archive/2026-09-03/specs/2026-08-28-shittysites-template-design.md)
