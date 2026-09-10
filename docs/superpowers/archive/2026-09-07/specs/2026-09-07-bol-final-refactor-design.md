# BOL Final Refactor — Design

**Status:** Implemented (archived 2026-09-07) — plan at [`../plans/2026-09-07-bol-final-refactor.md`](../plans/2026-09-07-bol-final-refactor.md)  
**Supersedes (partially):** [`../../../specs/2026-09-05-bol-theme-migration-design.md`](../../../specs/2026-09-05-bol-theme-migration-design.md) — CMS-first taxonomies, shared utils, no unsafe slug casts  
**Date:** 2026-09-07  
**Context:** Part 5 + PT blocks fix shipped. Remaining code smell: duplicated taxonomy unions, unsafe `as` casts, i18n labels mirroring CMS taxonomies, copy-pasted social link config. This spec covers a final cleanup pass before manual QA sign-off.

---

## Problem summary

| Symptom | Root cause |
|---------|------------|
| `ExperiencesRoute.astro:46` — `as "gaming" \| "social" \| "events"` | Hardcoded union instead of runtime taxonomy slug; breaks if CMS adds terms |
| `ExperienceCategory` defined 3× | `ExperiencesRoute`, `ExperienceCard`, `ExperienceFilter` each own the union |
| Filter labels duplicated | `ui.experiences.filters.gaming/social/events` in i18n **and** `experience_category` taxonomy terms in seed/admin |
| `SOCIALS` array copy-pasted | `Contact.astro`, `SiteFooter.astro`, `MobileNav.astro` |
| `MENU_CATEGORIES` hardcoded | `Menu.astro` ignores new `menu_category` terms; CSS `:has()` rules tied to fixed slugs |
| Seed script owns parallel unions | `scripts/generate-bol-seed.ts` repeats `"gaming" \| "social" \| "events"` and menu slugs |

References:

- [EmDash — Taxonomies](https://docs.emdashcms.com/guides/taxonomies/) — `getTaxonomyTerms`, `getEntryTerms`; term `slug` + locale-aware `label`
- [EmDash — Querying content](https://docs.emdashcms.com/guides/querying-content/) — `getEmDashCollection` with `where: { experience_category: slug }`
- [Astro — TypeScript](https://docs.astro.build/en/guides/typescript/) — shared `.ts` modules imported from `.astro` / `.tsx`

---

## Goals

1. **CMS-first taxonomy runtime** — new admin terms appear in filters/tabs without code deploy; no unsafe casts.
2. **Single source for category labels** — taxonomy terms for display; i18n only for `"All"` and `filterLabel`.
3. **Canonical shared modules** — taxonomy helpers, chip styles, social links; no duplicated unions.
4. **Seed alignment** — default slug arrays imported from one module used by seed generator.
5. **Docs updated** — SEED-REFERENCE, migration design changelog, this spec → plan.

## Non-goals

- Deleting `ExperiencesRoute.astro` (unlike `HomeRoute`; experiences logic stays shared).
- Automated tests (project has no test suite).
- Custom chip colors in CMS (unknown categories get neutral fallback until dev adds palette entry).
- Refactoring plugin admin UI or venue settings beyond social dedupe.

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Scope | Full site: `bol-theme` plugin, experience pages, seed script, docs |
| Category labels | **CMS taxonomy only** — `getTaxonomyTerms()` drives chips and filter buttons |
| New CMS categories | **CMS-first** — slug from `getEntryTerms()` used as-is; known slugs get themed chip; unknown get default chip |
| Architecture | Types + thin utils (not flat barrel, not inlined experiences routes) |
| `ExperienceFilter` | Stays page-level React island with `client:load`; props become dynamic `{ slug, label }[]` |
| i18n | Remove `experiences.filters.gaming/social/events`; keep `all` + `filterLabel` |
| Menu tabs | Build tab list from `getTaxonomyTerms("menu_category")`; active style via `[aria-selected="true"]`, not fixed `:has()` per slug |

---

## Architecture

### 1. Taxonomy types (`types/taxonomies.ts`)

**Seed defaults** — const arrays for initial seed content only, not runtime gates:

```ts
export const DEFAULT_EXPERIENCE_CATEGORIES = ["gaming", "social", "events"] as const;
export type KnownExperienceCategory = (typeof DEFAULT_EXPERIENCE_CATEGORIES)[number];

export const DEFAULT_MENU_CATEGORIES = ["alcoholic", "nonalcoholic", "snacks"] as const;
export type KnownMenuCategory = (typeof DEFAULT_MENU_CATEGORIES)[number];

export const EXPERIENCE_CATEGORY_TAXONOMY = "experience_category";
export const MENU_CATEGORY_TAXONOMY = "menu_category";
```

**Runtime slugs** — plain `string` from CMS. Optional helpers:

```ts
export function isKnownExperienceCategory(slug: string): slug is KnownExperienceCategory;
export function experienceChipClass(slug: string | undefined): string;
```

`experienceChipClass` returns a `Record<KnownExperienceCategory, string>` entry or a shared `DEFAULT_CHIP` Tailwind string.

**`CtaType`** — use `NonNullable<Experience["cta_type"]>` from `emdash-env.d.ts`; remove local duplicate in `ExperienceCard.astro`.

### 2. Taxonomy utils (`utils/taxonomy.ts`)

Thin helpers used by routes and blocks:

```ts
import type { TaxonomyTerm } from "emdash";

export type CategoryTerm = { slug: string; label: string };

/** Flat list of terms for current locale (non-hierarchical taxonomies). */
export function flattenCategoryTerms(terms: TaxonomyTerm[]): CategoryTerm[];

/** First assigned term slug for an entry, or undefined. */
export function primaryTermSlug(terms: TaxonomyTerm[]): string | undefined;

/** slug → label map for O(1) lookup when rendering cards. */
export function categoryLabelMap(terms: CategoryTerm[]): Record<string, string>;
```

No parsing that coerces unknown slugs to `"gaming"`.

### 3. Experiences flow

**`ExperiencesRoute.astro`**

Receives preloaded props from `loadExperiencesPageData()` (items, categoryTerms, venue, seo, gridId). No duplicate CMS queries inside the route template.

1. `categoryTerms` passed from loader (from `flattenCategoryTerms(await getTaxonomyTerms(...))`).
2. Per entry mapping uses `primaryTermSlug` from entry terms fetched in loader.
3. Pass `categorySlug` (optional) and `categoryLabel` from map (or omit chip when no slug).

**`experiences-filter-props.ts`**

```ts
export function getExperiencesFilterProps(
  locale: string | undefined | null,
  categoryTerms: CategoryTerm[],
) {
  const ui = getUiStrings(locale);
  return {
    gridId: "experience-grid",
    filterLabel: ui.experiences.filterLabel,
    allLabel: ui.experiences.filters.all,
    categories: categoryTerms,
  };
}
```

**Page wiring** — single loader avoids duplicate taxonomy fetch and keeps `client:load` on the page file:

```ts
// utils/experiences-page.ts
export async function loadExperiencesPageData(locale: string, origin: string) {
  // parallel: entries + terms + venue + settings/identity for SEO
  return { items, categoryTerms, venue, seo, gridId, filterProps, ... };
}
```

Each `experiences.astro` (en/hu/de) calls the loader once, passes data into `ExperiencesRoute` props and `ExperienceFilter` island props. `experiences-filter-props.ts` builds filter props from `categoryTerms` + i18n only.

**`ExperienceFilter.tsx`**

- Props: `allLabel`, `filterLabel`, `gridId`, `categories: CategoryTerm[]`.
- Build filter list: `[{ slug: "all", label: allLabel }, ...categories]`.
- On change: toggle `hidden` on `[data-experience-category]` where slug matches; `"all"` shows all.
- Remove local `ExperienceCategory` union and hardcoded `FILTERS` array.

**`ExperienceCard.astro`**

- `category?: string` — optional; omit `data-experience-category` and chip when unset.
- Chip class via `experienceChipClass(category)`.
- Label passed from server (already resolved from taxonomy).

### 4. Menu block (CMS-first tabs)

**`Menu.astro`**

1. `const categoryTerms = flattenCategoryTerms(await getTaxonomyTerms(MENU_CATEGORY_TAXONOMY))`.
2. For each term, `getEmDashCollection("menu_items", { locale, where: { menu_category: term.slug }, orderBy: { sort_order: "asc" } })`.
3. Render tabs/panels by iterating `categoryTerms` (not `DEFAULT_MENU_CATEGORIES`).
4. Replace fixed CSS:

   ```css
   .menu-tab-label[aria-selected="true"] {
     background-color: var(--color-brand);
     color: #1c1305;
   }
   ```

   Remove `:has(#menu-tab-alcoholic:checked)` rules — JS already syncs `aria-selected`.

New `menu_category` term in admin → new tab without code change.

### 5. Social links dedupe (`utils/socials.ts`)

```ts
export const SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export function socialLinksFromVenue(venue: PublicVenue): { id: SocialNetwork; href: string }[];

/** For MobileNav — href resolved via venue key. */
export function socialNavLinksFromVenue(venue: PublicVenue): {
  id: SocialNetwork;
  hrefKey: "socialInstagram" | "socialFacebook" | "socialTiktok";
}[];
```

Replace inline `SOCIALS` in `Contact.astro`, `SiteFooter.astro`, `MobileNav.astro`. Icon `name` and i18n `ui.contact.socials[id]` unchanged.

---

## i18n changes

Remove from `en.ts`, `hu.ts`, `de.ts` and `UiStrings`:

```ts
filters: {
  gaming: string;
  social: string;
  events: string;
}
```

Keep:

```ts
filters: {
  all: string;
};
filterLabel: string;
```

---

## Seed script

`scripts/generate-bol-seed.ts` imports:

```ts
import {
  DEFAULT_EXPERIENCE_CATEGORIES,
  DEFAULT_MENU_CATEGORIES,
} from "../src/plugins/bol-theme/types/taxonomies.ts";
```

Replace inline `"gaming" | "social" | "events"` and menu unions in `EXPERIENCES`, `localizedTerms(...)`, and label record keys. Localized label maps (`EXPERIENCE_CATEGORY_LABELS`, `MENU_CATEGORY_LABELS`) stay in the seed script — they seed CMS term labels, not runtime UI.

---

## Documentation updates

| File | Change |
|------|--------|
| `docs/SEED-REFERENCE.md` | Note CMS-first categories; new terms work at runtime; chip colors require code for known slugs |
| [`../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md`](../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md) | Changelog entry linking this spec |
| `docs/superpowers/specs/README.md` | Add this spec |
| `docs/superpowers/plans/README.md` | Entry after plan is written |

---

## Files touched (implementation preview)

| Action | Path |
|--------|------|
| Add | `src/plugins/bol-theme/utils/experiences-page.ts` |
| Add | `src/plugins/bol-theme/types/taxonomies.ts` |
| Add | `src/plugins/bol-theme/utils/taxonomy.ts` |
| Add | `src/plugins/bol-theme/utils/socials.ts` |
| Edit | `src/plugins/bol-theme/astro/routes/ExperiencesRoute.astro` |
| Edit | `src/plugins/bol-theme/astro/routes/experiences-filter-props.ts` |
| Edit | `src/plugins/bol-theme/astro/islands/ExperienceFilter.tsx` |
| Edit | `src/plugins/bol-theme/astro/components/ExperienceCard.astro` |
| Edit | `src/plugins/bol-theme/astro/blocks/Menu.astro` |
| Edit | `src/plugins/bol-theme/astro/blocks/Contact.astro` |
| Edit | `src/plugins/bol-theme/astro/theme/SiteFooter.astro` |
| Edit | `src/plugins/bol-theme/astro/theme/MobileNav.astro` |
| Edit | `src/plugins/bol-theme/utils/i18n/en.ts`, `hu.ts`, `de.ts` |
| Edit | `src/pages/experiences.astro`, `hu/experiences.astro`, `de/experiences.astro` |
| Edit | `scripts/generate-bol-seed.ts` |
| Edit | docs listed above |

---

## Manual verification

1. `bun run check` (or project typecheck script) — clean.
2. `/experiences` (en/hu/de): filters match taxonomy labels; cards filter correctly.
3. Home `#menu`: tabs match taxonomy; switching works at 375px and 1440px.
4. Contact / footer / mobile nav: social links unchanged.
5. **Optional admin test:** add a throwaway `experience_category` term, assign one entry — filter shows it, card filters correctly, chip uses neutral style.

---

## Next step

**Plan:** [2026-09-07-bol-final-refactor.md](../plans/2026-09-07-bol-final-refactor.md)
