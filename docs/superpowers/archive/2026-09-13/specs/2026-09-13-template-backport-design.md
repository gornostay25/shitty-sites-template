# Template backport — Bar of Legends → ShittySites

**Status:** Implemented (archived 2026-09-13) — plan at [`../plans/2026-09-13-template-backport.md`](../plans/2026-09-13-template-backport.md)  
**Date:** 2026-09-13  

### Amendment log

| Date | Note |
|------|------|
| 2026-09-13 | **Superseded (partial):** i18n routing (`fallbackType: "rewrite"`, locale slug guard, locale-aware 404). See [`../specs/2026-09-13-post-backport-fixes-design.md`](../specs/2026-09-13-post-backport-fixes-design.md). |
**Scope:** P1 + P2 + P4 from `template-lessons` (client branch), plus i18n demo  
**Source branch:** `origin/barOfLegends` (read-only reference)  
**Target branch:** `main`

## Goal

Backport proven agency patterns from the Bar of Legends production fork into the ShittySites template without leaking client-specific code. Unblock first Cloudflare production deploy, ship a generic theme plugin scaffold, and demonstrate i18n with seed rules and docs.

## Non-goals

- Merge `barOfLegends` into `main`
- Copy `src/plugins/bol-theme/**`, BOL seed content, client routes, Tailwind theme, `docs/design/v1/**`
- Remove or modify `hub-feedback` (stays optional agency add-on)
- Ship `docs/template-lessons.md` or full `docs/worklog/` in this slice
- Add tests or test infrastructure

---

## 1. Config & bindings

### KV naming

Replace generic `CACHE` binding with project-prefixed names matching `wrangler.jsonc` `"name": "shittysites-template"`:

| Binding | Purpose |
|---------|---------|
| `shittysites-template-CACHE` | EmDash object cache (`kvCache`) |
| `shittysites-template-SESSION` | Astro session store |

### Wrangler config split

Two files — template vs production:

| File | Committed | Purpose |
|------|-----------|---------|
| `wrangler.jsonc` | **Yes** | Template defaults: binding names, resource names, **no Cloudflare resource IDs** |
| `wrangler.prod.jsonc` | **No** (gitignored) | Per-deploy / per-client prod config: copy from template, fill in `id` / `database_id` after provisioning (**no `preview_id`** — not used) |

**`wrangler.jsonc` (template):**

- Rename `CACHE` → `shittysites-template-CACHE`
- Add `shittysites-template-SESSION`
- KV entries: **`binding` only** — no `id`
- D1/R2: `database_name` / `bucket_name` only — no `database_id` (same as today)

**`wrangler.prod.jsonc` (production, local only):**

- Copy `wrangler.jsonc`, rename worker `name` / D1 / R2 to client project if needed
- After `wrangler kv namespace create …`, paste returned `id` into KV entries (one `id` per namespace — no `preview_id`)
- After `wrangler d1 create …`, paste `database_id` into D1 entry

**Remote Wrangler — swap pattern (required):**

Do **not** use `wrangler deploy --config wrangler.prod.jsonc` — alternate config paths cause case-sensitivity errors on Workers.

```bash
cp wrangler.prod.jsonc wrangler.jsonc
bun run build && bunx wrangler deploy          # or d1 execute, seed:media-upload --remote, etc.
git restore wrangler.jsonc
```

Scripts that invoke Wrangler for `--remote` either perform this swap internally (with `git restore` in a `finally` block) or document that the operator must swap first. Scripts may **parse** `wrangler.prod.jsonc` directly for binding/database/bucket names without passing `--config` to Wrangler.

### `astro.config.mjs`

```js
adapter: cloudflare({
  sessionKVBindingName: "shittysites-template-SESSION",
}),
// ...
objectCache: kvCache({
  binding: "shittysites-template-CACHE",
  defaultTtl: 3600,
  keyPrefix: "em",
}),
```

**Hub-feedback:** no changes to `vite.define`, `resolveHubFeedbackConfig`, or `Base.astro` HubFeedback wiring.

### Migration note (README)

Fork workflow: copy `wrangler.jsonc` → `wrangler.prod.jsonc`, provision resources, fill IDs, swap-and-deploy (see above). Existing deploys on plain `CACHE` must adopt prefixed binding names + SESSION + `sessionKVBindingName`.

---

## 2. Plugins

### 2a. Fix `demo-blocks` Workers bug

Move `new URL(".", import.meta.url)` **inside** `demoBlocksPlugin()` — top-level `import.meta.url` throws `TypeError: Invalid URL string` on Workers deploy (BOL evidence).

`demo-blocks` remains registered in `astro.config.mjs` as dev reference.

### 2b. New `src/plugins/site-theme/` scaffold

Generic monolith native plugin stub — **not registered** in `astro.config.mjs` (fork enables it).

```
site-theme/
├── index.ts              # descriptor factory; import.meta.url INSIDE factory
├── admin.tsx             # stub admin page — Kumo form + apiFetch comment
├── constants.ts
├── astro/
│   ├── index.ts          # blockComponents export (empty map + commented example)
│   ├── blocks/
│   │   └── ExampleBlock.astro   # PT stub using getPtNode()
│   └── theme/
│       ├── SiteHeader.astro
│       └── SiteFooter.astro     # empty semantic stubs
└── utils/
    ├── pt-node.ts        # getPtNode(Astro.props)
    └── i18n/             # mirror of src/utils/i18n/ pattern (stub)
        ├── en.ts
        ├── uk.ts
        └── index.ts
```

No venue KV, no BOL blocks, no client styling. Optional commented hook points for KV settings + admin pages.

### 2c. AGENTS.md plugin rules (additions)

- `import.meta.url` only inside plugin factory functions
- PT blocks receive `Astro.props.node` — use `getPtNode()` helper
- No React islands inside PT `components` map (Astro ignores `client:*` there)
- Admin UI: `@cloudflare/kumo` form primitives + `apiFetch()` with `{ success, data }` unwrap — not `@emdash-cms/admin` Card/Input
- Block Kit: no object groups; repeater sub-fields scalar only; verify `media_picker` before committing
- Patch lifecycle: `bun patch`, filename must match installed EmDash version; remove when upstream fixes byline generator
- Fork: enable `siteThemePlugin()` in config; delete `demo-blocks` if unused

---

## 3. i18n demo

### Config

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "uk"],
  fallback: { uk: "en" },
  // NEVER prefixDefaultLocale — breaks /_emdash/admin
}
```

### `src/utils/i18n/`

- `en.ts` — UI string type + English chrome copy
- `uk.ts` — Ukrainian chrome copy
- `index.ts` — `getUiStrings(locale)` with fallback to `en`

**Scope of `getUiStrings`:** template chrome only (headings, aria labels, nav labels). Not CMS content, not taxonomy term names.

### Seed additions (`seed/seed.json`)

Minimal row-per-locale demo (source rows before translations):

| Entity | EN | UK |
|--------|----|----|
| Page | `id: about`, `slug: about`, `locale: en` | `id: about-uk`, `slug: pro-nas`, `translationOf: about`, `locale: uk` |
| Post | `id: welcome`, `slug: welcome`, `locale: en` | `id: welcome-uk`, `slug: vitayemo`, `translationOf: welcome`, `locale: uk` |
| Menu `primary` | existing + explicit `locale: en`, `id: primary` | `id: primary-uk`, `translationOf: primary`, translated labels, `/uk/…` URLs |
| Term `guides` (category) | existing | uk row with `translationOf`, `label: "Посібники"` |

Do not translate showcase, remaining posts/pages, or full taxonomy set.

### Seed rules (document in SEED-REFERENCE)

1. Source entry must appear **before** translations in the seed file
2. `translationOf` references source seed `id`, not slug
3. Menus: same `name`, per-locale rows linked via `translationOf`
4. Taxonomy term labels: seed/admin per locale; runtime via `getTaxonomyTerms(name, { locale })` — never in `getUiStrings`
5. Add explicit `"locale": "en"` on source rows when a collection has translations

### `LanguageSwitcher.astro`

Replace commented stub with working component:

- Optional props: `collection`, `entryId`
- When entry context provided: `getTranslations()` → links to **published** siblings only; build hrefs with `getRelativeLocaleUrl`
- Without entry: locale links for all configured locales via `getRelativeLocaleUrl`
- Render in `SiteHeader.astro`

### Locale-aware queries

Pass `locale: Astro.currentLocale` on all content-facing API calls:

| File | Change |
|------|--------|
| `src/pages/index.astro` | `getEmDashCollection(..., { locale })`; chrome via `getUiStrings` |
| `src/pages/[slug].astro` | `getEmDashEntry(..., { locale })`; pass switcher props |
| `src/pages/posts/index.astro`, `posts/[slug].astro` | locale on collection/entry |
| `src/pages/category/[slug].astro`, `tag/[slug].astro` | locale on collection + `getTerm` |
| `src/pages/showcase/[slug].astro`, `search.astro` | locale where applicable |
| `src/components/SiteHeader.astro` | `getMenu("primary", { locale })`; render LanguageSwitcher |
| `src/components/SiteFooter.astro` | `getMenu("footer", { locale })` |
| `src/components/WidgetRenderer.astro` | `getMenu(..., { locale })` |
| `src/components/PostTerms.astro` | `getEntryTerms(..., { locale })` |

Astro serves `/uk/…` with one template set — no duplicate page files, but **`routing.fallbackType: "rewrite"`** is required (see [post-backport fixes spec](../specs/2026-09-13-post-backport-fixes-design.md)).

---

## 4. Production deploy

### Scripts

**`scripts/d1-export-seed-db.ts`** — adapt from client branch:

- Convert local SQLite (from `emdash seed`) to D1-safe SQL
- Strip FTS5-incompatible `sqlite_schema` inserts, pragmas, shadow tables
- **Auto-discover** `_emdash_fts_*` virtual tables from SQLite (not BOL-hardcoded collection names)
- Re-insert FTS rows via virtual table INSERTs

**`scripts/upload-seed-media.ts`** — adapt from client branch (required for `$media.file` seeds):

- Upload **`.emdash/uploads/`** to R2, insert `media` rows, patch `$media.file` refs in content JSON
- **`--local`** (dev D1 from `.wrangler/`) and **`--remote`** (production)
- Default `d1` / bucket names: parse `wrangler.prod.jsonc` when `--remote`, else `wrangler.jsonc`
- Remote Wrangler calls use **swap pattern** (copy prod → `wrangler.jsonc` → command → `git restore`) — never `--config wrangler.prod.jsonc`
- **Dynamic scan:** all `ec_*` tables + `revisions` for `$media.file` (not BOL table names)

### Seed media — prefer `$media.file`

**Default (template + recommended for forks):** use `$media.file` in `seed/seed.json` pointing at files under **`.emdash/uploads/`** (via `emdash seed --uploads-dir .emdash/uploads`). EmDash apply engine does **not** resolve `$media.file` into `media` rows — after CLI seed or D1 import, run `seed:media-upload:local` (dev) or `seed:media-upload` (production) to upload to R2 and patch content JSON.

**Template backport:** migrate demo featured images from `$media.url` (Unsplash) to local WebP in `.emdash/uploads/` + `$media.file` refs. Ship source assets under `seed/media/` (or similar committed path) copied into `.emdash/uploads/` during `emdash seed` / documented bootstrap step.

**Alternative:** `$media.url` for external URLs when offline assets are not needed — works on apply without upload script, but forks should default to `$media.file` for production R2 control.

### `package.json` scripts

```json
"seed:d1-export": "bun scripts/d1-export-seed-db.ts",
"seed:media-upload:local": "bun scripts/upload-seed-media.ts --local",
"seed:media-upload": "bun scripts/upload-seed-media.ts --remote",
"deploy:prod": "cp wrangler.prod.jsonc wrangler.jsonc && astro build && wrangler deploy; git restore wrangler.jsonc"
```

Requires `wrangler.prod.jsonc` (copy from template + fill IDs). Uses swap pattern — no `--config`. Keep plain `"deploy"` as local/sandbox or document prod vs dev in README. Local dev unchanged — `bun dev` uses template `wrangler.jsonc` via Miniflare.

Add `@types/bun` devDependency if needed by scripts.

### `docs/CLOUDFLARE-DEPLOYMENT.md`

Generalized from client runbook (ShittySites naming, not Bar of Legends):

- Normal deploy flow: `wrangler.prod.jsonc` setup → **swap-and-deploy** (`cp` → deploy → `git restore`)
- Template vs prod Wrangler split (`wrangler.jsonc` vs gitignored `wrangler.prod.jsonc`); no `preview_id`
- Bindings table with `shittysites-template-*` names
- Known-issues summary table (wizard KV 429, KV 10014, import.meta.url, missing images, stale cache, partial D1, `--config` case errors)
- CLI seed → D1 import pipeline (primary bootstrap for large seeds + object cache)
- D1 reset procedure, stale KV cache workaround after direct SQL
- **Seed media:** prefer `$media.file` + `.emdash/uploads/` + upload script; `$media.url` as optional external-URL alternative
- Gitignore artifact list

### `.gitignore` additions

```
.emdash/seed-migration.db
.emdash/seed-migration.db-*
.emdash/d1-import.sql
.emdash/d1-import-*.sql
.emdash/d1-media-patch.sql
.emdash/d1-drop-all.sql
.emdash/uploads/
wrangler.prod.jsonc
```

Replace root `uploads/` gitignore entry with `.emdash/uploads/` (seed migration / `$media.file` workflow — not committed).

### Doc updates

| File | Changes |
|------|---------|
| `AGENTS.md` | Seed scripts in Commands; deploy runbook link; plugin rules; i18n demo (`en` + `uk`); patch version 0.37.0 |
| `README.md` | Production deploy section; `wrangler.jsonc` / `wrangler.prod.jsonc` fork flow; KV create + ID paste; i18n demo at `/uk/`; **keep Hub Feedback section** |
| `docs/SEED-REFERENCE.md` | Object-cache production note; stale cache after D1 import; **prefer `$media.file`** + `.emdash/uploads/` + script table; `$media.url` alternative; **Internationalization** section with seed rules |

---

## 5. File inventory

### Modify

- `wrangler.jsonc`
- `astro.config.mjs`
- `package.json`
- `.gitignore`
- `AGENTS.md`
- `README.md`
- `docs/SEED-REFERENCE.md`
- `seed/seed.json` (migrate featured images to `$media.file`)
- `seed/media/**` (committed WebP sources for seed uploads, if added)
- `src/plugins/demo-blocks/index.ts`
- `src/components/LanguageSwitcher.astro`
- `src/components/SiteHeader.astro`
- `src/components/SiteFooter.astro`
- `src/components/WidgetRenderer.astro`
- `src/components/PostTerms.astro`
- `src/pages/index.astro`
- `src/pages/[slug].astro`
- `src/pages/posts/index.astro`
- `src/pages/posts/[slug].astro`
- `src/pages/category/[slug].astro`
- `src/pages/tag/[slug].astro`
- `src/pages/showcase/[slug].astro`
- `src/pages/search.astro`

### Add

- `scripts/d1-export-seed-db.ts`
- `scripts/upload-seed-media.ts`
- `docs/CLOUDFLARE-DEPLOYMENT.md`
- `src/utils/i18n/en.ts`
- `src/utils/i18n/uk.ts`
- `src/utils/i18n/index.ts`
- `src/plugins/site-theme/**` (~10 files)

### Explicitly untouched

- `src/hub-feedback/**`
- `src/plugins/bol-theme/**` (does not exist on main)
- `docs/template-lessons.md`, `docs/worklog/**`
- Client-specific seed content beyond i18n demo rows

---

## 6. Verification (manual)

1. `bun dev` — site loads at `/` and `/uk/`
2. `/about` and `/uk/pro-nas` render correct locale content
3. `/posts/welcome` and `/uk/vitayemo` work; LanguageSwitcher links between translations
4. Primary menu shows uk labels on `/uk/` routes
5. `getTaxonomyTerms("category", { locale: "uk" })` returns translated `guides` label on uk post
6. `bun run seed:d1-export` succeeds after local `emdash seed`; `seed:media-upload:local` resolves `$media.file` featured images in dev
7. `demo-blocks` descriptor: confirm `import.meta.url` only inside factory
8. Hub Feedback still renders when env vars set

---

## 7. Follow-up (out of scope)

- `docs/template-lessons.md` + slim `docs/worklog/` index
- Full fork checklist in README
- Archive shipped specs per agent workflow checklist
