# Cloudflare deployment — Bar of Legends

Runbook for deploying this EmDash site to Cloudflare Workers (D1 + R2 + KV). Includes **known production issues** and the **workarounds** used on this project.

EmDash references:

- [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
- [Object cache](https://docs.emdashcms.com/deployment/object-cache/)
- [Core migrations](https://docs.emdashcms.com/deployment/core-migrations/)
- [Backups & D1 import/export](https://docs.emdashcms.com/guides/backups/)
- [CLI — `emdash seed`](https://docs.emdashcms.com/reference/cli/#emdash-seed)

---

## Normal deploy

```bash
bun install
bun run build
bunx wrangler deploy
```

First visit to `/_emdash/admin` runs the setup wizard when the D1 database is empty and setup is not complete.

**Bindings** (see `wrangler.jsonc`):

| Binding | Service | Purpose |
|---------|---------|---------|
| `DB` | D1 `bar-of-legends` | CMS database |
| `MEDIA` | R2 `bar-of-legends-media` | Uploaded media |
| `bar-of-legends-CACHE` | KV | EmDash object cache (`kvCache` in `astro.config.mjs`) |
| `bar-of-legends-SESSION` | KV | Astro session store (added by `@astrojs/cloudflare`) |

`astro.config.mjs` must keep `sessionKVBindingName: "bar-of-legends-SESSION"` in sync with the SESSION KV binding name in `wrangler.jsonc`.

---

## Known issues (summary)

| Symptom | Cause | Workaround |
|---------|-------|------------|
| Setup wizard: **Failed to apply seed** (500) | Single Worker invocation applies full seed + KV object-cache invalidation → Cloudflare subrequest / KV write limits | **Local CLI seed + D1 SQL import** (below) |
| Deploy tries to create KV namespace / `code: 10014` | Root `wrangler.jsonc` missing SESSION binding that matches `sessionKVBindingName` | Add both CACHE + SESSION entries under `kv_namespaces`; names must match `astro.config.mjs` |
| Deploy/runtime: `TypeError: Invalid URL string` | Top-level `import.meta.url` in `bol-theme` plugin evaluated in Workers | `new URL(".", import.meta.url)` moved **inside** `bolThemePlugin()` |
| Images missing after CLI seed | Seed uses `$media.file`; EmDash apply engine resolves `$media.url` only | `seed:media-upload:local` (dev) or `seed:media-upload` (prod) — see [Seed media](#seed-media-mediafile) |
| Live site shows **No image** but admin has images | D1 patched via SQL; KV object cache still holds pre-patch queries | **Media:** open any photo → add alt text → save → remove alt → save again. Or re-save affected content entries. Or wait for `defaultTtl` |
| Partial data after failed setup | Wizard aborted mid-seed | Import into **empty** D1 only — do not import over a dirty database |

---

## 1. Setup wizard fails with object cache (KV)

### What happens

On production, submitting setup with **Include sample content** calls `POST /_emdash/api/setup`. EmDash runs `applySeed()` in **one** Worker invocation (~111 content entries in this template).

With `objectCache: kvCache({ binding: "bar-of-legends-CACHE" })`, every content write triggers object-cache epoch bumps (KV `PUT`s). Logs look like:

```text
[object-cache] epoch bump failed for content:v2:experiences
Error: KV PUT failed: 429 Too Many Requests

[SEED_ERROR]
Error: Too many API requests by single Worker invocation
```

The admin UI shows **Failed to apply seed**.

This is a **platform limit + EmDash bulk-seed design** issue, not a invalid `seed/seed.json`. The CLI path avoids Worker limits entirely.

### Quick retry (sometimes enough)

1. Temporarily **remove** `objectCache: kvCache(...)` from `astro.config.mjs`.
2. `bun run build && bunx wrangler deploy`
3. Use a **clean** D1 database (see [Recovery](#recovery-after-a-failed-setup)).
4. Run the setup wizard again with sample content.
5. Re-enable `kvCache` and redeploy.

Large seeds may still hit subrequest limits on Workers Free. Prefer the CLI import workflow below for reliability.

### Recommended: local seed + D1 import

EmDash docs: `emdash seed` applies to **local SQLite only**; `emdash migrate --d1` applies **core schema migrations only**, not seed content. For production content, use the backup guide pattern in reverse ([D1 dump import](https://docs.emdashcms.com/guides/backups/#create-an-offsite-d1-dump)).

**Important:** Import only into an **empty** D1 database. Do not execute a full SQL dump against a database that already has schema or partial seed data.

#### Production seed scripts (`package.json`)

| Script | What it does |
|--------|----------------|
| `bun run seed:d1-export` | Local SQLite → D1-safe `.emdash/d1-import.sql` (FTS5 fixes) |
| `bun run seed:media-upload:local` | `.emdash/uploads/` → **local** R2 + local D1 patch (dev, after `bun dev`) |
| `bun run seed:media-upload` | `.emdash/uploads/` → **remote** R2 + remote D1 patch (production) |

One-shot production content bootstrap (empty D1):

```bash
bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir .emdash/uploads
sqlite3 .emdash/seed-migration.db "UPDATE options SET value='\"https://YOUR-URL\"' WHERE name='site:url';"
bun run seed:d1-export
bunx wrangler d1 execute bar-of-legends --remote --file=.emdash/d1-import.sql -y
bun run seed:media-upload
bun run build && bunx wrangler deploy
```

#### Step 1 — Seed locally

```bash
rm -f .emdash/seed-migration.db

bunx emdash seed seed/seed.json \
  --database .emdash/seed-migration.db \
  --uploads-dir .emdash/uploads
```

Runs migrations + full seed in Bun/Node (no Worker subrequest cap). Expect ~111 content entries, collections, taxonomies, and menus.

#### Step 2 — Set production site URL in the SQLite file

```bash
sqlite3 .emdash/seed-migration.db \
  "UPDATE options SET value='\"https://YOUR-WORKER.workers.dev\"' WHERE name='site:url';"
```

Replace with the real Workers URL or custom domain before import.

#### Step 3 — Export SQL and import to D1

**Do not** pipe raw `sqlite3 .dump` straight into D1. EmDash FTS5 tables make `.dump` emit catalog `INSERT`s, `PRAGMA writable_schema`, `BEGIN TRANSACTION`, and shadow-table DDL (`_emdash_fts_*_data`, `_content`, …). D1 rejects those with errors like **`table sqlite_master may not be modified`**, **`SQLITE_AUTH`**, **`BEGIN TRANSACTION` not allowed**, or **`object name reserved for internal use`**.

Use the project exporter — it strips unsupported dump lines and re-inserts FTS rows through the virtual tables:

```bash
bun run seed:d1-export

bunx wrangler d1 execute bar-of-legends --remote --file=.emdash/d1-import.sql -y
```

Use the D1 `database_name` from `wrangler.jsonc` (`bar-of-legends`). The dump is small (~220 KB for this site).

Do **not** run `emdash migrate --d1` after a full import — migration rows are already in the dump.

**Note:** `wrangler d1 export --remote` also fails on EmDash databases (`cannot export databases with Virtual Tables (fts5)`). Export/import for this site is **local SQLite → D1 execute**, not D1 → D1.

#### Step 4 — Upload seed media to R2

After D1 import, image fields still contain raw `$media.file` JSON. Upload WebP assets and patch D1:

```bash
bun run seed:media-upload
```

See [Seed media](#seed-media-mediafile) for flags and dry-run.

#### Step 5 — Finish admin setup

1. Open `/_emdash/admin`.
2. Complete **admin account** (passkey) — the wizard should not re-apply seed because collections already exist.
3. Confirm **Settings → Site URL** and venue/plugin settings.

#### Step 6 — Deploy application code

```bash
bun run build && bunx wrangler deploy
```

---

## 2. KV namespace errors on deploy

### Symptom

Wrangler tries to auto-provision KV during deploy, or fails with namespace already exists (`code: 10014`). Common cause: root `wrangler.jsonc` lists EmDash CACHE but omits the Astro session binding — merged `dist/server/wrangler.json` then triggers auto-create for a namespace that already exists.

### Fix (this repo)

1. Set Worker `name` in `wrangler.jsonc` (e.g. `"bar-of-legends"`).
2. Declare **both** KV bindings in root `wrangler.jsonc` (names must match `astro.config.mjs`):

   ```jsonc
   "kv_namespaces": [
     { "binding": "bar-of-legends-CACHE" },
     { "binding": "bar-of-legends-SESSION" }
   ]
   ```

3. Set `sessionKVBindingName: "bar-of-legends-SESSION"` in `astro.config.mjs` — same string as the SESSION binding above.

4. If namespaces do not exist yet, create once:

   ```bash
   bunx wrangler kv namespace create bar-of-legends-CACHE
   bunx wrangler kv namespace create bar-of-legends-SESSION
   ```

   Add each returned `id` to the matching entry in `wrangler.jsonc` if Wrangler still fails to resolve them.

Re-deploy so `dist/server/wrangler.json` inherits the explicit bindings.

---

## 3. Plugin `import.meta.url` on Workers

### Symptom

Deploy succeeds but Worker fails at runtime:

```text
TypeError: Invalid URL string
  at ... middleware ...
```

### Cause

`const dir = new URL(".", import.meta.url)` at **module top level** in `src/plugins/bol-theme/index.ts` runs in the Workers bundle where `import.meta.url` is not valid at module load time.

### Fix

Resolve paths **inside** the plugin factory (build/config time only):

```typescript
export function bolThemePlugin(): PluginDescriptor {
  const dir = new URL(".", import.meta.url);
  return { /* ... */ };
}
```

---

## 4. Core migrations vs seed

| Command | Target | Applies |
|---------|--------|---------|
| `emdash migrate --d1 …` | Remote D1 via API | EmDash **core** migrations only (`.emdash/migrations.json` from `bun run build`) |
| `emdash seed seed/seed.json` | Local SQLite | Migrations + **collections, fields, menus, content** from seed |
| Setup wizard | Worker + D1 | Same as seed apply (subject to Worker limits) |
| `wrangler d1 execute --file` | Remote D1 | Raw SQL (full SQLite dump from CLI seed) |

Typical **first production** flow for this site:

1. `bun run build`
2. (Optional) `emdash migrate --d1 …` if you prefer migrations before seed — **skip** if you import a full CLI dump that already includes `_emdash_migrations`.
3. CLI seed + D1 import (above)
4. `seed:media-upload`
5. `wrangler deploy`
6. Admin passkey + settings

For CI, see [Core migrations in CI](https://docs.emdashcms.com/deployment/core-migrations/#configure-d1-migrations-in-ci).

---

## Recovery after a failed setup

If the setup wizard failed mid-seed, D1 may contain **partial** collections or revisions.

Per [EmDash backups guide](https://docs.emdashcms.com/guides/backups/#create-an-offsite-d1-dump):

- **Do not** import a full SQL dump over the existing production database.
- Prefer a **new empty D1** database (update `database_id` in `wrangler.jsonc`) **or** [D1 Time Travel restore](https://docs.emdashcms.com/guides/backups/#recover-a-d1-database-with-time-travel) to a point before the failed setup.
- Then run the [local seed + import](#recommended-local-seed--d1-import) workflow.

### Wipe remote D1 (start clean)

Wrangler has no `d1 truncate`. Fastest reset:

```bash
bunx wrangler d1 delete bar-of-legends -y
bunx wrangler d1 create bar-of-legends
```

Copy the new `database_id` into `wrangler.jsonc`, then import again.

Dropping tables with generated `DROP TABLE` SQL often executes **0 queries** on D1 when statements are not split the way Wrangler expects — prefer delete + create over ad-hoc DROP scripts.

---

## Seed media (`$media.file`)

This project’s `seed/seed.json` (from `scripts/generate-bol-seed.ts`) uses:

```json
{ "$media": { "file": "beer-pour.webp", "alt": "…" } }
```

EmDash’s seed engine resolves **`$media.url`** (download + storage upload). The `mediaBasePath` / `$media.file` path is documented in types but **not applied** by the current apply engine — after CLI seed, image fields may still contain raw `$media` JSON and the `media` table stays empty.

**Until seed format is fixed**, run the Wrangler-based uploader after seed apply (uploads to R2, inserts `media` rows, patches `$media` JSON in content + revisions):

**Local dev** (after `bun dev` has created `.wrangler/state/v3/d1/`):

```bash
bun run seed:media-upload:local
```

Uses miniflare R2 + local D1. Reads the live dev database (not `.emdash/seed-migration.db` — row IDs differ). No Wrangler remote auth needed.

**Production** (after remote D1 import):

```bash
bun run seed:media-upload
```

Requires Wrangler auth (same as D1 import). No admin passkey needed — objects land in `bar-of-legends-media` with ULID keys matching EmDash’s upload pipeline.

**Preview / manual apply:**

```bash
bun scripts/upload-seed-media.ts --dry-run
# upload to R2 but write SQL without applying:
bun scripts/upload-seed-media.ts --remote   # or --local
bunx wrangler d1 execute bar-of-legends --remote --file=.emdash/d1-media-patch.sql -y
```

Both environments serve uploaded files via `/_emdash/api/media/file/{storage_key}`.

If the public site still shows **No image** after SQL patches while admin looks correct, the object cache may be stale — in **Media**, open any photo, add alt text and save, then remove alt text and save again (bumps cache without editing every menu item). Alternatively re-save affected content entries or wait for `defaultTtl` (see [Object cache after import](#object-cache-after-import)).

| Flag | Effect |
|------|--------|
| `--dry-run` | Print R2 keys + write patch SQL only |
| `--local` | Local R2 + local D1; reads live dev D1 from `.wrangler/` (default via `seed:media-upload:local`) |
| `--remote` | Remote R2 + remote D1 (default via `seed:media-upload`) |
| `--uploads-dir`, `--database`, `--bucket`, `--d1`, `--out` | Override paths/names. `--database` defaults to live local D1 when `--local`, else `.emdash/seed-migration.db` |

---

## Object cache after import

Object cache is safe to keep enabled **after** the database is populated via CLI import. The failure mode is specific to **bulk seed inside one Worker request**, not normal admin edits or page views.

**Direct D1 writes** (`wrangler d1 execute`, media patch SQL) bypass EmDash invalidation. Stale public pages clear when:

1. **Media library trick (fastest after bootstrap):** open any uploaded photo → add alt text → save → remove alt text → save again
2. Affected content entries are re-saved through admin/API (normal epoch bump)
3. Cached entries expire (`defaultTtl`, default 3600s)

Admin/API content edits invalidate affected collections automatically — no manual purge needed for normal editing.

Tuning in `astro.config.mjs`:

- `defaultTtl` — lower if scheduled publishing must appear quickly.
- `keyPrefix` — unique per site if sharing a KV namespace.

---

## Local development (unchanged)

Schema on first request when DB empty. For full demo content locally:

```text
http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin&content=1
```

Reset local D1 state: `rm -rf .wrangler/state && bun dev`.

See [SEED-REFERENCE.md](./SEED-REFERENCE.md) for seed structure and fork notes.

---

## Upstream

The setup wizard + `kvCache` + large sample seed failure on Workers is an EmDash/platform interaction worth tracking upstream (skip or batch cache invalidation during `applySeed()`, or chunked setup). Report with Worker logs from `POST /_emdash/api/setup` if filing an issue.
