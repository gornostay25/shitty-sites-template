# ShittySites Template

Agency base template for client websites built on [EmDash](https://github.com/emdash-cms/emdash) and Cloudflare Workers (D1 + R2 + KV). Fork this repo, strip what the client does not need, style with Tailwind, and configure site identity in the admin panel.

**Not a finished design.** Demo markup is intentionally unstyled semantic HTML. Tailwind is wired in `src/styles/global.css` for client theming.

Design spec: [docs/superpowers/archive/2026-09-03/specs/2026-08-28-shittysites-template-design.md](./docs/superpowers/archive/2026-09-03/specs/2026-08-28-shittysites-template-design.md)

## What's Included (Spec 1 Foundation)

- Admin-driven site identity (`src/utils/site-identity.ts`)
- SEO pipeline (`src/utils/seo.ts`, `src/components/SeoHead.astro`)
- Base layout with header, footer, dark-mode theme switcher demo
- KV object cache (`objectCache: kvCache({ binding: "CACHE" })` in `astro.config.mjs`)
- Built-in `/sitemap.xml` and `/robots.txt` (requires Site URL in admin)
- i18n configured for English only — see [AGENTS.md](./AGENTS.md) to add locales

Spec 2 adds full demo routes, seed content, widgets, search, and the `demo-blocks` plugin. See [docs/SEED-REFERENCE.md](./docs/SEED-REFERENCE.md) when available.

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

Files in `public/` are copied as-is to the site root — no bundling, no hashing. Use for assets that must keep a fixed URL (favicons, `robots.txt`, PDFs). For optimized images use `src/assets/`; for CMS media use `<Image image={...} />`.

```bash
bun run typecheck   # Astro type check
bun deploy          # Build + deploy to Cloudflare Workers
```

## Production deploy (Cloudflare)

First-time production setup for **Bar of Legends** (large seed + KV object cache) does **not** reliably complete through the admin setup wizard alone. Use the documented workaround: local `emdash seed` → SQL dump → `wrangler d1 execute`.

See **[docs/CLOUDFLARE-DEPLOYMENT.md](./docs/CLOUDFLARE-DEPLOYMENT.md)** for the full runbook. Production content bootstrap scripts:

| Command | Purpose |
|---------|---------|
| `bun run seed:d1-export` | SQLite seed → D1-safe SQL (FTS5 fixes) |
| `bun run seed:media-upload` | Upload `.emdash/uploads/` to R2 + patch D1 image fields |

Also covers: setup wizard KV 429, binding IDs, `import.meta.url` Workers fix, recovery, `$media.file` caveat.

## Cloudflare KV (Object Cache)

This site uses `bar-of-legends-CACHE` (object cache) and `bar-of-legends-SESSION` (Astro sessions). Create namespaces once and copy `id`s into `wrangler.jsonc`:

```bash
bunx wrangler kv namespace create bar-of-legends-CACHE
bunx wrangler kv namespace create bar-of-legends-SESSION
```

Match `sessionKVBindingName: "bar-of-legends-SESSION"` in `astro.config.mjs` and `objectCache: kvCache({ binding: "bar-of-legends-CACHE" })`.

Object cache tuning in `astro.config.mjs`: `defaultTtl`, `keyPrefix`. Docs: [Object Cache](https://docs.emdashcms.com/deployment/object-cache/)

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
- **Cache:** KV (`bar-of-legends-CACHE`, `bar-of-legends-SESSION`)
- **Framework:** Astro 7 with `@astrojs/cloudflare`
- **Icons (bol-theme):** `@lucide/astro` via `src/plugins/bol-theme/astro/icons/Icon.astro`
- **CSS:** Tailwind CSS 4 (`@tailwindcss/vite`) — imported, not used on demo markup

## Documentation

- [EmDash docs](https://docs.emdashcms.com/) — live reference via MCP at `https://docs.emdashcms.com/mcp`
- [AGENTS.md](./AGENTS.md) — AI agent guide for this template
- [Cloudflare deployment runbook](./docs/CLOUDFLARE-DEPLOYMENT.md) — production seed/migration workarounds
- [Seed reference](./docs/SEED-REFERENCE.md)
- [Design spec](./docs/superpowers/archive/2026-09-03/specs/2026-08-28-shittysites-template-design.md)
