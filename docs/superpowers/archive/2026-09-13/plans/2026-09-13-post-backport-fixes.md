# Post-Backport Fixes Implementation Plan

**Status:** Implemented (archived 2026-09-13) — spec at [`../specs/2026-09-13-post-backport-fixes-design.md`](../specs/2026-09-13-post-backport-fixes-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix UK locale 404s and Hub Feedback widget regression after template backport.

**Architecture:** Enable Astro `fallbackType: "rewrite"` for EmDash single-template i18n; add BOL-style locale slug guard on root `[slug].astro`; locale-aware 404 redirects; load Hub credentials via Vite `loadEnv()` in `astro.config.mjs`.

**Tech Stack:** Astro 7.3, EmDash 0.37, Vite `loadEnv`, `astro:i18n`

## Global Constraints

- No test files or test infrastructure
- Do not modify `src/hub-feedback/**` widget code
- Do not enable `prefixDefaultLocale` (breaks `/_emdash/admin`)
- Keep non-default locales list in sync: `astro.config.mjs` and `src/utils/i18n/locales.ts`
- No git commits unless user asks

---

### Task 1: Astro config — i18n rewrite + Hub env

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1:** Add `import { loadEnv } from "vite"` and replace `process.env.HUB_*` with `loadEnv(...)` result
- [ ] **Step 2:** Add `routing: { fallbackType: "rewrite" }` under `i18n`
- [ ] **Step 3:** Restart dev server; curl `-I http://localhost:4321/uk/` — expect 200 not 302 to `/404`

### Task 2: Locale utilities

**Files:**
- Create: `src/utils/i18n/locales.ts`
- Modify: `src/utils/i18n/index.ts`

**Interfaces:**
- Produces: `isNonDefaultLocale(slug: string): boolean`, `redirectToNotFound(): Response`

- [ ] **Step 1:** Create `locales.ts` with `NON_DEFAULT_LOCALES = ["uk"]` and `isNonDefaultLocale()`
- [ ] **Step 2:** Add `redirectToNotFound()` using `getRelativeLocaleUrl(Astro.currentLocale ?? "en", "/404")`

### Task 3: Root slug guard + locale 404 redirects

**Files:**
- Modify: `src/pages/[slug].astro`
- Modify: `src/pages/posts/[slug].astro`
- Modify: `src/pages/category/[slug].astro`
- Modify: `src/pages/tag/[slug].astro`
- Modify: `src/pages/showcase/[slug].astro`
- Modify: `src/pages/404.astro`

- [ ] **Step 1:** In `[slug].astro`, import guard; `Astro.rewrite("/")` when slug is a non-default locale home (`/uk`, `/uk/`); replace `/404` redirects with `redirectToNotFound()`
- [ ] **Step 2:** Replace `/404` redirects in other dynamic pages with `redirectToNotFound()`
- [ ] **Step 3:** Fix 404 page “Go home” with `getRelativeLocaleUrl`

### Task 4: Documentation

**Files:**
- Modify: `AGENTS.md`, `docs/SEED-REFERENCE.md`, `README.md`
- Modify: `docs/superpowers/specs/README.md`, `docs/superpowers/plans/README.md`
- Modify: [`../specs/2026-09-13-template-backport-design.md`](../specs/2026-09-13-template-backport-design.md) (rewrite caveat)

- [ ] **Step 1:** Document `fallbackType: "rewrite"` requirement and Hub Feedback restart note

### Task 5: Verification

- [ ] **Step 1:** `bun run typecheck`
- [ ] **Step 2:** Manual: `/`, `/uk/`, Hub Feedback button, UK switcher
