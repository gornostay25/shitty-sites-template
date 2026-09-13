# Bar of Legends

Client site on [EmDash](https://github.com/emdash-cms/emdash) and Cloudflare Workers (D1 + R2 + KV). Theme plugin: `src/plugins/bol-theme/`.

## i18n

Locales: `en` (default), `hu`, `de`. Single page templates with `routing: { fallbackType: "rewrite" }` — no duplicate files under `src/pages/hu/` or `src/pages/de/`. See [AGENTS.md](./AGENTS.md) and [docs/SEED-REFERENCE.md](./docs/SEED-REFERENCE.md#internationalization).

## Hub Feedback widget

Visual feedback widget for Shitty Hub. Set credentials in `.env`:

```
HUB_API_KEY=your-hub-api-key
HUB_SITE_ID=your-site-id
```

Restart `bun dev` after changing credentials. Widget renders via `<HubFeedback />` in `src/layouts/Base.astro` when configured.

- Widget: `src/hub-feedback/`
- Spec: [docs/superpowers/archive/2026-09-12/specs/2026-09-07-hub-feedback-vite-plugin-design.md](./docs/superpowers/archive/2026-09-12/specs/2026-09-07-hub-feedback-vite-plugin-design.md)

## Local Development

```bash
bun install
bun dev
```

Admin UI: `http://localhost:4321/_emdash/admin`

```bash
bun run typecheck
bun run deploy:prod   # production (swap wrangler.prod.jsonc)
```

## Production deploy (Cloudflare)

First-time production setup uses CLI seed → D1 import → media upload. See **[docs/CLOUDFLARE-DEPLOYMENT.md](./docs/CLOUDFLARE-DEPLOYMENT.md)**.

| Command | Purpose |
|---------|---------|
| `bun run seed:d1-export` | SQLite seed → D1-safe SQL |
| `bun run seed:media-upload:local` | Upload `seed/media/` to local R2 + patch local D1 |
| `bun run seed:media-upload` | Upload `seed/media/` to remote R2 + patch remote D1 |

## Cloudflare KV

Bindings: `bar-of-legends-CACHE`, `bar-of-legends-SESSION`. Prod IDs in gitignored `wrangler.prod.jsonc`.

## Documentation

- [AGENTS.md](./AGENTS.md)
- [docs/CLOUDFLARE-DEPLOYMENT.md](./docs/CLOUDFLARE-DEPLOYMENT.md)
- [docs/SEED-REFERENCE.md](./docs/SEED-REFERENCE.md)
- [EmDash docs](https://docs.emdashcms.com/) — MCP at `https://docs.emdashcms.com/mcp`
