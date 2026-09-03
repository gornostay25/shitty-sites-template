# ShittySites Spec 2 — Full Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand foundation into full EmDash capability demo — comprehensive seed, all page routes, native demo-blocks plugin, widgets/menus/taxonomies/comments/bylines, SEED-REFERENCE.md.

**Architecture:** Kitchen-sink on real routes. Seed drives schema + demo content. Native `demo-blocks` plugin registers Block Kit fields + `componentsEntry` for auto-wired PT renderers. Pages query content with `cacheHint`, render via unstyled semantic markup.

**Tech Stack:** EmDash `@0.36.0`, Astro SSR, Portable Text, Cloudflare Workers

**Spec reference:** `docs/superpowers/specs/2026-08-28-shittysites-template-design.md` (Spec 2 sections)

**Prerequisite:** Spec 1 complete and verified (`docs/superpowers/plans/2026-09-02-shittysites-spec1-foundation.md`)

## Global Constraints

- EmDash `emdash@^0.36.0`
- All CMS pages server-rendered — no `getStaticPaths`
- `Astro.cache.set(cacheHint)` on every page that queries content
- Image fields: `<Image image={...} />` from `emdash/ui` — never string URLs
- `entry.id` = slug (URLs); `entry.data.id` = ULID (Comments, getEntryTerms)
- Taxonomy names exact match seed `"name"` (e.g. `"category"` not `"categories"`)
- Demo markup: no Tailwind utility classes
- Native plugin registration: `demoBlocksPlugin()` factory — not raw `{ id, entrypoint }`
- No automated tests — manual verification from spec § Manual verification

---

### Task 1: Native demo-blocks plugin

**Files:**
- Create: `src/plugins/demo-blocks/index.ts`
- Create: `src/plugins/demo-blocks/astro/index.ts`
- Create: `src/plugins/demo-blocks/astro/Callout.astro`
- Create: `src/plugins/demo-blocks/astro/CtaStrip.astro`
- Create: `src/plugins/demo-blocks/astro/Stats.astro`

**Interfaces:**
- Produces: `demoBlocksPlugin(): PluginDescriptor`, `createPlugin()`, `export default createPlugin`
- Produces: `export const blockComponents` with keys `"demo.callout"`, `"demo.cta"`, `"demo.stats"`

- [ ] **Step 1: Create index.ts with descriptor + runtime**

Copy structure from spec § Demo-blocks plugin. Header comment for AI fork guide.

`portableTextBlocks` array:

```typescript
{
  type: "demo.callout",
  label: "Callout",
  category: "Demo",
  description: "Info or warning callout box",
  fields: [
    { type: "text_input", action_id: "title", label: "Title" },
    { type: "text_input", action_id: "body", label: "Body", multiline: true },
    {
      type: "select",
      action_id: "variant",
      label: "Variant",
      options: [
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
      ],
    },
  ],
},
{
  type: "demo.cta",
  label: "CTA strip",
  category: "Demo",
  fields: [
    { type: "text_input", action_id: "headline", label: "Headline" },
    { type: "text_input", action_id: "buttonLabel", label: "Button label" },
    { type: "text_input", action_id: "buttonUrl", label: "Button URL" },
  ],
},
{
  type: "demo.stats",
  label: "Stats row",
  category: "Demo",
  fields: [
    {
      type: "repeater",
      action_id: "items",
      label: "Stats",
      item_label: "Stat",
      max_items: 6,
      fields: [
        { type: "text_input", action_id: "label", label: "Label" },
        { type: "text_input", action_id: "value", label: "Value" },
      ],
    },
  ],
},
```

- [ ] **Step 2: Create astro/index.ts**

```typescript
import Callout from "./Callout.astro";
import CtaStrip from "./CtaStrip.astro";
import Stats from "./Stats.astro";

export const blockComponents = {
  "demo.callout": Callout,
  "demo.cta": CtaStrip,
  "demo.stats": Stats,
};
```

- [ ] **Step 3: Create unstyled Astro renderers**

**Callout.astro** — props from block data (`title`, `body`, `variant`):
```astro
---
interface Props {
  title?: string;
  body?: string;
  variant?: "info" | "warning";
}
const { title, body, variant = "info" } = Astro.props;
---
<aside data-variant={variant}>
  {title && <h3>{title}</h3>}
  {body && <p>{body}</p>}
</aside>
```

**CtaStrip.astro** — `<section>` with headline + `<a href={buttonUrl}>{buttonLabel}</a>`

**Stats.astro** — `<dl>` iterating `items` array with `<dt>`/`<dd>`

No Tailwind classes. Add file-level comment: fork agents add styling here.

- [ ] **Step 4: Register in astro.config.mjs**

```js
import { demoBlocksPlugin } from "./src/plugins/demo-blocks/index.ts";

// inside emdash({ ... })
plugins: [demoBlocksPlugin()],
```

Remove `plugins: []` placeholder from Spec 1.

- [ ] **Step 5: Manual verify**

`bun dev` starts. Admin → edit a page → slash menu shows Callout, CTA strip, Stats row.

---

### Task 2: Full seed expansion

**Files:**
- Modify: `seed/seed.json` (major rewrite)

**Interfaces:**
- Produces: complete schema matching spec — settings, collections, taxonomies, menus, widgets, sections, bylines, redirects, demo content

- [ ] **Step 1: Settings block**

Use spec values (title, tagline, url, postsPerPage, dateFormat, timezone, social, seo).

- [ ] **Step 2: Collections**

**posts** — supports drafts/revisions/preview/scheduling/search/seo, commentsEnabled, fields with `featured_image` `{ darkVariant: true }`, portableText content, excerpt. 3+ demo entries.

**pages** — template select field, demo entries: `about`, `feature-guide`, one with section embed, one with demo block PT content (all 3 block types).

**showcase** — all 16 field types, single entry `all-fields`, urlPattern `/showcase/{slug}`, image with darkVariant.

- [ ] **Step 3: Taxonomies**

`category` (hierarchical, posts), `tag` (flat, posts), `service-area` (flat, pages).

- [ ] **Step 4: Menus**

`primary` — all item types + nested child. `footer` — flat links.

- [ ] **Step 5: Widget areas**

`sidebar` and `footer` per spec widget list.

- [ ] **Step 6: Sections**

`hero-centered`, `newsletter-cta`, `feature-callout` with keywords.

- [ ] **Step 7: Bylines**

2 profiles (one guest), multi-author on one post.

- [ ] **Step 8: Redirects**

`/old-about` → `/about` (301), `/blog` → `/posts` (308).

- [ ] **Step 9: Reset dev database**

Delete local D1/sqlite dev DB or use fresh wrangler D1 so seed applies. Run `bun dev`, complete admin setup if prompted.

Reference: `.agents/skills/building-emdash-site/references/schema-and-seed.md`, `docs/SEED-REFERENCE.md` (updated in Task 10)

---

### Task 3: Page layout components

**Files:**
- Create: `src/layouts/PageDefault.astro`
- Create: `src/layouts/PageFullWidth.astro`
- Create: `src/layouts/PageSidebar.astro`

**Interfaces:**
- Consumes: `Base.astro`, `<WidgetArea name="sidebar" />` (PageSidebar only)
- Produces: three layout wrappers used by `[slug].astro`

- [ ] **Step 1: PageDefault** — narrow column, `<article><slot /></article>`

- [ ] **Step 2: PageFullWidth** — full-width main, no sidebar

- [ ] **Step 3: PageSidebar** — content column + `<WidgetArea name="sidebar" />`

All wrap content in `Base` via props passthrough for SEO.

---

### Task 4: Shared components

**Files:**
- Create: `src/components/WidgetRenderer.astro` (documents manual widget pattern + comment pointing to WidgetArea)
- Create: `src/components/PostMeta.astro`
- Create: `src/components/PostTerms.astro`
- Create: `src/components/HtmlBlock.astro`
- Create: `src/components/LanguageSwitcher.astro` (commented stub)
- Modify: `src/components/SiteHeader.astro` — add `LiveSearch`

**Interfaces:**
- Produces: post metadata renderers; LiveSearch with `collections={["posts", "pages"]}`

- [ ] **Step 1: PostMeta** — date (formatted via identity.dateFormat), bylines (`post.data.byline`, `post.data.bylines`)

- [ ] **Step 2: PostTerms** — category + tag links via `getEntryTerms`

- [ ] **Step 3: HtmlBlock** — sanitize-html pattern from working-with-content guide

- [ ] **Step 4: LanguageSwitcher** — fully commented stub with i18n instructions

- [ ] **Step 5: SiteHeader** — wire `<LiveSearch collections={["posts", "pages"]} />` with comment on `locale={null}` for cross-locale search (0.36)

---

### Task 5: Content page routes

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/[slug].astro`
- Create: `src/pages/posts/index.astro`
- Create: `src/pages/posts/[slug].astro`
- Create: `src/pages/category/[slug].astro`
- Create: `src/pages/tag/[slug].astro`
- Create: `src/pages/search.astro`
- Create: `src/pages/showcase/[slug].astro`
- Modify: `src/pages/404.astro`

**Interfaces:**
- Consumes: all utils/components from Spec 1 + Task 3–4
- Each page: top-of-file comment block per spec convention (route, features, admin path, docs, fork guidance)

- [ ] **Step 1: index.astro** — recent posts list, link to `/feature-guide`, optional `getSection("newsletter-cta")` demo, `cacheHint`

- [ ] **Step 2: [slug].astro** — layout map:

```astro
const layouts = {
  "Default": PageDefault,
  "Full Width": PageFullWidth,
  "Sidebar": PageSidebar,
};
const Layout = layouts[page.data.template] ?? PageDefault;
```

PortableText with htmlBlock override only — plugin blocks auto-merge.

Preview: `isPreview`, `{...entry.edit}` spreads.

- [ ] **Step 3: posts/index.astro** — pagination via `identity.postsPerPage`, cursor or offset per EmDash API

- [ ] **Step 4: posts/[slug].astro** — Image + darkVariant, PostMeta, PostTerms, Comments + CommentForm with `post.data.id`, portable text, preview banner

- [ ] **Step 5: category/[slug].astro** — `getTerm("category", slug)`, filtered collection

- [ ] **Step 6: tag/[slug].astro** — `getTerm("tag", slug)`

- [ ] **Step 7: search.astro** — search query param, results list, LiveSearch comment

- [ ] **Step 8: showcase/[slug].astro** — render all 16 field types with labels; comment MediaValue shape on image/file fields

- [ ] **Step 9: Every page calls `Astro.cache.set(cacheHint)`** after queries

---

### Task 6: SEED-REFERENCE.md

**Files:**
- Modify: `docs/SEED-REFERENCE.md` (rewrite)

**Interfaces:**
- Produces: seed section → files → doc link → fork keep/delete table

- [ ] **Step 1: Document all seed sections**

Include: settings, collections, taxonomies, menus, widget areas, sections, bylines, redirects, demo-blocks plugin, object cache (config not seed), dark mode (template not seed), media usage tracking (admin one-time step).

---

### Task 7: Final manual verification

Run all 14 checks from spec § Manual verification:

- [ ] 1. `bun dev` — site loads
- [ ] 2. Admin settings editable
- [ ] 3. `/sitemap.xml` with settings.url set
- [ ] 4. `/robots.txt`
- [ ] 5. Search returns results
- [ ] 6. Post: comments, terms, bylines, darkVariant theme swap
- [ ] 7. Full Width page layout
- [ ] 8. Widget areas in sidebar/footer
- [ ] 9. Redirect `/old-about` → `/about`
- [ ] 10. Admin settings change reflects on site
- [ ] 11. No KV binding startup error
- [ ] 12. Theme switcher Light/Dark/System
- [ ] 13. `/feature-guide` renders all 3 demo blocks
- [ ] 14. Admin slash menu shows demo block types

```bash
bun run typecheck
```

Expected: PASS

---

## Spec 2 self-review checklist

| Spec requirement | Task |
|------------------|------|
| Full seed | Task 2 |
| demo-blocks native plugin | Task 1 |
| Page layouts | Task 3 |
| All routes | Task 5 |
| Widgets/menus/search | Task 4, 5 |
| Comments/bylines | Task 5 |
| HtmlBlock + PT | Task 4, 5 |
| SEED-REFERENCE | Task 6 |
| LiveSearch locale comment | Task 4 |
| darkVariant seed fields | Task 2 |
| Manual verification | Task 7 |

---

## Execution notes

- Implement tasks in order — Task 1 before seed content referencing demo blocks
- If seed JSON is large, build incrementally: schema first, content second, verify admin between steps
- Reference EmDash docs MCP (`search_docs`) when API signatures uncertain
- Do not commit unless user requests
