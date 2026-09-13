# Template Backport Implementation Plan

**Status:** Implemented (archived 2026-09-13) — spec at [`../specs/2026-09-13-template-backport-design.md`](../specs/2026-09-13-template-backport-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backport BOL production patterns into ShittySites template on `main`: KV bindings, deploy scripts, plugin scaffold, i18n demo, `$media.file` seed media — without client-specific code or hub-feedback changes.

**Architecture:** Read `origin/barOfLegends` only via `git show`; apply generalized edits on `main`. Wrangler template (`wrangler.jsonc`) has binding names only; prod IDs live in gitignored `wrangler.prod.jsonc`. Remote Wrangler uses swap-and-restore, never `--config`. Seed media uses `$media.file` + `.emdash/uploads/` + upload script.

**Tech Stack:** EmDash 0.37, Astro 7, Cloudflare Workers (D1/R2/KV), Bun scripts

**Spec:** [`../specs/2026-09-13-template-backport-design.md`](../specs/2026-09-13-template-backport-design.md)

## Global Constraints

- Target branch: `main` only; never merge `barOfLegends`
- Do not touch `src/hub-feedback/**`
- Do not copy `src/plugins/bol-theme/**`, BOL routes, or client styling
- No test files or test infrastructure (manual verification only)
- No git commits unless user explicitly requests
- KV bindings: `shittysites-template-CACHE`, `shittysites-template-SESSION`; no `preview_id`
- Prefer `$media.file` in seed; `$media.url` optional alternative
- i18n: `en` + `uk`, never `prefixDefaultLocale`

---

### Task 1: Config & bindings

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: synced binding names for all later tasks/scripts

- [ ] **Step 1: Update `wrangler.jsonc`**

Replace KV block with binding-only entries (no `id`):

```jsonc
"kv_namespaces": [
  { "binding": "shittysites-template-CACHE" },
  { "binding": "shittysites-template-SESSION" },
],
```

Remove any existing `CACHE` entry and any `id` / `preview_id` fields.

- [ ] **Step 2: Update `astro.config.mjs`**

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

Do **not** change hub-feedback `vite.define` block.

- [ ] **Step 3: Manual verify**

Run: `bun dev` (already running or restart)

Expected: dev server starts; no config errors in terminal.

---

### Task 2: Gitignore & package.json scripts

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Produces: npm script names used by Tasks 3–4 and docs

- [ ] **Step 1: Update `.gitignore`**

Add:

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

Remove root `uploads/` line if present.

- [ ] **Step 2: Add scripts and devDependency**

```json
"scripts": {
  "seed:d1-export": "bun scripts/d1-export-seed-db.ts",
  "seed:media-upload:local": "bun scripts/upload-seed-media.ts --local",
  "seed:media-upload": "bun scripts/upload-seed-media.ts --remote",
  "deploy:prod": "cp wrangler.prod.jsonc wrangler.jsonc && astro build && wrangler deploy; git restore wrangler.jsonc"
},
"devDependencies": {
  "@types/bun": "^1.4.2",
  "ulidx": "^2.4.1"
}
```

Keep existing `"deploy"` unchanged for local/sandbox.

Run: `bun install`

---

### Task 3: Wrangler config helper + D1 export script

**Files:**
- Create: `scripts/lib/wrangler-config.ts`
- Create: `scripts/d1-export-seed-db.ts`

**Interfaces:**
- Produces: `parseWranglerConfig(path: string): { d1DatabaseName: string; r2BucketName: string; workerName: string }`
- Produces: `discoverFtsTables(db: Database): Array<{ name: string; columns: string[] }>`

Reference: `git show origin/barOfLegends:scripts/d1-export-seed-db.ts`

- [ ] **Step 1: Create `scripts/lib/wrangler-config.ts`**

Strip `//` comments, parse JSON, extract:

```ts
export interface WranglerConfig {
  workerName: string;
  d1DatabaseName: string;
  r2BucketName: string;
}

export function parseWranglerConfig(configPath: string): WranglerConfig {
  const raw = readFileSync(configPath, "utf-8").replace(/\/\/.*$/gm, "");
  const config = JSON.parse(raw);
  return {
    workerName: config.name,
    d1DatabaseName: config.d1_databases?.[0]?.database_name ?? config.name,
    r2BucketName: config.r2_buckets?.[0]?.bucket_name ?? `${config.name}-media`,
  };
}
```

- [ ] **Step 2: Create `scripts/d1-export-seed-db.ts`**

Adapt from client branch with **dynamic FTS discovery**:

```ts
function discoverFtsTables(db: Database): Array<{ name: string; columns: string[] }> {
  const tables = db
    .query(
      `SELECT name, sql FROM sqlite_master WHERE type='table' AND name LIKE '_emdash_fts_%'`,
    )
    .all() as Array<{ name: string; sql: string }>;

  return tables
    .filter((t) => !/_((data|idx|content|docsize|config))$/.test(t.name))
    .map((t) => {
      const colMatch = t.sql.match(/\(([^)]+)\)/);
      const columns = colMatch
        ? colMatch[1].split(",").map((c) => c.trim().replace(/"/g, ""))
        : [];
      return { name: t.name, columns };
    });
}
```

Keep client sanitization (strip pragmas, rewrite `sqlite_schema` INSERTs, filter shadow tables, re-insert FTS rows).

Usage defaults: `.emdash/seed-migration.db` → `.emdash/d1-import.sql`

- [ ] **Step 3: Manual verify**

```bash
bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir .emdash/uploads
bun run seed:d1-export
```

Expected: writes `.emdash/d1-import.sql`; no warnings about remaining `sqlite_schema` INSERTs.

---

### Task 4: Upload seed media script

**Files:**
- Create: `scripts/lib/wrangler-swap.ts`
- Create: `scripts/upload-seed-media.ts`

Reference: `git show origin/barOfLegends:scripts/upload-seed-media.ts`

**Interfaces:**
- Consumes: `parseWranglerConfig` from Task 3
- Produces: `runWithWranglerSwap(fn: () => void): void` — copies `wrangler.prod.jsonc` → `wrangler.jsonc`, runs, `git restore wrangler.jsonc` in `finally`

- [ ] **Step 1: Create `scripts/lib/wrangler-swap.ts`**

```ts
import { copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PROD = "wrangler.prod.jsonc";
const ACTIVE = "wrangler.jsonc";

export function runWithWranglerSwap(run: () => number): number {
  copyFileSync(PROD, ACTIVE);
  try {
    return run();
  } finally {
    spawnSync("git", ["restore", ACTIVE], { stdio: "inherit" });
  }
}
```

Exit with error if `wrangler.prod.jsonc` missing when `--remote`.

- [ ] **Step 2: Create `scripts/upload-seed-media.ts`**

Generalize from client:

- Default uploads dir: `.emdash/uploads/`
- Default config: `wrangler.jsonc` for `--local`, parse `wrangler.prod.jsonc` for `--remote` names
- Replace hardcoded `ec_menu_items` / `ec_experiences` with dynamic discovery:

```ts
function discoverContentTables(db: Database): string[] {
  return (
    db
      .query(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ec_%'`)
      .all() as Array<{ name: string }>
  ).map((r) => r.name);
}

function collectRowPatches(db: Database): RowPatch[] {
  const patches: RowPatch[] = [];
  for (const table of discoverContentTables(db)) {
    const columns = db
      .query(`PRAGMA table_info("${table}")`)
      .all() as Array<{ name: string; type: string }>;
    for (const col of columns.filter((c) => c.type.includes("TEXT") || c.type.includes("JSON"))) {
      patches.push(...collectRowPatchesForColumn(db, table, col.name));
    }
  }
  patches.push(...collectRowPatchesForColumn(db, "revisions", "data"));
  return patches;
}
```

- Remote `wrangler d1 execute` and R2 upload: wrap in `runWithWranglerSwap`
- Add `ulidx` as **devDependency** (seed script only — generates `media.id` + R2 `storageKey` as ULIDs). Already transitive via `emdash`; declare explicitly: `bun add -d ulidx`

- [ ] **Step 3: Manual verify (local)**

After dev bypass seeds content:

```bash
bun run seed:media-upload:local --dry-run
```

Expected: lists files from `.emdash/uploads/` referenced in DB (once seed uses `$media.file`).

---

### Task 5: Fix demo-blocks Workers bug

**Files:**
- Modify: `src/plugins/demo-blocks/index.ts`

- [ ] **Step 1: Move `import.meta.url` inside factory**

```ts
export function demoBlocksPlugin(): PluginDescriptor {
  const dir = new URL(".", import.meta.url);
  return {
    id,
    version,
    format: "native",
    entrypoint: new URL("./index.ts", dir).href,
    componentsEntry: new URL("./astro/index.ts", dir).href,
  };
}
```

Remove top-level `const dir = ...`.

---

### Task 6: Site-theme plugin scaffold

**Files:**
- Create: `src/plugins/site-theme/constants.ts`
- Create: `src/plugins/site-theme/index.ts`
- Create: `src/plugins/site-theme/admin.tsx`
- Create: `src/plugins/site-theme/utils/pt-node.ts`
- Create: `src/plugins/site-theme/utils/i18n/en.ts`
- Create: `src/plugins/site-theme/utils/i18n/uk.ts`
- Create: `src/plugins/site-theme/utils/i18n/index.ts`
- Create: `src/plugins/site-theme/astro/index.ts`
- Create: `src/plugins/site-theme/astro/blocks/ExampleBlock.astro`
- Create: `src/plugins/site-theme/astro/theme/SiteHeader.astro`
- Create: `src/plugins/site-theme/astro/theme/SiteFooter.astro`

**Interfaces:**
- Produces: `siteThemePlugin(): PluginDescriptor` — **not** registered in `astro.config.mjs`
- Produces: `getPtNode(props: Record<string, unknown>): PtNode`

- [ ] **Step 1: `constants.ts`**

```ts
export const PLUGIN_ID = "site-theme";
export const PLUGIN_VERSION = "0.1.0";
```

- [ ] **Step 2: `utils/pt-node.ts`**

```ts
export interface PtNode {
  _type: string;
  _key: string;
  [key: string]: unknown;
}

export function getPtNode(props: Record<string, unknown>): PtNode {
  const node = props.node;
  if (!node || typeof node !== "object") {
    throw new Error("Portable Text block expected Astro.props.node");
  }
  return node as PtNode;
}
```

- [ ] **Step 3: `index.ts` descriptor + empty runtime**

```ts
export function siteThemePlugin(): PluginDescriptor {
  const dir = new URL(".", import.meta.url);
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    format: "native",
    entrypoint: new URL("./index.ts", dir).href,
    componentsEntry: new URL("./astro/index.ts", dir).href,
    adminEntry: new URL("./admin.tsx", dir).href,
  };
}

export function createPlugin() {
  return definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    admin: { portableTextBlocks: [] },
  });
}
export default createPlugin;
```

- [ ] **Step 4: `astro/blocks/ExampleBlock.astro`**

Semantic stub using `getPtNode`; comment: no React islands in PT map.

- [ ] **Step 5: `admin.tsx`**

Export stub page component with comment pointing to Kumo + `apiFetch()` pattern.

- [ ] **Step 6: Do not register in `astro.config.mjs`**

Add comment near `demoBlocksPlugin()`:

```js
// Fork: import { siteThemePlugin } from "./src/plugins/site-theme/index.ts";
// plugins: [siteThemePlugin(), demoBlocksPlugin()],
```

---

### Task 7: Seed media — `$media.file` migration

**Files:**
- Create: `seed/media/` (WebP sources)
- Modify: `seed/seed.json`

Reference `$media` blocks at lines ~630, 721, 974 in current seed.

- [ ] **Step 1: Add committed WebP assets**

Create `seed/media/` with files for each featured image currently using Unsplash URLs, e.g.:

- `welcome-featured.webp`
- `seo-demo-featured.webp` (match filenames used in seed)

Source: download from existing Unsplash URLs once, or reuse `src/assets/` if suitable. Keep files small (≤1200px wide WebP).

- [ ] **Step 2: Document copy step in README/SEED-REFERENCE**

Bootstrap copies `seed/media/*` → `.emdash/uploads/` before `emdash seed`:

```bash
mkdir -p .emdash/uploads
cp seed/media/* .emdash/uploads/
bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir .emdash/uploads
```

Optional: add `scripts/prepare-seed-uploads.ts` that copies `seed/media/` → `.emdash/uploads/` (YAGNI — shell `cp` in docs is enough unless agent prefers script).

- [ ] **Step 3: Replace `$media.url` with `$media.file` in `seed/seed.json`**

```json
"featured_image": {
  "$media": {
    "file": "welcome-featured.webp",
    "alt": "Laptop displaying code on a desk"
  }
}
```

Apply to all 6 `$media` occurrences (including darkVariant nested refs).

- [ ] **Step 4: Manual verify**

```bash
rm -rf .wrangler/state
mkdir -p .emdash/uploads && cp seed/media/* .emdash/uploads/
bun dev
# dev bypass URL with content=1
bun run seed:media-upload:local
```

Expected: featured images render on `/posts/welcome` (not raw `$media` JSON).

---

### Task 8: i18n utils + seed translations

**Files:**
- Create: `src/utils/i18n/en.ts`
- Create: `src/utils/i18n/uk.ts`
- Create: `src/utils/i18n/index.ts`
- Modify: `astro.config.mjs` (i18n block)
- Modify: `seed/seed.json`

- [ ] **Step 1: i18n config in `astro.config.mjs`**

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "uk"],
  fallback: { uk: "en" },
},
```

- [ ] **Step 2: Create UI strings**

`en.ts`:

```ts
export interface UiStrings {
  recentPosts: string;
  languageNav: string;
  noPosts: string;
  readMore: string;
}

export const en: UiStrings = {
  recentPosts: "Recent posts",
  languageNav: "Language",
  noPosts: "No posts yet.",
  readMore: "Read more",
};
```

`uk.ts`: Ukrainian equivalents (not Russian).

`index.ts`:

```ts
import { en, type UiStrings } from "./en.ts";
import { uk } from "./uk.ts";

const LOCALES = { en, uk } as const;

export function getUiStrings(locale: string | undefined | null): UiStrings {
  if (locale && locale in LOCALES) return LOCALES[locale as keyof typeof LOCALES];
  return en;
}
```

- [ ] **Step 3: Add seed translations**

Per spec table — add **after** source rows:

1. Pages: `about-uk` / `pro-nas` / `translationOf: "about"` / `locale: "uk"`
2. Posts: `welcome-uk` / `vitayemo` / `translationOf: "welcome"` / `locale: "uk"`
3. Menus: add `id: "primary"`, `locale: "en"` to existing primary; add `primary-uk` row with uk labels and `/uk/…` URLs
4. Taxonomy: uk translation for `guides` term with `label: "Посібники"`

Add explicit `"locale": "en"` on translated source entries.

- [ ] **Step 4: Manual verify**

Reset DB, re-seed, check admin shows locale column and uk translations exist.

---

### Task 9: LanguageSwitcher + locale-aware templates

**Files:**
- Modify: `src/components/LanguageSwitcher.astro`
- Modify: `src/components/SiteHeader.astro`
- Modify: `src/components/SiteFooter.astro`
- Modify: `src/components/WidgetRenderer.astro`
- Modify: `src/components/PostTerms.astro`
- Modify: all pages listed in spec §3

- [ ] **Step 1: Implement `LanguageSwitcher.astro`**

```astro
---
import { getTranslations } from "emdash";
import { getRelativeLocaleUrl } from "astro:i18n";

interface Props {
  collection?: string;
  entryId?: string;
}

const { collection, entryId } = Astro.props;
const locales = ["en", "uk"] as const;
const labels = { en: "EN", uk: "UK" } as const;

let links: Array<{ locale: string; href: string }> = [];

if (collection && entryId) {
  const { translations } = await getTranslations(collection, entryId);
  const published = translations.filter(
    (t): t is typeof t & { slug: string } => t.status === "published" && t.slug !== null,
  );
  links = published.map((t) => ({
    locale: t.locale,
    href: getRelativeLocaleUrl(
      t.locale,
      collection === "pages" ? `/${t.slug}` : `/${collection}/${t.slug}`,
    ),
  }));
} else {
  const path = Astro.url.pathname.replace(/^\/uk(?=\/|$)/, "") || "/";
  links = locales.map((l) => ({
    locale: l,
    href: getRelativeLocaleUrl(l, path),
  }));
}
---
<nav aria-label="Language">
  <ul>
    {links.map((link) => (
      <li>
        <a
          href={link.href}
          hreflang={link.locale}
          aria-current={link.locale === Astro.currentLocale ? "page" : undefined}
        >
          {labels[link.locale as keyof typeof labels] ?? link.locale.toUpperCase()}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

Adjust collection→path mapping to match actual routes (`posts`, `pages`, etc.).

- [ ] **Step 2: Wire SiteHeader**

```ts
const locale = Astro.currentLocale;
const menu = await getMenu("primary", { locale });
```

Render `<LanguageSwitcher collection={...} entryId={...} />` when page passes props via slot or optional header props. Minimal approach: header always shows locale-only switcher; content pages pass collection/entryId through new optional `SiteHeader` props.

- [ ] **Step 3: Locale on all queries**

Pattern for every content page:

```ts
const locale = Astro.currentLocale;
const { entry } = await getEmDashEntry("pages", slug, { locale });
```

Category/tag archives:

```ts
const category = await getTerm("category", slug, { locale, includeCounts: false });
const { entries } = await getEmDashCollection("posts", { locale, status: "published", where: { category: category.slug } });
```

PostTerms:

```ts
getEntryTerms("posts", contentId, "category", { locale: Astro.currentLocale })
```

- [ ] **Step 4: Use `getUiStrings` on home**

`src/pages/index.astro`:

```ts
import { getUiStrings } from "../utils/i18n/index.ts";
const ui = getUiStrings(Astro.currentLocale);
```

Replace hardcoded "Recent posts" etc. with `ui.recentPosts`.

- [ ] **Step 5: Manual verify**

| URL | Expected |
|-----|----------|
| `/` | English home |
| `/uk/` | Ukrainian chrome strings |
| `/about` | English about |
| `/uk/pro-nas` | Ukrainian about page |
| `/posts/welcome` ↔ `/uk/vitayemo` | Switcher links work |

Hub-feedback still present in `Base.astro`.

---

### Task 10: Production deploy documentation

**Files:**
- Create: `docs/CLOUDFLARE-DEPLOYMENT.md`
- Modify: `docs/SEED-REFERENCE.md`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-13-template-backport-design.md` (status → Approved)

Reference: `git show origin/barOfLegends:docs/CLOUDFLARE-DEPLOYMENT.md` — generalize all BOL names.

- [ ] **Step 1: Write `docs/CLOUDFLARE-DEPLOYMENT.md`**

Must include:

- Bindings table (`shittysites-template-CACHE`, `SESSION`, D1, R2, MEDIA)
- `wrangler.jsonc` vs `wrangler.prod.jsonc` (no `preview_id`)
- Swap-and-deploy pattern (never `--config`)
- Known-issues table (KV 429, 10014, import.meta.url, missing images, stale cache, partial D1, config case errors)
- Full bootstrap:

```bash
mkdir -p .emdash/uploads && cp seed/media/* .emdash/uploads/
bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir .emdash/uploads
sqlite3 .emdash/seed-migration.db "UPDATE options SET value='\"https://YOUR-URL\"' WHERE name='site:url';"
bun run seed:d1-export
cp wrangler.prod.jsonc wrangler.jsonc
bunx wrangler d1 execute shittysites-template --remote --file=.emdash/d1-import.sql -y
bun run seed:media-upload
bun run deploy:prod
git restore wrangler.jsonc
```

- Stale KV cache workaround (media alt-text trick)
- `$media.file` preferred; `$media.url` alternative

- [ ] **Step 2: Update `docs/SEED-REFERENCE.md`**

Add sections:

- **Internationalization** (seed rules from spec §3)
- **Seed media** (`$media.file`, `.emdash/uploads/`, script table)
- **Object cache / production** (wizard limits, stale cache after D1 import)

- [ ] **Step 3: Update `AGENTS.md`**

Add to Commands block:

```bash
bun run seed:d1-export
bun run seed:media-upload:local
bun run seed:media-upload
```

Add plugin rules from spec §2c. Update i18n section to reflect `en` + `uk` demo. Link `docs/CLOUDFLARE-DEPLOYMENT.md`. Confirm patch reference is `emdash@0.37.0`.

- [ ] **Step 4: Update `README.md`**

Add production deploy section + wrangler fork flow + i18n demo note. **Keep Hub Feedback section unchanged.**

- [ ] **Step 5: Mark spec approved**

In design spec front matter: `**Status:** Approved`

Update `docs/superpowers/plans/README.md` and `docs/superpowers/specs/README.md`.

---

### Task 11: Final verification pass

- [ ] Run through spec §6 checklist (all 8 items)
- [ ] Run: `bun run typecheck` — no new errors
- [ ] Grep guardrails:

```bash
rg "bar-of-legends|bol-theme" --glob '!docs/superpowers/**'
rg "preview_id" wrangler.jsonc
rg "import\.meta\.url" src/plugins/demo-blocks/index.ts  # should only appear inside factory
```

Expected: no client leaks; no preview_id in template wrangler.

---

## Spec Coverage Checklist

| Spec section | Task |
|--------------|------|
| §1 Config & bindings | Task 1 |
| §1 Wrangler split / swap | Tasks 2, 4, 10 |
| §2 demo-blocks fix | Task 5 |
| §2 site-theme scaffold | Task 6 |
| §2 AGENTS plugin rules | Task 10 |
| §3 i18n demo | Tasks 8, 9 |
| §4 d1-export script | Task 3 |
| §4 upload-seed-media | Task 4 |
| §4 `$media.file` seed | Task 7 |
| §4 docs / gitignore | Tasks 2, 10 |
| §6 verification | Task 11 |
| hub-feedback untouched | All tasks (explicit constraint) |
