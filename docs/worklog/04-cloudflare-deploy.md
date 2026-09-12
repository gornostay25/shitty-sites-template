# Phase 4 — Cloudflare deploy

**Period:** 2026-09-12  
**Commits:** `4ed0ae1`  
**Sources:** [`docs/CLOUDFLARE-DEPLOYMENT.md`](../CLOUDFLARE-DEPLOYMENT.md), `scripts/d1-export-seed-db.ts`, `scripts/upload-seed-media.ts`, agent transcript `585d0517`, `d363f8e1`, git diff

## Context

BOL site fully functional locally (`bun dev` + `emdash seed`). First production deploy to Cloudflare Workers exposed a chain of platform limits and EmDash gaps not covered by the ShittySites template docs. The admin setup wizard — documented as the normal first-time bootstrap path — failed on this project's large seed + KV object cache configuration.

This phase produced a production runbook and two Bun scripts that become part of the repeatable deploy pipeline.

---

## Work log

### Morning — Deploy prep + wrangler config

- **What:** Renamed worker/project to `bar-of-legends`; aligned D1, R2, KV binding names in `wrangler.jsonc` and `astro.config.mjs`.
- **Why:** Template used generic `shittysites-template` names; production needs client-specific resource names.
- **How:**
  - `wrangler.jsonc`: `name`, D1 `database_name`, R2 `bucket_name`, KV binding names
  - `astro.config.mjs`: `objectCache` binding → `bar-of-legends-CACHE`; `sessionKVBindingName` → `bar-of-legends-SESSION`
  - Set `EMDASH_ENCRYPTION_KEY` as Worker secret before admin setup

---

### Deploy failure 1 — KV namespace `code: 10014`

- **What:** `bunx wrangler deploy` failed at KV auto-provision despite bundle succeeding (~12 MB).
- **Why:** `@astrojs/cloudflare` adds a session KV binding via `sessionKVBindingName`, but root `wrangler.jsonc` only listed `bar-of-legends-CACHE`. Merged `dist/server/wrangler.json` lacked an explicit SESSION entry — Wrangler tried to auto-create a namespace that already existed → error 10014.
- **How (fix that worked):**
  - Declare **both** KV bindings in root `wrangler.jsonc`:
    ```jsonc
    "kv_namespaces": [
      { "binding": "bar-of-legends-CACHE" },
      { "binding": "bar-of-legends-SESSION" }
    ]
    ```
  - Keep `sessionKVBindingName: "bar-of-legends-SESSION"` in `astro.config.mjs` — binding name must match exactly
- **Decisions:** Explicit SESSION binding in `wrangler.jsonc` is required alongside CACHE; noted `session: false` as optional future simplification if sessions are unused.

---

### Deploy failure 2 — `TypeError: Invalid URL string`

- **What:** Deploy validation error 10021 — runtime crash in Workers bundle.
- **Why:** Top-level in `src/plugins/bol-theme/index.ts`:
  ```typescript
  const dir = new URL(".", import.meta.url);  // evaluated at Worker module load
  ```
  Invalid in Workers bundle context.
- **How:** Moved `dir` **inside** `bolThemePlugin()` factory — only runs at build/config time.
- **Result:** Deploy succeeded → `https://bar-of-legends.gornostay25.workers.dev`

---

### Setup wizard failure — seed + object cache

- **What:** Admin setup with "Include sample content" → **Failed to apply seed** (500). Worker logs ~25s wall time.
- **Why:** EmDash `applySeed()` runs in **one** Worker invocation (~111 content entries). Each write triggers `invalidateCollectionCache()` → KV epoch `PUT`s. Hit KV **429** then Cloudflare **subrequest cap** (~1000 on free tier).
- **Log signatures:**
  ```text
  [object-cache] epoch bump failed for content:v2:experiences
  Error: KV PUT failed: 429 Too Many Requests

  [SEED_ERROR]
  Error: Too many API requests by single Worker invocation
  ```
- **Decisions:**
  - **Do not rely on setup wizard** for large seed + `kvCache`
  - Workaround: **local CLI seed → D1 SQL import** (avoids Worker limits entirely)
  - Document quick retry: temporarily remove `objectCache`, redeploy, wizard, re-enable (may still fail on free tier)
  - Draft upstream EmDash issue for setup wizard + kvCache + bulk seed

---

### Seed migration pipeline design

- **What:** Designed and implemented CLI-based production content bootstrap.
- **Why:** EmDash has no `emdash seed --d1`. Available tools:

  | Tool | Target | Seed content? |
  |------|--------|---------------|
  | `emdash seed` | Local SQLite | ✅ |
  | `emdash migrate --d1` | Remote D1 | ❌ schema only |
  | Setup wizard | Worker + D1 | ❌ hits limits |
  | `wrangler d1 execute --file` | Remote D1 | ✅ raw SQL |

- **How — chosen pipeline:**
  ```bash
  bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir .emdash/uploads
  sqlite3 .emdash/seed-migration.db "UPDATE options SET value='\"https://…\"' WHERE name='site:url';"
  bun run seed:d1-export
  bunx wrangler d1 execute bar-of-legends --remote --file=.emdash/d1-import.sql -y
  bun run seed:media-upload
  bun run build && bunx wrangler deploy
  ```

- **Rules:**
  - Import **only into empty D1** — failed wizard leaves partial data; delete + recreate DB, don't overwrite
  - Skip `emdash migrate --d1` after full import (migrations already in dump)
  - `wrangler d1 export --remote` fails on FTS5: `cannot export databases with Virtual Tables (fts5)`

---

### D1 import — iterative exporter fixes (`scripts/d1-export-seed-db.ts`)

- **What:** Custom Bun script transforms `sqlite3 .dump` output into D1-compatible SQL.
- **Why:** Raw SQLite dump incompatible with D1 in four distinct ways — discovered sequentially during import attempts.

  | # | Error | Cause | Exporter fix |
  |---|-------|-------|--------------|
  | 1 | `table sqlite_master may not be modified: SQLITE_ERROR` | `INSERT INTO sqlite_schema(...)` for FTS5 virtual tables | Rewrite as executable `CREATE VIRTUAL TABLE …` DDL |
  | 2 | `SQLITE_AUTH` | `PRAGMA writable_schema=ON/OFF` in dump | Strip privileged pragmas |
  | 3 | Transaction rejected | `BEGIN TRANSACTION` / `COMMIT` / `PRAGMA foreign_keys=OFF` | Strip explicit transactions |
  | 4 | `object name reserved for internal use: _emdash_fts_*_data` | FTS shadow table DDL/DML | Filter shadow lines; re-insert **75 FTS rows** via `INSERT INTO "_emdash_fts_*"` virtual tables queried from local DB |

- **How:** `bun run seed:d1-export` → writes `.emdash/d1-import.sql`
- **Recovery:** `wrangler d1 delete bar-of-legends -y` + `d1 create` → update `database_id` in `wrangler.jsonc`
- **Rejected:** `d1-drop-all.sql` (0 queries executed); remote `d1 export` on FTS database
- **Success:** 834 queries, ~1.62 MB imported. Verified: 3 pages, 54 menu items, FTS populated.

---

### Media upload — `$media.file` gap (`scripts/upload-seed-media.ts`)

- **What:** Upload seed WebP images to R2, create `media` table rows, patch content/revision JSON in D1.
- **Why:** BOL seed uses `{ "$media": { "file": "beer-pour.webp", "alt": "…" } }`. EmDash apply engine resolves **`$media.url` only** — CLI seed leaves **0 `media` rows**, raw JSON in content fields. Live site shows "No image".
- **How:**
  1. Scan `.emdash/seed-migration.db` for `$media.file` refs (menu_items, gallery_items, experiences, revisions)
  2. Read WebP dimensions from file headers
  3. Upload to R2 `bar-of-legends-media` via `wrangler r2 object put` (ULID object keys)
  4. Generate `INSERT INTO media` + `UPDATE` content/revision JSON → `{ id, src, alt, meta.storageKey, … }`
  5. Apply `.emdash/d1-media-patch.sql` to remote D1
- **Result:** 23 WebP → R2, 239 D1 queries, 0 `$media` refs remaining in menu content.
- **Problems → fixes:**
  - `SyntaxError` in `readWebpDimensions` — missing parens in while condition
  - TypeScript: `Uint8Array<ArrayBufferLike>` not assignable to `BufferSource` for `crypto.subtle.digest` → added `toArrayBuffer()` helper

---

### Stale object cache — "No image" persists on live site

- **What:** After successful D1 import + R2 upload, live site still showed "No image" in menu/gallery despite admin showing correct media objects.
- **Why:** Direct D1 SQL patches bypass EmDash cache invalidation. KV object cache still held pre-patch query results with `$media.file` JSON instead of resolved media objects.
- **Attempted fix:** Script to bulk-delete all KV cache keys (`purge-object-cache.ts`) — abandoned.
- **Fix that worked (manual, via Media library):**
  1. Admin → **Media** → open any uploaded photo
  2. Add **alt text** → **Save**
  3. Remove the alt text → **Save** again
  - Two saves through the admin/API bump the object-cache epoch; cached collection queries refresh and menu/gallery images appear on the live site
- **Other options:** Re-save affected content entries the same way; or wait for `defaultTtl` (3600s default)
- **Decision:** No KV purge script — this Media-library edit trick (or re-saving content) is enough after SQL bootstrap

---

### Documentation + gitignore

- **What:** Created `docs/CLOUDFLARE-DEPLOYMENT.md` — full runbook with known issues table, recovery steps, upstream notes. Updated README, AGENTS.md, SEED-REFERENCE.md. Added npm scripts and gitignore entries.
- **How:**
  - `package.json`: `seed:d1-export`, `seed:media-upload`
  - `.gitignore`: `.emdash/seed-migration.db`, `d1-import.sql`, `d1-media-patch.sql`, migration artifacts
  - Known issues table in runbook covers all six production failure modes discovered

---

## Key decisions (summary)

| Decision | Alternatives considered | Rationale |
|----------|------------------------|-----------|
| CLI seed + D1 import over setup wizard | Retry wizard without cache; split seed into batches | Only reliable path for large seed + kvCache on Workers |
| Custom `d1-export-seed-db.ts` | Manual SQL editing; wait for EmDash D1 export | Raw `.dump` incompatible; EmDash export fails on FTS5 |
| `upload-seed-media.ts` as separate step | Fix EmDash apply engine; use `$media.url` in seed | Apply engine gap; file refs are natural for local seed workflow |
| D1 delete + recreate for reset | DROP ALL tables script; import over dirty DB | DROP unreliable; partial wizard data corrupts import |
| No KV purge script | Bulk delete all cache keys; lower defaultTtl | Media alt-text save/remove (or content re-save) bumps cache; sufficient after bootstrap |
| Keep `kvCache` after bootstrap | Disable cache permanently | Safe post-import; failure mode only affects bulk seed in one request |
| Gitignore migration artifacts | Commit SQL dumps to repo | Generated files; regenerate via scripts |

---

## Key error messages (reference)

```text
code: 10014                                    # KV namespace already exists
TypeError: Invalid URL string                 # top-level import.meta.url in plugin
KV PUT failed: 429 Too Many Requests          # object cache epoch during seed
Too many API requests by single Worker invocation
[SEED_ERROR]                                  # setup wizard seed abort
table sqlite_master may not be modified: SQLITE_ERROR
SQLITE_AUTH                                   # PRAGMA writable_schema=ON
object name reserved for internal use: _emdash_fts_*_data
cannot export databases with Virtual Tables (fts5)
```

---

## Template takeaways

- **Declare SESSION KV binding explicitly in `wrangler.jsonc`** — same name as `sessionKVBindingName` in `astro.config.mjs` (e.g. `bar-of-legends-SESSION`). CACHE alone is not enough; missing SESSION entry causes auto-provision conflict (code 10014).
- **Never top-level `import.meta.url` in plugins** loaded in Workers bundle — move inside factory function. Template plugin scaffold should demonstrate correct pattern.
- **Document CLI seed → D1 import as primary production bootstrap** for templates with large seeds + object cache. Setup wizard is fallback for small seeds only.
- **Ship `d1-export-seed-db.ts` (or equivalent) in template** when seed uses FTS5 search tables — EmDash creates FTS virtual tables that break raw SQLite dumps.
- **Ship `upload-seed-media.ts` (or equivalent)** when seed uses `$media.file` references — until EmDash apply engine resolves file refs to R2 uploads.
- **Document stale KV cache after direct D1 patches** — Media library: add alt text → save → remove → save; or re-save content entries; no purge tooling needed.
- **Gitignore `.emdash/seed-migration.db` and generated SQL** — local-only artifacts; regenerate via documented scripts.
- **Document D1 reset procedure** — delete + recreate database, update `database_id` in wrangler config; no reliable truncate.
- **Add known issues table to template deploy docs** — the six failure modes in `CLOUDFLARE-DEPLOYMENT.md` are template-level gaps, not BOL-specific.
- **Consider shipping without `kvCache` in template default** — enable after first content bootstrap, or document wizard failure upfront.
