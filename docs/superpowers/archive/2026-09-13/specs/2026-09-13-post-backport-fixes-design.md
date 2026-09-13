# Post-Backport Fixes — Design Spec

**Status:** Implemented (archived 2026-09-13) — plan at [`../plans/2026-09-13-post-backport-fixes.md`](../plans/2026-09-13-post-backport-fixes.md)  
**Date:** 2026-09-13  
**Scope:** Fix i18n routing (UK → 404) and Hub Feedback widget regression after template backport

**Supersedes (partially):** [`../specs/2026-09-13-template-backport-design.md`](../specs/2026-09-13-template-backport-design.md) — i18n routing for EmDash single-template sites

---

## Problem

After the template backport (i18n demo + KV bindings), two regressions appear in local dev:

1. **Language switcher:** `/uk/` returns 404. EN link works; UK link hits `/404`.
2. **Hub Feedback:** Widget no longer renders on public pages despite `.env` credentials and `<HubFeedback />` in `Base.astro`.

User confirmed Hub Feedback worked before the backport (regression, not first-time setup).

---

## Root causes

### i18n

1. **Route collision:** With `prefix-other-locales`, `/uk/` is matched by `src/pages/[slug].astro` with `slug = "uk"` before Astro can treat it as a locale-prefixed home URL. CMS lookup fails → `Astro.redirect("/404")` (302, not HTTP 404).
2. **Missing rewrite fallback:** EmDash uses a **single set of page templates** with `locale: Astro.currentLocale` — not duplicate files under `src/pages/uk/`. Astro’s default `fallbackType: "redirect"` strips the `/uk` prefix on missing locale folders (`/uk/about` → `/about`), losing locale context.
3. **Hardcoded 404 redirects:** `Astro.redirect("/404")` ignores active locale.

The backport design stated “Astro serves `/uk/…` prefixed routes automatically — no duplicate page files.” That is incomplete: **`routing.fallbackType: "rewrite"` is required** for the EmDash single-template pattern.

Bar of Legends already used a locale slug guard in `[slug].astro` for `hu`/`de`; the template backport did not generalize this.

### Hub Feedback

- `vite.define` block in `astro.config.mjs` was **not removed**, but `__HUB_FEEDBACK_CONFIG__` is `null` in the browser bundle after the backport.
- `resolveHubFeedbackConfig()` works when `.env` is loaded (verified via Bun), but Astro config evaluation may run before env is available on dev-server restart/HMR after `astro.config.mjs` changes.
- Fix: use Vite `loadEnv()` in `astro.config.mjs` so credentials are read reliably when the config is evaluated.

---

## Solution

### 1. Astro i18n — rewrite fallback

**File:** `astro.config.mjs`

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "uk"],
  fallback: { uk: "en" },
  routing: {
    fallbackType: "rewrite",
  },
},
```

Rewrites missing `src/pages/uk/*` routes to the root templates with `Astro.currentLocale = "uk"`.

### 2. Locale slug guard (BOL pattern)

**New:** `src/utils/i18n/locales.ts` — non-default locale codes (must stay in sync with `astro.config.mjs` `locales` minus `defaultLocale`).

**Modify:** `src/pages/[slug].astro` — before CMS lookup:

```ts
if (slug && isNonDefaultLocale(slug)) {
  const normalized = Astro.url.pathname.replace(/\/$/, "") || "/";
  if (normalized === `/${slug}`) {
    return Astro.rewrite("/");
  }
}
```

When `/uk/` is caught by root `[slug].astro` (`slug = "uk"`), rewrite to `/` (index) while keeping the `/uk/` URL and `Astro.currentLocale = "uk"`. Do **not** redirect to `/${slug}/` — that loops.

### 3. Locale-aware 404 redirects

**New helper:** `redirectToNotFound()` in `src/utils/i18n/index.ts` using `getRelativeLocaleUrl(Astro.currentLocale ?? "en", "/404")`.

**Modify:** all pages using `Astro.redirect("/404")`:

- `src/pages/[slug].astro`
- `src/pages/posts/[slug].astro`
- `src/pages/category/[slug].astro`
- `src/pages/tag/[slug].astro`
- `src/pages/showcase/[slug].astro`

**Modify:** `src/pages/404.astro` — “Go home” link via `getRelativeLocaleUrl`.

### 4. Hub Feedback — reliable env loading

**File:** `astro.config.mjs`

```js
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
const hubFeedbackConfig = resolveHubFeedbackConfig({
  apiKey: env.HUB_API_KEY ?? "",
  siteId: env.HUB_SITE_ID ?? "",
});
```

Keep existing `vite.define` for `__HUB_FEEDBACK_CONFIG__`. No changes to `src/hub-feedback/**`.

### 5. Documentation

| File | Change |
|------|--------|
| `AGENTS.md` | i18n section: require `fallbackType: "rewrite"` for single-template EmDash sites |
| `docs/SEED-REFERENCE.md` | Same i18n routing note under Internationalization |
| `README.md` | Hub Feedback: restart `bun dev` after changing `.env` credentials |

Correct the backport design note in [`../specs/2026-09-13-template-backport-design.md`](../specs/2026-09-13-template-backport-design.md) (one-line caveat about rewrite fallback).

---

## Out of scope

- Runtime API route for Hub Feedback (Wrangler secrets at runtime)
- Duplicate `src/pages/uk/` folder structure
- Custom i18n middleware
- Full Ukrainian content translation beyond existing seed demo
- Automated tests (project has no test suite)

---

## Verification (manual)

1. Restart `bun dev` after changes.
2. `/` — EN switcher active; Hub Feedback floating button visible (bottom-right).
3. Click UK → `/uk/` loads home (not 404); UI strings Ukrainian where seeded.
4. `/uk/pro-nas` — Ukrainian About page (if seeded and published).
5. `/uk/about` — English About via EmDash fallback (rewrite + `fallback: { uk: "en" }`).
6. Browser console: `__HUB_FEEDBACK_CONFIG__` is non-null object.
7. `bun run typecheck` — no new errors.

---

## References

- Bar of Legends `[slug].astro` locale guard (`origin/barOfLegends`)
- [Astro i18n fallback](https://docs.astro.build/en/guides/internationalization/#fallback)
- EmDash i18n guide (prefix-other-locales + admin constraint)
