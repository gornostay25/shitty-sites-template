# Phase 1 — Template foundation

**Period:** 2026-09-02 – 2026-09-03  
**Commits:** `ef717c3`, `47ee3fb`, `5ea961c`  
**Sources:** [ShittySites template spec](../superpowers/archive/2026-09-03/specs/2026-08-28-shittysites-template-design.md), [Spec 1 plan](../superpowers/archive/2026-09-03/plans/2026-09-02-shittysites-spec1-foundation.md), [Spec 2 plan](../superpowers/archive/2026-09-03/plans/2026-09-02-shittysites-spec2-full-demo.md), [content entry types spec](../superpowers/archive/2026-09-03/specs/2026-09-03-content-entry-types-design.md), [hub-feedback spec](../superpowers/archive/2026-09-03/specs/2026-09-03-hub-feedback-plugin-design.md), git diff (no agent transcripts for this phase)

## Context

The repo began as the **EmDash Marketing starter** — styled marketing blocks, contact/pricing pages, design tokens. The goal was to reshape it into **ShittySites**: an agency base template on EmDash 0.36 + Cloudflare (D1, R2, KV) that ships fully wired but **intentionally unstyled** semantic HTML. Client forks strip unused demo content, add Tailwind, configure site identity in admin.

Bar of Legends was not yet in scope. This phase established the template the BOL site would later fork and heavily modify.

---

## Work log

### 2026-09-02 — `ef717c3` init starter

- **What:** Imported EmDash Marketing starter (~22k lines). Added agent infrastructure (skills, rules, MCP config), `AGENTS.md`, initial `SEED-REFERENCE.md`, and draft ShittySites design spec.
- **Why:** Need a Cloudflare-ready EmDash baseline with AI-agent documentation wired in from day one.
- **How:**
  - Kept Marketing blocks plugin, styled Hero/Pricing/FAQ, `tokens.css` / `theme.css`, astro-iconset
  - Baseline `astro.config.mjs` + `wrangler.jsonc` for Cloudflare
  - Wrote first version of `2026-08-28-shittysites-template-design.md` describing the pivot from Marketing → agency base
- **Decisions:**
  - EmDash on Cloudflare Workers (not Pages) with D1 + R2 + KV
  - Agent skills and MCP for EmDash docs discovery
  - Design spec lives in `docs/superpowers/specs/` (later archived)

---

### 2026-09-03 — `47ee3fb` ShittySites agency base (Spec 1 + Spec 2)

- **What:** Full template ship — stripped Marketing styling, added foundation utilities, demo routes, seed content, and `demo-blocks` native plugin.
- **Why:** Spec 1 = runnable unstyled base; Spec 2 = full EmDash feature demo so agency can fork and delete what clients don't need.
- **How:**

  **Stripped (Marketing → agency base):**
  - Removed `marketing-blocks` plugin, styled block components, contact/pricing pages, design token CSS

  **Spec 1 — Foundation:**
  - `resolveSiteIdentity()` in `src/utils/site-identity.ts` — admin settings → layout props
  - `buildContentSeo()` / `buildStaticPageSeo()` in `src/utils/seo.ts` + `SeoHead.astro`
  - Unstyled `Base.astro` with dark-mode theme switcher demo (Light/Dark/System + anti-FOUC cookie)
  - Shell components: `SiteHeader`, `SiteFooter`, `MenuNav`, `SocialLinks`, `WidgetRenderer`
  - Minimal pages: `index.astro`, `404.astro`
  - KV object cache: `objectCache: kvCache({ defaultTtl: 3600, keyPrefix: "em" })`
  - i18n: English only in `astro.config.mjs`
  - Tailwind wired via `@tailwindcss/vite` but **no utility classes** on demo markup

  **Spec 2 — Full demo:**
  - Expanded `seed/seed.json`: posts, pages (3 layout templates), showcase (16 field types), taxonomies, menus, widgets
  - All content routes: posts, pages, category/tag archives, search, showcase
  - Native `demo-blocks` plugin: `demo.callout`, `demo.cta`, `demo.stats` Portable Text blocks
  - Comments on posts, bylines, LiveSearch in header

  **Content entry types cleanup:**
  - `patches/emdash@0.36.0.patch` — adds `byline` to EmDash type generator (runtime had it; generator omitted it)
  - `PageTemplate` alias in `src/types/content.ts`
  - Removed `as never` / unsafe casts from content pages and `PostMeta.astro`

- **Decisions:**
  - Demo markup stays semantic HTML only — styling is the client's job at fork time
  - Keep `@astrojs/react` wired even though demo pages are Astro-only (needed for future plugins)
  - Never set `prefixDefaultLocale: true` — breaks `/_emdash/admin`
  - Patch EmDash generator for `byline` rather than maintaining local type bridges
  - Fork workflow: delete unused seed sections + matching routes + orphaned components together

- **Problems → fixes:**
  - EmDash 0.36 generator emits `bylines` but not `byline` → upstream patch until fixed in EmDash

---

### 2026-09-03 — `5ea961c` hub-feedback plugin

- **What:** Native EmDash `hub-feedback` plugin integrating Shitty Hub visual feedback widget on public pages.
- **Why:** Agency-internal tool for collecting visual feedback on client preview sites — separate from template core, added post-Spec 2.
- **How:**
  - Plugin at `src/plugins/hub-feedback/` — descriptor, `page:fragments` hook, React island
  - Copied FasterFixes widget UI (`FeedbackProviderCore`, annotation overlay, pins, popover)
  - Admin settings: `hubApiKey`, `siteId` → injected as `data-*` attributes on `#hub-feedback-root`
  - `Base.astro`: `<EmDashBodyEnd>` + `<HubFeedback client:only="react" />`
  - Archived Spec 1/2 docs; added hub-feedback spec + plan to archive
- **Decisions:**
  - Self-hosted Shitty Hub API (`shitty-hub.gornostay25.dev`) — not FasterFixes SaaS
  - Hardcoded widget config (`enabled: true`, `branding: false`) — no custom admin settings page in v1
  - `hubApiKey` exposed in client JS (same as FasterFixes `projectId` pattern)
- **Note:** This plugin was **removed during BOL migration** (phase 2) — out of scope for client sites unless explicitly requested.

---

## Key decisions (summary)

| Decision | Alternatives considered | Rationale |
|----------|------------------------|-----------|
| Unstyled semantic HTML demo | Pre-styled Tailwind components | Agency adds client-specific styling at fork time |
| EmDash 0.36 + Cloudflare Workers | Pages adapter, Node/SQLite | Target platform for all agency sites |
| KV object cache from day one | No cache until production | Demonstrates production pattern; later caused setup wizard issues (phase 4) |
| Patch type generator for `byline` | Local `HydratedEntryFields` bridge | Single fix at source; remove patch when upstream ships |
| `demo-blocks` inline plugin | Publish to plugin registry | Dev reference only; fork deletes if unused |
| hub-feedback as optional plugin | Built into template core | Agency tool, not client feature — later removed for BOL |

---

## Template takeaways

- **Ship a documented fork workflow** in README — which seed sections, routes, components, and plugins to delete together. BOL later deleted most of Spec 2 demo in one pass.
- **Document `prefixDefaultLocale: false`** prominently — easy to break admin with i18n config.
- **Document byline patch lifecycle** — when to add, when to remove after upstream fix (later upgraded to 0.37 patch in phase 3).
- **Object cache + large seed = production risk** — template should warn that setup wizard may fail with many entries + `kvCache` (discovered in phase 4; not addressed in template at this stage).
- **Block Kit limitations** should be documented for plugin authors — no object groups, repeater sub-fields scalar only, no media picker in block modal (hero field workaround needed in phase 3).
- **hub-feedback as optional add-on** was correct — client sites should not inherit agency-internal tooling by default.
- **No `$media.file` production path documented** — seed used file references but EmDash apply engine only resolves `$media.url` (discovered in phase 4).
