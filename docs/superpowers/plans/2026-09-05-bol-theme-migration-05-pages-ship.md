# BOL Migration — Part 5: Pages + Ship

> **Part 5 of 5** · Index: [2026-09-05-bol-theme-migration.md](./2026-09-05-bol-theme-migration.md) · Spec: [design doc](../specs/2026-09-05-bol-theme-migration-design.md)

**Prerequisites:** Part 4 complete (all PT blocks render on home).

**Delivers:** `/experiences` route, demo template removed, full manual QA pass. Home route (`/`, `/hu/`, `/de/`) already wired in Part 4.

**Next:** None — migration complete after Task 21.

---

## Official documentation

Verify against live docs ([Docs MCP](https://docs.emdashcms.com/docs-mcp/) · [llms.txt](https://docs.emdashcms.com/llms.txt)) before implementing.

| Task | Read first |
|------|------------|
| 18 — home | [Querying content](https://docs.emdashcms.com/guides/querying-content/) · [Portable Text components](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/) · [Internationalization](https://docs.emdashcms.com/guides/internationalization/) |
| 19 — experiences | [Querying content](https://docs.emdashcms.com/guides/querying-content/) · [Taxonomies](https://docs.emdashcms.com/guides/taxonomies/) |
| 18–19 — SEO | [Site settings](https://docs.emdashcms.com/guides/site-settings/) |
| 20 — cleanup | [Your first native plugin](https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/) (plugin registration) |

**Project skills:** `.agents/skills/building-emdash-site/references/querying-and-rendering.md` · `site-features.md`

---

## Files touched in this part

| Path | Responsibility |
|------|----------------|
| `src/pages/index.astro` | Home — done Part 4 ✅ |
| `src/pages/[slug].astro` | CMS pages — single `<article>` layout (no template map) ✅ |
| `src/pages/experiences.astro` | Experiences catalog |
| `src/plugins/bol-theme/astro/islands/ExperienceFilter.tsx` | Filter chips |
| `src/plugins/bol-theme/astro/components/ExperienceCard.astro` | Card layout |
| `astro.config.mjs` | Remove `demoBlocksPlugin()` |
| Delete | `src/plugins/demo-blocks/`, demo routes, old ShittySites components |

**Already removed (Part 4 / schema cleanup):** `PageDefault.astro`, `PageFullWidth.astro`, `PageSidebar.astro`, `src/types/content.ts` (`PageTemplate`).

---

## Task 18: Home page route

**Files:**
- Modify: `src/pages/index.astro` — **shipped Part 4**

- [x] **Step 1: Query home page entry** — `getEmDashEntry("pages", "home", { locale })`, set cacheHint

- [x] **Step 2: Render PT content** through bol-theme `blockComponents` (auto-wired)

- [x] **Step 3: SEO** via `buildContentSeo` + Base / SeoHead

- [ ] **Step 4: Manual check** — `/`, `/hu/`, `/de/` show translated home when seeded

---

## Task 19: Experiences page

**Files:**
- Create: `src/pages/experiences.astro`
- Create: `src/plugins/bol-theme/astro/islands/ExperienceFilter.tsx`
- Create: `src/plugins/bol-theme/astro/components/ExperienceCard.astro`

- [ ] **Step 1: Query experiences collection** with locale + cacheHint

- [ ] **Step 2: Rewrite filter chips + card grid** — no shadcn

- [ ] **Step 3: CTAs by `cta_type`**: tel, mailto, ask-at-bar copy

- [ ] **Step 4: Manual check** — filters work, 6 cards, responsive grid

---

## Task 20: Remove demo routes and demo-blocks

**Files:**
- Delete: `src/plugins/demo-blocks/`
- Delete or redirect: `src/pages/posts/`, `src/pages/showcase/`, `src/pages/category/`, `src/pages/tag/`, demo `src/pages/search.astro` if unused
- Modify: `astro.config.mjs` — remove `demoBlocksPlugin()`
- Delete: `src/components/SiteHeader.astro`, `SiteFooter.astro` if still present

- [ ] **Step 1: Remove demo-blocks plugin registration**

- [ ] **Step 2: Delete orphaned pages/components** per fork rules (seed section + routes + components together)

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: 0 errors in BOL-owned files (legacy showcase routes may remain until deleted).

---

## Task 21: Full manual QA pass

**Files:** none (verification only)

- [ ] Run through **every item** in spec manual verification checklist (375px + 1440px, en/hu/de)

- [ ] Fix any regressions before marking complete

- [ ] Update spec status to **Implemented** (only if user asks for doc housekeeping)

---

## Part 5 / migration completion gate

- [x] Home route live (`index.astro`)
- [ ] Experiences live in all locales
- [ ] demo-blocks and ShittySites demo routes removed
- [ ] `bun run typecheck` passes on shipped surface
- [ ] Spec manual checklist complete
- [ ] **Bar of Legends migration shipped**
