# Bar of Legends Theme Migration — Plan Index

> **For agentic workers:** Execute **one part file at a time** (fits context window). Each part is self-contained with prerequisites and handoff. Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` on the **current part only**.

**Goal:** Ship a production EmDash + Astro site for Bar of Legends with native `bol-theme` plugin, CMS collections, en/hu/de i18n — visually matching `docs/design/v1/` with **rewritten** code.

**Architecture:** Monolith native plugin `bol-theme` owns design tokens, header/footer/mobile chrome, five PT block types, venue KV settings + single React `/venue` admin page, and `page:metadata` JSON-LD. Home page is a CMS `pages` entry composed of PT blocks.

**Tech Stack:** Astro 5 (SSR, Cloudflare), EmDash 0.36 (+ byline patch), Tailwind 4, React 19, Leaflet 1.9, Bun

**Spec:** [`../specs/2026-09-05-bol-theme-migration-design.md`](../specs/2026-09-05-bol-theme-migration-design.md)

---

## Official documentation

**Before implementing any part:** verify APIs, hooks, and config against live EmDash docs. Use the [Docs MCP](https://docs.emdashcms.com/docs-mcp/) (`search_docs` on `https://docs.emdashcms.com/mcp`) or [llms.txt index](https://docs.emdashcms.com/llms.txt). Do not rely on training-data recall.

| Area | Doc |
|------|-----|
| Docs MCP setup | [docs-mcp](https://docs.emdashcms.com/docs-mcp/) |
| i18n | [internationalization](https://docs.emdashcms.com/guides/internationalization/) |
| Native plugins | [your-first-native-plugin](https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/) |
| React admin | [react-admin](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/) |
| PT block renderers | [portable-text-components](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/) |
| JSON-LD / metadata | [page-fragments — page:metadata](https://docs.emdashcms.com/plugins/creating-native-plugins/page-fragments/#when-to-use-pagemetadata-instead) |
| Plugin hooks | [hooks](https://docs.emdashcms.com/plugins/creating-plugins/hooks/) |
| Plugin API routes | [api-routes](https://docs.emdashcms.com/plugins/creating-plugins/api-routes/) |
| Plugin settings / KV | [settings](https://docs.emdashcms.com/plugins/creating-plugins/settings/) |
| Block Kit (PT inserter) | [block-kit](https://docs.emdashcms.com/plugins/creating-plugins/block-kit/) |
| Querying content | [querying-content](https://docs.emdashcms.com/guides/querying-content/) |
| Menus | [menus](https://docs.emdashcms.com/guides/menus/) |
| Taxonomies | [taxonomies](https://docs.emdashcms.com/guides/taxonomies/) |
| Site settings / SEO | [site-settings](https://docs.emdashcms.com/guides/site-settings/) |
| Seed + media | [seed-files](https://docs.emdashcms.com/themes/seed-files/) · [creating-themes — including media](https://docs.emdashcms.com/themes/creating-themes/#including-media) |
| Dark mode | [dark-mode](https://docs.emdashcms.com/guides/dark-mode/) |
| Object cache | [object-cache](https://docs.emdashcms.com/deployment/object-cache/) |
| Field types | [field-types](https://docs.emdashcms.com/reference/field-types/) |

Each part file lists **task-specific** doc links below its header.

---

## Global Constraints

Apply to **every part** (full detail in spec):

- **Do not copy** from `docs/design/v1/` — visual/IA reference only
- **No shadcn/ui** on public site; **No Field Kit**; remove **demo-blocks** in Part 5
- Venue facts in **plugin KV settings**; **no opening hours in footer**
- i18n: `locales: ["en", "hu", "de"]`, `fallback: { hu: "en", de: "en" }`, never `prefixDefaultLocale: true`
- JSON-LD via **`page:metadata`** `kind: "jsonld"`
- All content pages: `Astro.cache.set(cacheHint)`; images via `<Image image={...} />`
- **No automated tests** — manual verification per part
- **No legacy shims** — site in active development; schema/KV renames are breaking — never read old keys for backward compatibility
- **Dev server** — assume `bun dev` already running; restart only after `astro.config.mjs` plugin changes
- **Do not git commit** unless user asks

---

## Parts (execute in order)

| Part | File | Tasks | Delivers |
|------|------|-------|----------|
| **1** | [01-foundation.md](./2026-09-05-bol-theme-migration-01-foundation.md) | 1–3 | i18n, tokens, Base shell |
| **2** | [02-plugin-core.md](./2026-09-05-bol-theme-migration-02-plugin-core.md) | 4–8 | `bol-theme` scaffold, venue KV, JSON-LD, `/venue` admin, theme i18n ✅ |
| **3** | [03-seed-chrome.md](./2026-09-05-bol-theme-migration-03-seed-chrome.md) | 9–12 | CMS seed, header/footer/mobile chrome ✅ |
| **4** | [04-blocks.md](./2026-09-05-bol-theme-migration-04-blocks.md) | 13–17 | PT block types + renderers (hero → contact/map) ✅ |
| **5** | [05-pages-ship.md](./2026-09-05-bol-theme-migration-05-pages-ship.md) | 18–21 | Experiences route, demo cleanup, full QA (home route wired in Part 4) |

**Rule:** Finish and verify one part before opening the next. Mark checkboxes in the part file as you go.

---

## Full file map

| Path | Part |
|------|------|
| `astro.config.mjs` | 1, 2, 5 |
| `package.json` | 1, 4 |
| `src/styles/global.css` | 1 |
| `src/layouts/Base.astro` | 1, 3 |
| `src/plugins/bol-theme/**` | 2–5 |
| `seed/seed.json`, `.emdash/uploads/` (WebP), `scripts/generate-bol-seed.ts` | 3 |
| `src/assets/hero.webp` | 4 |
| `src/pages/index.astro` | 4 (home), 5 |
| `src/pages/experiences.astro` | 5 |
| Delete `demo-blocks`, demo routes, `PageDefault`/`PageFullWidth`/`PageSidebar` | 5 |

---

## Spec coverage map

| Spec section | Part(s) |
|--------------|---------|
| i18n | 1, 2, 3, 5 |
| Design tokens + Base | 1 |
| Plugin bol-theme | 2–5 |
| Venue settings + JSON-LD | 2 ✅ |
| Collections seed | 3 |
| Theme chrome | 3 |
| PT blocks | 4 ✅ |
| Home route (`index.astro`) | 4 ✅ |
| Pages + cleanup | 5 |
| Map z-index fix | 4 (Task 17) |
| Manual checklist | 5 (Task 21) |

---

## Execution

1. Open **Part 1** and run all tasks to completion.
2. Confirm prerequisites for Part 2 are met (see part file header).
3. Repeat through Part 5.

**Subagent-driven:** one subagent per **task** within the current part; review between tasks.

**Inline:** run the current part in one session; checkpoint after each task.
