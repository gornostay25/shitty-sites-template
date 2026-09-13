# Cloudflare deployment — ShittySites Template

Runbook for deploying this EmDash site to Cloudflare Workers (D1 + R2 + KV). Includes **known production issues** and the **workarounds** used in agency forks.

EmDash references:

- [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
- [Object cache](https://docs.emdashcms.com/deployment/object-cache/)
- [Core migrations](https://docs.emdashcms.com/deployment/core-migrations/)
- [Backups & D1 import/export](https://docs.emdashcms.com/guides/backups/)
- [CLI — `emdash seed`](https://docs.emdashcms.com/reference/cli/#emdash-seed)

---

## Normal deploy (local / sandbox)

Uses committed `wrangler.jsonc` (binding names only, no Cloudflare IDs):

```bash
bun install
bun run build
bunx wrangler deploy
```

First visit to `/_emdash/admin` runs the setup wizard when the D1 database is empty and setup is not complete.

---

## Production deploy (wrangler split + swap)

| File | Committed | Purpose |
|------|-----------|---------|
| `wrangler.jsonc` | **Yes** | Template: binding names, D1/R2 names, **no resource IDs** |
| `wrangler.prod.jsonc` | **No** (gitignored) | Per-client prod: copy template, paste KV `id` / D1 `database_id` after provisioning (**no `preview_id`**) |

**Do not** use `wrangler deploy --config wrangler.prod.jsonc` — alternate config paths cause case-sensitivity errors on Workers.

Swap pattern (scripts and `deploy:prod` use this):

```bash
cp wrangler.prod.jsonc wrangler.jsonc
bun run build && bunx wrangler deploy   # or d1 execute, seed:media-upload --remote, etc.
git restore wrangler.jsonc
```

Or: `bun run deploy:prod`

### Bindings

| Binding | Service | Purpose |
|---------|---------|---------|
| `DB` | D1 `shittysites-template` | CMS database |
| `MEDIA` | R2 `shittysites-template-media` | Uploaded media |
| `shittysites-template-CACHE` | KV | EmDash object cache (`kvCache` in `astro.config.mjs`) |
| `shittysites-template-SESSION` | KV | Astro session store (`sessionKVBindingName`) |

`astro.config.mjs` must keep `sessionKVBindingName: "shittysites-template-SESSION"` in sync with the SESSION KV binding in `wrangler.jsonc`.

Provision once per client:

```bash
bunx wrangler kv namespace create shittysites-template-CACHE
bunx wrangler kv namespace create shittysites-template-SESSION
bunx wrangler d1 create shittysites-template
bunx wrangler r2 bucket create shittysites-template-media
```

Paste returned IDs into `wrangler.prod.jsonc`.

---

## Known issues (summary)

| Symptom | Cause | Workaround |
|---------|-------|------------|
| Setup wizard: **Failed to apply seed** (500) | Full seed + KV object-cache invalidation in one Worker invocation → subrequest / KV limits | **Local CLI seed + D1 SQL import** (below) |
| Deploy tries to create KV / `code: 10014` | Missing SESSION binding matching `sessionKVBindingName` | Add CACHE + SESSION in wrangler; names match `astro.config.mjs` |
| Runtime: `TypeError: Invalid URL string` | Top-level `import.meta.url` in native plugin | Move `new URL(".", import.meta.url)` **inside** plugin factory |
| Images missing after CLI seed | Seed uses `$media.file`; apply engine does not upload files | `seed:media-upload:local` (dev) or `seed:media-upload` (prod) |
| Live site **No image**, admin OK | D1 patched via SQL; KV cache holds pre-patch queries | Media alt-text trick (below) or re-save entries / wait for `defaultTtl` |
| Partial data after failed setup | Wizard aborted mid-seed | Import into **empty** D1 only |
| Wrangler `--config` case errors | Workers bundle path sensitivity | **Swap pattern** — never `--config wrangler.prod.jsonc` |

---

## CLI seed + D1 import (recommended bootstrap)

Import only into an **empty** D1 database.

### Scripts

| Script | What it does |
|--------|----------------|
| `bun run seed:d1-export` | Local SQLite → D1-safe `.emdash/d1-import.sql` (FTS5 fixes) |
| `bun run seed:media-upload:local` | `seed/media/` → **local** R2 + local D1 patch (after `bun dev`) |
| `bun run seed:media-upload` | `seed/media/` → **remote** R2 + remote D1 patch (swap pattern) |
| `bun run deploy:prod` | Swap prod wrangler → build → deploy → restore template wrangler |

### One-shot production bootstrap

```bash
bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir seed/media
sqlite3 .emdash/seed-migration.db "UPDATE options SET value='\"https://YOUR-URL\"' WHERE name='site:url';"
bun run seed:d1-export
cp wrangler.prod.jsonc wrangler.jsonc
bunx wrangler d1 execute shittysites-template --remote --file=.emdash/d1-import.sql -y
git restore wrangler.jsonc
bun run seed:media-upload
bun run deploy:prod
```

Replace `YOUR-URL` with the Workers URL or custom domain before import.

**Do not** pipe raw `sqlite3 .dump` into D1 — use `seed:d1-export` (strips FTS shadow tables, catalog INSERTs, pragmas).

**Do not** run `emdash migrate --d1` after a full import — migration rows are already in the dump.

---

## Seed media (`$media.file`)

Prefer `$media.file` in `seed/seed.json` pointing at filenames in committed `seed/media/`:

```json
{ "$media": { "file": "welcome-featured.webp", "alt": "…" } }
```

CLI seed and upload scripts read from `seed/media/` (override with `--uploads-dir` if needed).

EmDash apply does **not** resolve `$media.file` into R2/`media` rows. After CLI seed or D1 import, run:

```bash
bun run seed:media-upload:local   # dev (live .wrangler D1)
bun run seed:media-upload         # production (swap pattern)
bun scripts/upload-seed-media.ts --dry-run
```

Alternative: `$media.url` for external URLs (works without upload script; less control over R2).

---

## Object cache after import

Object cache is safe **after** CLI import. Bulk seed **inside one Worker request** hits KV/subrequest limits — that is why the CLI path exists.

Direct D1 writes bypass EmDash cache invalidation. Stale public pages clear when:

1. **Media library trick:** open any photo → add alt text → save → remove alt → save again
2. Re-save affected content in admin
3. Wait for `defaultTtl` (default 3600s in `astro.config.mjs`)

---

## Recovery after failed setup

Do **not** import a full SQL dump over a dirty database.

```bash
bunx wrangler d1 delete shittysites-template -y
bunx wrangler d1 create shittysites-template
```

Update `database_id` in `wrangler.prod.jsonc`, then re-run the bootstrap workflow.

---

## Gitignored artifacts

```
.emdash/seed-migration.db*
.emdash/d1-import*.sql
.emdash/d1-media-patch.sql
.emdash/d1-drop-all.sql
wrangler.prod.jsonc
```

See [SEED-REFERENCE.md](./SEED-REFERENCE.md) for seed structure, i18n rules, and fork notes.
