# ShittySites Spec 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Marketing template shell with ShittySites foundation — config (D1 + R2 + KV cache), identity, SEO, unstyled Base layout with dark-mode demo, Tailwind wired, docs updated. Site runs on `bun dev` with minimal pages.

**Architecture:** Strip Marketing-specific code first. Add EmDash 0.36 Cloudflare config with `kvCache`. Centralize site identity and SEO in utils/components. Base layout composes header/footer with theme switcher per [Dark Mode guide](https://docs.emdashcms.com/guides/dark-mode/). Leave `plugins: []` until Spec 2 adds `demo-blocks`.

**Tech Stack:** Astro 7 SSR, EmDash `@0.36.0`, Cloudflare (D1/R2/KV), `@tailwindcss/vite`, `@astrojs/react` (wired, no demo React pages), Bun

**Spec reference:** `docs/superpowers/specs/2026-08-28-shittysites-template-design.md` (Spec 1 sections)

## Global Constraints

- EmDash `emdash@^0.36.0`, `@emdash-cms/cloudflare@^0.36.0`
- `output: "server"` — no `getStaticPaths` for CMS routes
- Demo markup: semantic HTML only — **no Tailwind utility classes** on template markup
- Use Bun (`bun install`, `bun dev`, `bunx wrangler`)
- Keep `@astrojs/react`, `react`, `react-dom` in `package.json` and `react()` in `astro.config.mjs`
- No automated tests — manual verification gates only
- Do not add `mediaUsageCron` to wrangler or astro config
- i18n: `defaultLocale: "en"`, `locales: ["en"]` — never `prefixDefaultLocale: true`

---

### Task 1: Remove Marketing template artifacts

**Files:**
- Delete: `src/plugins/marketing-blocks/index.ts`
- Delete: `src/components/MarketingBlocks.astro`
- Delete: `src/components/blocks/` (entire directory)
- Delete: `src/pages/pricing.astro`, `src/pages/contact.astro`
- Delete: `src/styles/tokens.css`, `src/styles/theme.css`
- Modify: `package.json` (remove `astro-iconset`, `@iconify-json/ph` only — **keep** `@astrojs/react`, `react`, `react-dom`)
- Modify: `astro.config.mjs` (remove icon integration and marketing-blocks plugin; **keep** `react()` integration)

**Interfaces:**
- Produces: clean tree ready for ShittySites files; no marketing imports remain

- [ ] **Step 1: Delete marketing files listed above**

- [ ] **Step 2: Remove icon deps from package.json**

Remove from `dependencies`:
```json
"astro-iconset",
"@iconify-json/ph"
```

Keep `@astrojs/react`, `react`, and `react-dom`. Remove `astro-iconset` vite `optimizeDeps` entry when updating astro.config in Task 4.

- [ ] **Step 3: Run install**

```bash
bun install
```

Expected: lockfile updates, no missing peer errors for removed packages.

- [ ] **Step 4: Manual verify**

```bash
bun run typecheck
```

Expected: may fail on broken imports in remaining files — fixed in later tasks. No references to deleted marketing paths in config.

---

### Task 2: Add Tailwind and template identity

**Files:**
- Modify: `package.json`
- Modify: `seed/seed.json` (meta block only for now)

**Interfaces:**
- Produces: `emdash.label: "ShittySites Template"`; tailwind deps installed

- [ ] **Step 1: Update package.json emdash label and add Tailwind**

```json
{
  "emdash": {
    "label": "ShittySites Template",
    "seed": "seed/seed.json"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

Keep existing `emdash` and `@emdash-cms/cloudflare` at `^0.36.0`.

- [ ] **Step 2: Update seed meta**

```json
"meta": {
  "name": "ShittySites Template",
  "description": "Agency base template — full EmDash reference, unstyled on purpose",
  "author": "EmDash"
}
```

- [ ] **Step 3: Install**

```bash
bun install
```

---

### Task 3: Cloudflare KV binding

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `worker-configuration.d.ts` (if generated types need CACHE — run dev to regenerate)

**Interfaces:**
- Produces: `CACHE` KV binding available to Worker

- [ ] **Step 1: Create KV namespace locally**

```bash
bunx wrangler kv namespace create CACHE
```

Copy the printed `id` from output.

- [ ] **Step 2: Add to wrangler.jsonc**

```jsonc
"kv_namespaces": [
  { "binding": "CACHE", "id": "<paste-namespace-id>" }
],
```

Also rename `name` from `my-marketing-site` to `shittysites-template` (and matching D1/R2 names if desired).

- [ ] **Step 3: Confirm no mediaUsageCron**

Ensure wrangler has only the general maintenance cron — no dedicated media usage cron.

---

### Task 4: astro.config.mjs foundation

**Files:**
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: Tailwind vite plugin, i18n, D1 + R2 + kvCache; `plugins: []` placeholder

- [ ] **Step 1: Replace astro.config.mjs**

```js
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { d1, r2, kvCache } from "@emdash-cms/cloudflare";
import emdash from "emdash/astro";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: { plugins: [tailwindcss()] },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  integrations: [
    react(), // kept — client islands / native plugin React admin UI; demo pages are Astro-only
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      objectCache: kvCache({
        binding: "CACHE",
        defaultTtl: 3600,
        keyPrefix: "em",
      }),
      // Spec 2 adds: plugins: [demoBlocksPlugin()]
      plugins: [],
    }),
  ],
  devToolbar: { enabled: false },
});
```

Add the full object-cache comment block from the spec above `objectCache`.

- [ ] **Step 2: Manual verify**

```bash
bun dev
```

Expected: dev server starts without KV binding error (requires Task 3 complete).

---

### Task 5: global.css

**Files:**
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: Tailwind import + minimal light-dark tokens

- [ ] **Step 1: Create global.css**

```css
@import "tailwindcss";

/* Minimal tokens for theme switcher demo — not a design system */
:root {
  color-scheme: light dark;
  --color-bg: light-dark(#ffffff, #0d0d0d);
  --color-text: light-dark(#1a1a1a, #ededed);
}
:root.light {
  color-scheme: light;
}
:root.dark {
  color-scheme: dark;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

---

### Task 6: site-identity.ts

**Files:**
- Create: `src/utils/site-identity.ts`

**Interfaces:**
- Produces: `resolveSiteIdentity(settings: Partial<SiteSettings>): SiteIdentity`
- Consumes: `SiteSettings` type from EmDash (import from `emdash` or generated types)

- [ ] **Step 1: Implement resolveSiteIdentity**

```typescript
import type { SiteSettings } from "emdash";

const FALLBACK = {
  siteTitle: "ShittySites Demo",
  siteTagline: "Full EmDash capability reference — unstyled on purpose",
  siteUrl: "http://localhost:4321",
  postsPerPage: 10,
  dateFormat: "MMMM d, yyyy",
  timezone: "UTC",
} as const;

export interface SiteIdentity {
  /** Settings → General → Site title */
  siteTitle: string;
  /** Settings → General → Tagline */
  siteTagline: string;
  /** Settings → General → Logo (media object or null) */
  siteLogo: SiteSettings["logo"] | null;
  /** Settings → General → Favicon */
  siteFavicon: SiteSettings["favicon"] | null;
  /** Settings → General → Site URL — required for sitemap/canonical */
  siteUrl: string;
  social: SiteSettings["social"];
  seo: SiteSettings["seo"];
  postsPerPage: number;
  dateFormat: string;
  timezone: string;
}

export function resolveSiteIdentity(
  settings: Partial<SiteSettings> | null | undefined,
): SiteIdentity {
  return {
    siteTitle: settings?.title?.trim() || FALLBACK.siteTitle,
    siteTagline: settings?.tagline?.trim() || FALLBACK.siteTagline,
    siteLogo: settings?.logo ?? null,
    siteFavicon: settings?.favicon ?? null,
    siteUrl: settings?.url?.trim() || FALLBACK.siteUrl,
    social: settings?.social ?? {},
    seo: settings?.seo ?? {},
    postsPerPage: settings?.postsPerPage ?? FALLBACK.postsPerPage,
    dateFormat: settings?.dateFormat ?? FALLBACK.dateFormat,
    timezone: settings?.timezone ?? FALLBACK.timezone,
  };
}
```

Adjust field types to match actual `SiteSettings` from running `bun dev` / `emdash-env.d.ts` if names differ.

---

### Task 7: SEO utils and SeoHead

**Files:**
- Create: `src/utils/seo.ts`
- Create: `src/components/SeoHead.astro`

**Interfaces:**
- Produces: `buildContentSeo(...)`, `buildStaticPageSeo(...)` wrapping `getSeoMeta` from `emdash/seo`

- [ ] **Step 1: Create seo.ts**

```typescript
import { getSeoMeta } from "emdash/seo";
import type { SiteIdentity } from "./site-identity";

export function buildStaticPageSeo(opts: {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  identity: SiteIdentity;
}) {
  const { identity, path, title, description, image } = opts;
  const canonical = new URL(path, identity.siteUrl).href;
  return getSeoMeta({
    title: title ?? identity.siteTitle,
    description: description ?? identity.siteTagline,
    canonical,
    image,
    siteTitle: identity.siteTitle,
    siteUrl: identity.siteUrl,
    seo: identity.seo,
  });
}

export function buildContentSeo(opts: {
  entry: { data: { title?: string; excerpt?: string; seo?: Record<string, unknown> } };
  path: string;
  identity: SiteIdentity;
  image?: string;
}) {
  const { entry, path, identity, image } = opts;
  const canonical = new URL(path, identity.siteUrl).href;
  return getSeoMeta({
    title: entry.data.title,
    description: entry.data.excerpt,
    canonical,
    image,
    siteTitle: identity.siteTitle,
    siteUrl: identity.siteUrl,
    seo: { ...identity.seo, ...entry.data.seo },
  });
}
```

Verify `getSeoMeta` signature against EmDash docs if types complain.

- [ ] **Step 2: Create SeoHead.astro**

Props: spread result of `buildContentSeo` / `buildStaticPageSeo` — render `<title>`, meta description, canonical, OG tags, robots. Use patterns from EmDash site-settings guide. No hardcoded site name.

---

### Task 8: Shell components (unstyled)

**Files:**
- Create: `src/components/MenuNav.astro`
- Create: `src/components/SocialLinks.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`

**Interfaces:**
- Consumes: `resolveSiteIdentity`, `getMenu("primary")`, `getMenu("footer")`
- Produces: semantic nav/header/footer; `LiveSearch` stub comment in header (wired in Spec 2)

- [ ] **Step 1: MenuNav.astro**

Render flat + nested menu items recursively from `MenuItem[]`. Semantic `<nav><ul><li>`. No Tailwind classes.

- [ ] **Step 2: SocialLinks.astro**

Render links from `identity.social` (twitter, github, etc.) when handles present.

- [ ] **Step 3: SiteHeader.astro**

Logo via `<Image>` from `emdash/ui` when `siteLogo` set, else text title. Primary menu via `MenuNav`. Placeholder comment for LiveSearch (Spec 2).

- [ ] **Step 4: SiteFooter.astro**

Footer menu, social links, copyright with `siteTitle`. Theme switcher markup lives in Base, not here.

---

### Task 9: Base.astro refactor

**Files:**
- Modify: `src/layouts/Base.astro` (rewrite)

**Interfaces:**
- Consumes: `resolveSiteIdentity`, `getSiteSettings`, `SiteHeader`, `SiteFooter`, `SeoHead`, `createPublicPageContext`, `EmDashHead`
- Produces: layout shell with theme switcher + head anti-FOUC script

- [ ] **Step 1: Rewrite Base.astro**

Key requirements from spec:
- Import `../styles/global.css` (remove tokens.css/theme.css)
- Top-of-file AI comment block for theme fork (copy from spec)
- Inline `<head>` cookie script (copy from [Dark Mode guide](https://docs.emdashcms.com/guides/dark-mode/))
- Props: `title`, `description`, `image`, `canonical`, optional `content` for page contributions
- `<main><slot /></main>`
- Footer theme switcher: three `<button type="button">` Light / Dark / System — unstyled
- Client script: read/set `theme` cookie, toggle `light`/`dark` on `document.documentElement`
- `<!-- Apply Tailwind classes when theming a client site -->` comment in markup
- Remove all scoped marketing CSS (600+ lines) — no gradients, no sticky styled header

- [ ] **Step 2: Manual verify**

```bash
bun dev
```

Open `http://localhost:4321` — page loads, theme buttons toggle `<html class="light|dark">`, System clears class.

---

### Task 10: Minimal pages for Spec 1 checkpoint

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/404.astro`

**Interfaces:**
- Consumes: `Base.astro`, `resolveSiteIdentity`, `getSiteSettings`

- [ ] **Step 1: Simplify index.astro**

```astro
---
import Base from "../layouts/Base.astro";
import { getSiteSettings } from "emdash";
import { resolveSiteIdentity } from "../utils/site-identity";
import { buildStaticPageSeo } from "../utils/seo";

const settings = await getSiteSettings();
const identity = resolveSiteIdentity(settings);
const seo = buildStaticPageSeo({
  title: "Home",
  path: "/",
  identity,
});
---
<Base {...seo}>
  <article>
    <h1>{identity.siteTitle}</h1>
    <p>{identity.siteTagline}</p>
    <p>ShittySites foundation — Spec 2 adds full demo routes.</p>
  </article>
</Base>
```

- [ ] **Step 2: Update 404.astro** to use new Base + identity pattern.

- [ ] **Step 3: Spec 1 manual verification**

1. `bun dev` — home loads, unstyled semantic HTML
2. `/_emdash/admin` — accessible
3. Theme switcher works
4. No console errors for missing CACHE binding
5. `bun run typecheck` passes

---

### Task 11: README and AGENTS.md

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Produces: fork workflow (7 steps), KV setup, media usage tracking explanation, object cache tuning notes

- [ ] **Step 1: Update README.md** per spec Spec 1 README section

Include:
- ShittySites purpose
- Fork workflow including plugin removal step
- `bunx wrangler kv namespace create CACHE`
- Media usage: Settings → Media usage tracking, keep tab open until Ready, no cron
- Link to spec and SEED-REFERENCE (Spec 2)

- [ ] **Step 2: Update AGENTS.md § ShittySites Template**

File map, feature → doc table (object cache, dark mode, plugins placeholder), SSR rules, `entry.id` vs `entry.data.id`, cacheHint rule.

---

## Spec 1 self-review checklist

| Spec requirement | Task |
|------------------|------|
| Template identity rename | Task 2 |
| astro.config Tailwind + i18n + kvCache | Task 4 |
| wrangler KV binding | Task 3 |
| site-identity.ts | Task 6 |
| SEO pipeline | Task 7 |
| Base + theme switcher | Task 9 |
| global.css | Task 5 |
| README + AGENTS | Task 11 |
| Strip Marketing | Task 1 |
| Working dev server | Task 10 |

**Handoff:** When Spec 1 verification passes, proceed to `docs/superpowers/plans/2026-09-02-shittysites-spec2-full-demo.md`.
