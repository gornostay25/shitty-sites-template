This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
bun dev                           # Start the Astro dev server
bunx emdash types                 # Regenerate TypeScript types from a running site
bun run seed:d1-export            # Local SQLite → D1-safe SQL (production import)
bun run seed:media-upload:local   # Seed WebP → local R2 + local D1 (dev, after bun dev)
bun run seed:media-upload         # Seed WebP → remote R2 + remote D1 (production)
bun run deploy:prod               # Swap wrangler.prod.jsonc → build → deploy → restore
```

Production bootstrap: `docs/CLOUDFLARE-DEPLOYMENT.md`.

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File | Purpose |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs` | Astro config with `emdash()` integration, D1, R2, KV object cache, i18n, hub-feedback |
| `src/live.config.ts` | EmDash loader registration (boilerplate -- don't modify) |
| `seed/seed.json` | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `seed/media/` | Committed WebP sources for `$media.file` refs (upload via `seed:media-upload*`) |
| `scripts/d1-export-seed-db.ts` | D1-safe SQL export after local `emdash seed` |
| `scripts/upload-seed-media.ts` | R2 upload + D1 media/content patch for `$media.file` (`--local` or `--remote`) |
| `src/plugins/bol-theme/` | Bar of Legends theme plugin (blocks, routes, i18n, venue settings) |
| `src/hub-feedback/` | Optional Shitty Hub feedback widget (env-driven React island) |
| `src/layouts/Base.astro` | Site shell: SEO, header, footer, hub-feedback |
| `emdash-env.d.ts` | Generated types for collections (auto-regenerated on dev server start) |
| `patches/emdash@0.38.0.patch` | Adds `byline` to type generator until upstream EmDash fix |

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- CMS media fields resolve to **`ImageValue`** from `emdash` (see collection types in `emdash-env.d.ts`). Use `<Image image={…} />` from `"emdash/ui"`. PT types (e.g. `BolHeroNode.backgroundImage`) use `ImageValue | string` when a legacy URL string may appear.
- Public interactivity: no global layout script boot — co-located Astro `<script>` in imported components, or React islands with `client:*` (e.g. `VenueMap` + `client:visible`). Do not add hoisted `<script>` inside PT block `.astro` files.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- Always call `Astro.cache.set(cacheHint)` on pages that query content.
- Taxonomy names in queries must match the seed's `"name"` field exactly.
- `emdash-env.d.ts` is auto-generated — never hand-edit.
- Native plugins: `import.meta.url` only **inside** plugin factory functions (Workers deploy bug).
- PT blocks receive `Astro.props.node` — use `getPtNode()` helper; no React islands in PT `components` map.
- Production deploy: `docs/CLOUDFLARE-DEPLOYMENT.md` — swap `wrangler.prod.jsonc`, never `--config`.

### i18n (`en` + `hu` + `de`)

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "hu", "de"],
  fallback: { hu: "en", de: "en" },
  routing: { fallbackType: "rewrite" }, // required — single-template EmDash, no src/pages/hu|de/
  // NEVER set prefixDefaultLocale: true — breaks /_emdash/admin
},
```

- Locale routes: `/hu/…`, `/de/…` (default `en` unprefixed)
- Helpers: `src/plugins/bol-theme/utils/i18n/locales.ts`, `notFoundPath()`, `getUiStrings()`
- Content queries: pass `locale: Astro.currentLocale` on index and prefixed locale routes. On `[slug].astro` before redirect/rewrite, derive locale with `getRequestLocale(Astro.originPathname)` when `currentLocale` may still be `en`.
- Seed rules: `docs/SEED-REFERENCE.md#internationalization`

### Hub Feedback

Set `HUB_API_KEY` and `HUB_SITE_ID` in `.env`. Widget renders via `<HubFeedback />` in `Base.astro` when credentials resolve. Restart `bun dev` after changing `.env`.

### Object cache

Bindings in `wrangler.jsonc`: `bar-of-legends-CACHE`, `bar-of-legends-SESSION`. Prod IDs in gitignored `wrangler.prod.jsonc`.

See `docs/SEED-REFERENCE.md` for schema reference.
