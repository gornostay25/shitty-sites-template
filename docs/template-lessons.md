# Template lessons — ShittySites from Bar of Legends

Action backlog for improving the **ShittySites EmDash agency template**, distilled from building the Bar of Legends production site.

**Source:** [`docs/worklog/`](worklog/) (Sep 2026) — full chronicle of what was done, why, and how.

**Scope:** Reusable template improvements only. Do **not** copy BOL-specific content (collections, seed, theme styling) back into the template wholesale. Extract **patterns, docs, scripts, and config defaults**.

**Apply in:** the ShittySites template repository (or this repo before it is split back into template + client).

---

## 1. Config & bindings

- **Declare SESSION + CACHE KV bindings in `wrangler.jsonc`** — list both under `kv_namespaces`; SESSION binding name must match `sessionKVBindingName` in `astro.config.mjs` (e.g. `bar-of-legends-SESSION`). CACHE alone causes Wrangler auto-provision conflict (`code: 10014`). Evidence: [phase 4](worklog/04-cloudflare-deploy.md#deploy-failure-1--kv-namespace-code-10014).

- **Document `sessionKVBindingName` sync** — template README or deploy doc: adapter adds session KV; root wrangler must declare the same binding string. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#template-takeaways).

- **Warn about object cache + large seed** — `kvCache` + setup wizard applying many entries in one Worker invocation hits KV 429 and subrequest limits. Document upfront; setup wizard is not reliable for large seeds. Evidence: [phase 1](worklog/01-template-foundation.md#template-takeaways), [phase 4](worklog/04-cloudflare-deploy.md#setup-wizard-failure--seed--object-cache).

- **Consider defaulting without `kvCache`, or documenting enable-after-bootstrap** — object cache is safe after CLI import; failure mode is bulk seed in one request. Template can ship cache disabled with a one-line enable step, or keep cache enabled with a prominent deploy runbook. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#template-takeaways).

- **Document EmDash byline patch lifecycle** — when to add `patches/emdash@X.Y.Z.patch`, when to remove after upstream fix; keep `AGENTS.md` patch version in sync. Evidence: [phase 1](worklog/01-template-foundation.md#template-takeaways), [phase 3](worklog/03-bol-hardening.md#template-takeaways).

- **Document `bun patch` recreation on EmDash upgrade** — patch file name must match installed version exactly; recreate, do not rename. Evidence: [phase 3](worklog/03-bol-hardening.md#2026-09-12--c7eb374-emdash-037-upgrade).

- **Upgrade EmDash before first production deploy** — avoid going live on stale version then upgrading. Evidence: [phase 3](worklog/03-bol-hardening.md#template-takeaways).

---

## 2. Plugins & theme pattern

- **Ship a native theme plugin scaffold** — monolith plugin with: descriptor, empty block registry, theme partial stubs, optional KV settings + admin page hook points. Replace “demo-blocks only” as the primary extension pattern. Evidence: [phase 2](worklog/02-bol-migration.md#template-takeaways).

- **Never use top-level `import.meta.url` in plugins** — `new URL(".", import.meta.url)` must live inside the plugin factory function, not at module scope (Workers runtime: `TypeError: Invalid URL string`). Scaffold must demonstrate correct pattern. Evidence: [phase 2](worklog/02-bol-migration.md#template-takeaways), [phase 4](worklog/04-cloudflare-deploy.md#deploy-failure-2--typeerror-invalid-url-string).

- **Document Astro Portable Text block rules** in AGENTS.md or plugin skill:
  - Block components receive **`Astro.props.node`**, not flat props — provide a `getPtNode()` helper in scaffold
  - **No React islands inside PT `components` map** — Astro ignores `client:*` there; use vanilla JS/CSS in blocks or page-level islands via slots. Evidence: [phase 2](worklog/02-bol-migration.md#2026-09-07--post-ship-fix-1-pt-blocks--islands).

- **Document EmDash admin API gaps (0.36+)** — `usePluginAPI`, `Card`, `Input` not exported from `@emdash-cms/admin`; working pattern is `@cloudflare/kumo` form primitives + `apiFetch()` wrapper with `{ success, data }` unwrap. Evidence: [phase 2](worklog/02-bol-migration.md#2026-09-05--part-1--2-foundation--plugin-core--75fdd64).

- **Document Block Kit limitations for plugin authors** — no object groups; repeater sub-fields scalar only; verify `media_picker` support before committing to field types in block definitions. Evidence: [phase 1](worklog/01-template-foundation.md#template-takeaways), [phase 2](worklog/02-bol-migration.md#template-takeaways), [phase 3](worklog/03-bol-hardening.md#template-takeaways).

- **Optional venue-as-KV scaffold** — reusable pattern for structured business facts (hours, phone, address) with a single admin page; not a CMS collection. Ship as commented example or minimal plugin stub. Evidence: [phase 2](worklog/02-bol-migration.md#template-takeaways).

- **Keep agency tools out of default template** — `hub-feedback` was correct as optional add-on; client forks should not inherit agency-internal widgets. Evidence: [phase 1](worklog/01-template-foundation.md#template-takeaways), [phase 2](worklog/02-bol-migration.md#2026-09-05--part-1--2-foundation--plugin-core--75fdd64).

---

## 3. Seed & content model

- **Ship a documented fork checklist** — which seed sections, routes, components, and plugins to delete **together** when adapting for a client. BOL removed ~80% of Spec 2 demo (posts, archives, demo-blocks, hub-feedback, theme switcher). Evidence: [phase 1](worklog/01-template-foundation.md#template-takeaways), [phase 2](worklog/02-bol-migration.md#template-takeaways).

- **Demonstrate multi-locale seed pattern** — row-per-locale content entries + `getUiStrings(locale)` for chrome strings; en-only demo is insufficient for i18n client sites. Evidence: [phase 2](worklog/02-bol-migration.md#template-takeaways).

- **Taxonomy labels from CMS, not i18n** — use `getTaxonomyTerms()` at runtime; i18n keeps structural strings only (`all`, `filterLabel`). Do not duplicate term names in translation files. Evidence: [phase 2](worklog/02-bol-migration.md#2026-09-07--post-ship-fix-3-final-refactor-cms-first-taxonomies).

- **Document `$media.file` vs `$media.url`** — EmDash apply engine resolves `$media.url` only; `$media.file` refs in seed leave raw JSON and no `media` rows until manually uploaded. Template seed should use `$media.url` or document the upload script requirement. Evidence: [phase 1](worklog/01-template-foundation.md#template-takeaways), [phase 4](worklog/04-cloudflare-deploy.md#media-upload--mediafile-gap-scriptsupload-seed-mediats).

- **Document when to write a seed generator script** — hand-editing large `seed.json` does not scale; client-specific generators (like `generate-bol-seed.ts`) are valid; template should explain the trade-off. Evidence: [phase 2](worklog/02-bol-migration.md#template-takeaways).

- **Verify Block Kit field types before ship** — migrating hero `text_input` → `media_picker` post-ship was low-cost but avoidable with upfront verification. Evidence: [phase 3](worklog/03-bol-hardening.md#2026-09-10--4be3086-hero-media-picker--archive-migration-docs).

---

## 4. Production deploy

- **Ship CLI seed → D1 import as primary production bootstrap** — documented pipeline for templates with large seeds + object cache; setup wizard is fallback for small seeds only. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#seed-migration-pipeline-design).

- **Ship `scripts/d1-export-seed-db.ts` (or equivalent)** — raw `sqlite3 .dump` breaks on D1 (FTS5 `sqlite_schema` inserts, pragmas, shadow tables). Template with search/FTS tables needs a sanitizer script. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#d1-import--iterative-exporter-fixes-scriptsd1-export-seed-dbts).

- **Ship `scripts/upload-seed-media.ts` (or equivalent)** — if seed uses local WebP in `.emdash/uploads/` with `$media.file` refs: upload to R2, insert `media` rows, patch content JSON. Support `--local` (live dev D1 from `.wrangler/`) and `--remote` (production). Evidence: [phase 4](worklog/04-cloudflare-deploy.md#media-upload--mediafile-gap-scriptsupload-seed-mediats).

- **Document stale KV cache after direct D1 SQL** — public site may lag admin after import. Fix: **Media library** → open any photo → add alt text → save → remove alt → save again. Or re-save affected content entries. Or wait for `defaultTtl`. No bulk KV purge tooling needed. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#stale-object-cache--no-image-persists-on-live-site).

- **Document D1 reset procedure** — failed setup wizard leaves partial data; import only into empty D1. Reset: `wrangler d1 delete` + `d1 create`, update `database_id` in wrangler config. DROP-all scripts unreliable. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#template-takeaways).

- **Gitignore migration artifacts** — `.emdash/seed-migration.db`, `d1-import.sql`, `d1-media-patch.sql`, etc. Regenerate via scripts; do not commit. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#documentation--gitignore).

- **Add npm scripts** — `seed:d1-export`, `seed:media-upload:local` (dev), `seed:media-upload` (production) in template `package.json` when scripts ship. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#documentation--gitignore).

---

## 5. Documentation & agent workflow

- **Add deploy known-issues table to template docs** — six failure modes from BOL are template-level, not client-specific: wizard seed fail, KV 10014, `import.meta.url`, missing images, stale cache, partial D1. See [`CLOUDFLARE-DEPLOYMENT.md`](CLOUDFLARE-DEPLOYMENT.md) as reference implementation. Evidence: [phase 4](worklog/04-cloudflare-deploy.md#template-takeaways).

- **Add archive-specs-plans to ship checklist** — when a feature ships, move specs/plans to `docs/superpowers/archive/`, update READMEs, set status headers. Evidence: [phase 3](worklog/03-bol-hardening.md#template-takeaways).

- **Keep `AGENTS.md` accurate** — patch version, deploy scripts, plugin patterns, PT block rules; agents rely on it. Evidence: [phase 3](worklog/03-bol-hardening.md#template-takeaways).

- **Expand README fork workflow** — link to deploy runbook, seed scripts, and this lessons doc. Evidence: [phase 1](worklog/01-template-foundation.md#template-takeaways).

- **Cross-link worklog ↔ lessons** — worklog = chronicle; this file = actionable backlog. Evidence: [worklog README](worklog/README.md).
- **Document design → EmDash pipeline** — two-pipeline model, component mapping, PT/island rules. Evidence: [design migration worklog](worklog/05-design-migration.md).

---

## 6. Keep as-is (worked well)

These template decisions validated by BOL — preserve in future template versions:

- **Unstyled semantic HTML demo** — client adds Tailwind at fork time; no pre-baked design system in template.
- **`demo-blocks` as dev reference** — inline native plugin demonstrating Block Kit; fork deletes if unused.
- **KV object cache after bootstrap** — safe for normal admin edits and page views; only bulk seed in one Worker request is the failure mode.
- **Monolith theme plugin architecture** — one plugin for blocks + theme partials + settings + admin scales well for agency client sites.
- **Server-rendered everything** — no `getStaticPaths()` for CMS content; matches EmDash + Cloudflare model.
- **Patch over type casts** — `patches/emdash@X.Y.Z.patch` for generator gaps cleaner than `as never` bridges in every page.
- **Optional plugins separated from core** — hub-feedback proved the pattern; agency tools stay out of client default.

---

## Next steps

1. Prioritize sections 1 and 4 for template repo — highest pain on first production deploy.
2. Implement plugin scaffold (section 2) before next client fork.
3. Track upstream EmDash issues: setup wizard + kvCache + bulk seed; `$media.file` in apply engine; byline in type generator.

Full history: [`docs/worklog/README.md`](worklog/README.md).
