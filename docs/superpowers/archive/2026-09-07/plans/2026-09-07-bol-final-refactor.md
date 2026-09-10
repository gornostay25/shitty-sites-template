# BOL Final Refactor — Implementation Plan

**Status:** Implemented (archived 2026-09-07) — spec at [`../specs/2026-09-07-bol-final-refactor-design.md`](../specs/2026-09-07-bol-final-refactor-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove taxonomy duplication and unsafe casts; make experiences and menu categories CMS-first at runtime; dedupe social links; align seed script with shared slug constants.

**Architecture:** Shared `types/taxonomies.ts` (seed defaults + chip styles), `utils/taxonomy.ts` (term helpers), `utils/experiences-page.ts` (single loader for experiences pages), `utils/socials.ts` (venue social config). Category labels come from `getTaxonomyTerms()` only; i18n keeps `"All"` + `filterLabel`. Unknown CMS slugs render with neutral chip fallback.

**Tech Stack:** Astro 7, EmDash 0.36, React 19 (`ExperienceFilter` island only), TypeScript, Tailwind CSS 4.

**Spec:** [2026-09-07-bol-final-refactor-design.md](../specs/2026-09-07-bol-final-refactor-design.md) (archived)

## Global Constraints

- **CMS-first runtime** — never coerce taxonomy slugs with `as "gaming" | ..."` or fallback to `"gaming"`.
- **Category display labels** — from `getTaxonomyTerms()` only; i18n `experiences.filters` keeps **`all`** + **`filterLabel`** only.
- **Experiences filter island** — React + `client:load` on page files only (`experiences.astro`, `hu/experiences.astro`, `de/experiences.astro`).
- **No automated tests** — manual verification + `bun run typecheck` only.
- **No git commits** unless user explicitly asks.
- **Consult MCP docs** when unsure: EmDash `search_docs`, Astro `search_astro_docs`.

---

## Official documentation

| Task | Read first |
|------|------------|
| 1–2 — taxonomy types/utils | [EmDash Taxonomies](https://docs.emdashcms.com/guides/taxonomies/) · `getTaxonomyTerms`, `getEntryTerms` |
| 3–5 — experiences | [EmDash Querying content](https://docs.emdashcms.com/guides/querying-content/) · `getEmDashCollection` |
| 6 — menu block | Same taxonomy guide · filter by `where: { menu_category: slug }` |
| 7 — pages | [Astro TypeScript](https://docs.astro.build/en/guides/typescript/) · shared `.ts` in `.astro` frontmatter |

**Project skills:** `.agents/skills/building-emdash-site/SKILL.md`

---

## File map

| Path | Action |
|------|--------|
| `src/plugins/bol-theme/types/taxonomies.ts` | **Create** |
| `src/plugins/bol-theme/utils/taxonomy.ts` | **Create** |
| `src/plugins/bol-theme/utils/socials.ts` | **Create** |
| `src/plugins/bol-theme/utils/experiences-page.ts` | **Create** |
| `src/plugins/bol-theme/astro/routes/experiences-filter-props.ts` | **Modify** |
| `src/plugins/bol-theme/astro/routes/ExperiencesRoute.astro` | **Modify** |
| `src/plugins/bol-theme/astro/islands/ExperienceFilter.tsx` | **Modify** |
| `src/plugins/bol-theme/astro/components/ExperienceCard.astro` | **Modify** |
| `src/plugins/bol-theme/astro/blocks/Menu.astro` | **Modify** |
| `src/plugins/bol-theme/astro/blocks/Contact.astro` | **Modify** |
| `src/plugins/bol-theme/astro/theme/SiteFooter.astro` | **Modify** |
| `src/plugins/bol-theme/astro/theme/MobileNav.astro` | **Modify** |
| `src/plugins/bol-theme/utils/i18n/en.ts`, `hu.ts`, `de.ts` | **Modify** |
| `src/pages/experiences.astro`, `hu/experiences.astro`, `de/experiences.astro` | **Modify** |
| `scripts/generate-bol-seed.ts` | **Modify** |
| `docs/SEED-REFERENCE.md` | **Modify** |
| [`../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md`](../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md) | **Modify** — changelog |
| `docs/superpowers/specs/2026-09-07-bol-final-refactor-design.md` | **Modify** — status Implemented |
| `docs/superpowers/specs/README.md` | **Modify** |
| `docs/superpowers/plans/README.md` | **Modify** |

---

### Task 1: Taxonomy types + helpers

**Files:**
- Create: `src/plugins/bol-theme/types/taxonomies.ts`
- Create: `src/plugins/bol-theme/utils/taxonomy.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `DEFAULT_EXPERIENCE_CATEGORIES`, `DEFAULT_MENU_CATEGORIES`
  - `KnownExperienceCategory`, `KnownMenuCategory`
  - `EXPERIENCE_CATEGORY_TAXONOMY`, `MENU_CATEGORY_TAXONOMY`
  - `isKnownExperienceCategory(slug: string): slug is KnownExperienceCategory`
  - `experienceChipClass(slug: string | undefined): string`
  - `CategoryTerm`, `flattenCategoryTerms()`, `primaryTermSlug()`, `categoryLabelMap()`

- [ ] **Step 1: Create `types/taxonomies.ts`**

```typescript
export const DEFAULT_EXPERIENCE_CATEGORIES = ["gaming", "social", "events"] as const;
export type KnownExperienceCategory = (typeof DEFAULT_EXPERIENCE_CATEGORIES)[number];

export const DEFAULT_MENU_CATEGORIES = ["alcoholic", "nonalcoholic", "snacks"] as const;
export type KnownMenuCategory = (typeof DEFAULT_MENU_CATEGORIES)[number];

export const EXPERIENCE_CATEGORY_TAXONOMY = "experience_category";
export const MENU_CATEGORY_TAXONOMY = "menu_category";

const EXPERIENCE_CHIP_STYLES: Record<KnownExperienceCategory, string> = {
	gaming: "border-brand-muted/40 bg-brand-muted/15 text-brand-muted",
	social: "border-brand/40 bg-brand/15 text-brand",
	events: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const DEFAULT_EXPERIENCE_CHIP =
	"border-border bg-surface-2 text-muted-foreground";

export function isKnownExperienceCategory(
	slug: string,
): slug is KnownExperienceCategory {
	return (DEFAULT_EXPERIENCE_CATEGORIES as readonly string[]).includes(slug);
}

export function experienceChipClass(slug: string | undefined): string {
	if (!slug) return DEFAULT_EXPERIENCE_CHIP;
	return isKnownExperienceCategory(slug)
		? EXPERIENCE_CHIP_STYLES[slug]
		: DEFAULT_EXPERIENCE_CHIP;
}
```

- [ ] **Step 2: Create `utils/taxonomy.ts`**

```typescript
import type { TaxonomyTerm } from "emdash";

export type CategoryTerm = { slug: string; label: string };

/** Non-hierarchical taxonomies: top-level terms only, stable CMS order. */
export function flattenCategoryTerms(terms: TaxonomyTerm[]): CategoryTerm[] {
	return terms.map((term) => ({ slug: term.slug, label: term.label }));
}

export function primaryTermSlug(terms: TaxonomyTerm[]): string | undefined {
	return terms[0]?.slug;
}

export function categoryLabelMap(terms: CategoryTerm[]): Record<string, string> {
	return Object.fromEntries(terms.map((term) => [term.slug, term.label]));
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS (no new errors from these files)

---

### Task 2: Social links dedupe

**Files:**
- Create: `src/plugins/bol-theme/utils/socials.ts`
- Modify: `src/plugins/bol-theme/astro/blocks/Contact.astro`
- Modify: `src/plugins/bol-theme/astro/theme/SiteFooter.astro`
- Modify: `src/plugins/bol-theme/astro/theme/MobileNav.astro`

**Interfaces:**
- Consumes: `PublicVenueSettings` from `utils/venue.ts`
- Produces:
  - `SOCIAL_NETWORKS`, `SocialNetwork`
  - `socialLinksFromVenue(venue): { id: SocialNetwork; href: string }[]`
  - `socialNavLinksFromVenue(venue): { id: SocialNetwork; hrefKey: "socialInstagram" | "socialFacebook" | "socialTiktok" }[]`

- [ ] **Step 1: Create `utils/socials.ts`**

```typescript
import type { PublicVenueSettings } from "./venue.ts";

export const SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

type SocialHrefKey = "socialInstagram" | "socialFacebook" | "socialTiktok";

const SOCIAL_HREF_KEYS: Record<SocialNetwork, SocialHrefKey> = {
	instagram: "socialInstagram",
	facebook: "socialFacebook",
	tiktok: "socialTiktok",
};

export function socialLinksFromVenue(
	venue: PublicVenueSettings,
): { id: SocialNetwork; href: string }[] {
	return SOCIAL_NETWORKS.map((id) => ({
		id,
		href: venue[SOCIAL_HREF_KEYS[id]],
	}));
}

export function socialNavLinksFromVenue(
	venue: PublicVenueSettings,
): { id: SocialNetwork; hrefKey: SocialHrefKey }[] {
	return SOCIAL_NETWORKS.map((id) => ({
		id,
		hrefKey: SOCIAL_HREF_KEYS[id],
	}));
}
```

- [ ] **Step 2: Update `Contact.astro`**

Remove local `SOCIALS` array. Import and use:

```astro
import { socialLinksFromVenue } from "../../utils/socials.ts";
// ...
const socials = socialLinksFromVenue(venue);
```

Replace `SOCIALS.map` with `socials.map` (same `{ id, href }` shape).

- [ ] **Step 3: Update `SiteFooter.astro`**

Same pattern: `const socials = socialLinksFromVenue(venue);`

- [ ] **Step 4: Update `MobileNav.astro`**

```astro
import { socialNavLinksFromVenue } from "../../utils/socials.ts";
// ...
const socials = socialNavLinksFromVenue(venue);
```

Keep `venue[social.hrefKey]` in the template.

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck`
Expected: PASS

---

### Task 3: i18n cleanup

**Files:**
- Modify: `src/plugins/bol-theme/utils/i18n/en.ts`
- Modify: `src/plugins/bol-theme/utils/i18n/hu.ts`
- Modify: `src/plugins/bol-theme/utils/i18n/de.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `UiStrings.experiences.filters` with only `{ all: string }`

- [ ] **Step 1: Trim `en.ts` filters**

Remove `gaming`, `social`, `events` from the `filters` object and from the `UiStrings` type:

```typescript
filters: {
	all: "All",
},
```

- [ ] **Step 2: Trim `hu.ts` and `de.ts`**

Same shape — keep localized `all` string only.

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: FAIL on `ExperienceFilter` / `experiences-filter-props` until Task 5 — note and continue.

---

### Task 4: Experiences page loader

**Files:**
- Create: `src/plugins/bol-theme/utils/experiences-page.ts`
- Modify: `src/plugins/bol-theme/astro/routes/experiences-filter-props.ts`

**Interfaces:**
- Consumes: Task 1 exports; EmDash query functions; `fetchPublicVenue`; `getUiStrings`; site SEO helpers
- Produces:

```typescript
export type ExperienceListItem = {
	id: string;
	categorySlug?: string;
	categoryLabel?: string;
	title: string;
	description?: string;
	meta?: string;
	image?: Experience["image"];
	ctaType: NonNullable<Experience["cta_type"]> | "ask";
};

export async function loadExperiencesPageData(
	locale: string,
	origin: string,
): Promise<{
	items: ExperienceListItem[];
	categoryTerms: CategoryTerm[];
	venue: PublicVenueSettings;
	heroImage?: Experience["image"];
	seo: /* same shape Base expects from buildStaticPageSeo */;
	gridId: string;
	filterProps: {
		gridId: string;
		filterLabel: string;
		allLabel: string;
		categories: CategoryTerm[];
	};
}>;
```

- [ ] **Step 1: Update `experiences-filter-props.ts`**

```typescript
import { getUiStrings } from "../../utils/i18n/index.ts";
import type { CategoryTerm } from "../../utils/taxonomy.ts";

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

- [ ] **Step 2: Create `utils/experiences-page.ts`**

Implement loader — parallel fetch pattern from current `ExperiencesRoute.astro`:

```typescript
import { getRelativeLocaleUrl } from "astro:i18n";
import {
	getEmDashCollection,
	getEntryTerms,
	getSiteSettings,
	getTaxonomyTerms,
} from "emdash";
import type { Experience } from "../../../../emdash-env.d.ts";
import { fetchPublicVenue } from "./fetch-venue.ts";
import { getExperiencesFilterProps } from "../astro/routes/experiences-filter-props.ts";
import { resolveSiteIdentity } from "../../../utils/site-identity";
import { buildStaticPageSeo } from "../../../utils/seo";
import {
	EXPERIENCE_CATEGORY_TAXONOMY,
} from "../types/taxonomies.ts";
import {
	categoryLabelMap,
	flattenCategoryTerms,
	primaryTermSlug,
	type CategoryTerm,
} from "./taxonomy.ts";

export type ExperienceListItem = {
	id: string;
	categorySlug?: string;
	categoryLabel?: string;
	title: string;
	description?: string;
	meta?: string;
	image?: Experience["image"];
	ctaType: NonNullable<Experience["cta_type"]> | "ask";
};

export async function loadExperiencesPageData(locale: string, origin: string) {
	const path = getRelativeLocaleUrl(locale, "/experiences");

	const [{ entries, cacheHint }, taxonomyTerms, venue, settings] =
		await Promise.all([
			getEmDashCollection("experiences", {
				locale,
				orderBy: { sort_order: "asc" },
			}),
			getTaxonomyTerms(EXPERIENCE_CATEGORY_TAXONOMY),
			fetchPublicVenue(origin),
			getSiteSettings(),
		]);

	const categoryTerms: CategoryTerm[] = flattenCategoryTerms(taxonomyTerms);
	const labels = categoryLabelMap(categoryTerms);

	const items: ExperienceListItem[] = await Promise.all(
		entries.map(async (entry) => {
			const terms = await getEntryTerms(
				"experiences",
				entry.data.id,
				EXPERIENCE_CATEGORY_TAXONOMY,
			);
			const categorySlug = primaryTermSlug(terms);
			return {
				id: entry.id,
				categorySlug,
				categoryLabel: categorySlug ? labels[categorySlug] ?? categorySlug : undefined,
				title: entry.data.title,
				description: entry.data.description,
				meta: entry.data.meta,
				image: entry.data.image,
				ctaType: entry.data.cta_type ?? "ask",
			};
		}),
	);

	const heroImage =
		items.find((item) => item.id === "tournaments-watchparties")?.image ??
		items[0]?.image;

	const identity = resolveSiteIdentity(settings);
	const ui = getExperiencesFilterProps(locale, categoryTerms);
	const seo = buildStaticPageSeo({
		title: `${/* import getUiStrings for title */ ""}`,
		description: "",
		path,
		identity,
	});

	return {
		items,
		categoryTerms,
		venue,
		heroImage,
		seo,
		cacheHint,
		gridId: ui.gridId,
		filterProps: ui,
	};
}
```

**Implementer note:** import `getUiStrings` for `ui.experiences.title` / `subtitle` in SEO title/description — mirror current `ExperiencesRoute.astro` lines 66–71.

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS for new module (route/island may still fail until Task 5)

---

### Task 5: Experiences route, card, filter, pages

**Files:**
- Modify: `src/plugins/bol-theme/astro/routes/ExperiencesRoute.astro`
- Modify: `src/plugins/bol-theme/astro/components/ExperienceCard.astro`
- Modify: `src/plugins/bol-theme/astro/islands/ExperienceFilter.tsx`
- Modify: `src/pages/experiences.astro`
- Modify: `src/pages/hu/experiences.astro`
- Modify: `src/pages/de/experiences.astro`

**Interfaces:**
- Consumes: `loadExperiencesPageData`, `ExperienceListItem`, `experienceChipClass`
- Produces: prop-driven route; dynamic filter island

- [ ] **Step 1: Refactor `ExperiencesRoute.astro`**

Replace internal CMS queries with props:

```astro
---
import type { ExperienceListItem } from "../../utils/experiences-page.ts";
import type { PublicVenueSettings } from "../../utils/venue.ts";
import type { CategoryTerm } from "../../utils/taxonomy.ts";
// ... existing UI imports except getEmDashCollection/getEntryTerms/getTaxonomyTerms

interface Props {
	gridId: string;
	items: ExperienceListItem[];
	venue: PublicVenueSettings;
	heroImage?: ExperienceListItem["image"];
	seo: /* from loader */;
	locale: string;
	ui: ReturnType<typeof getUiStrings>; // or pass individual strings
}

const { gridId, items, venue, heroImage, seo, locale, ui } = Astro.props;
---
```

Remove lines 24–58 (fetch + map). Pass `item.categorySlug` / `item.categoryLabel` to `ExperienceCard`.

- [ ] **Step 2: Update `ExperienceCard.astro`**

```astro
---
import type { Experience } from "../../../../../emdash-env.d.ts";
import { experienceChipClass } from "../../types/taxonomies.ts";

interface Props {
	categorySlug?: string;
	categoryLabel?: string;
	// ... rest unchanged
	ctaType?: NonNullable<Experience["cta_type"]>;
}
---
```

Template changes:
- Render chip only when `categorySlug && categoryLabel`
- `data-experience-category={categorySlug}` only when set
- `class:list={[experienceChipClass(categorySlug), ...]}`

- [ ] **Step 3: Update `ExperienceFilter.tsx`**

```tsx
type CategoryTerm = { slug: string; label: string };

type Props = {
	filterLabel: string;
	allLabel: string;
	gridId: string;
	categories: CategoryTerm[];
};

type FilterSlug = "all" | string;

export default function ExperienceFilter({
	filterLabel,
	allLabel,
	gridId,
	categories,
}: Props) {
	const [active, setActive] = useState<FilterSlug>("all");
	const filters = [{ slug: "all", label: allLabel }, ...categories];

	useEffect(() => {
		const grid = document.getElementById(gridId);
		if (!grid) return;
		for (const card of grid.querySelectorAll<HTMLElement>("[data-experience-category]")) {
			const category = card.dataset.experienceCategory;
			const visible = active === "all" || category === active;
			card.hidden = !visible;
		}
	}, [active, gridId]);

	return (
		<div className="flex flex-wrap gap-2" role="group" aria-label={filterLabel}>
			{filters.map((filter) => {
				const pressed = active === filter.slug;
				return (
					<button
						key={filter.slug}
						type="button"
						onClick={() => setActive(filter.slug)}
						aria-pressed={pressed}
						className={/* unchanged */}
					>
						{filter.label}
					</button>
				);
			})}
		</div>
	);
}
```

- [ ] **Step 4: Update all three `experiences.astro` pages**

```astro
---
import ExperiencesRoute from "../plugins/bol-theme/astro/routes/ExperiencesRoute.astro";
import ExperienceFilter from "../plugins/bol-theme/astro/islands/ExperienceFilter.tsx";
import { loadExperiencesPageData } from "../plugins/bol-theme/utils/experiences-page.ts";
import { getUiStrings } from "../plugins/bol-theme/utils/i18n/index.ts";

const locale = Astro.currentLocale ?? "en";
const data = await loadExperiencesPageData(locale, Astro.url.origin);
if (Astro.cache?.enabled && data.cacheHint) Astro.cache.set(data.cacheHint);
const ui = getUiStrings(locale);
---

<ExperiencesRoute
	gridId={data.gridId}
	items={data.items}
	venue={data.venue}
	heroImage={data.heroImage}
	seo={data.seo}
	locale={locale}
	ui={ui}
>
	<ExperienceFilter
		slot="filters"
		client:load
		filterLabel={data.filterProps.filterLabel}
		allLabel={data.filterProps.allLabel}
		categories={data.filterProps.categories}
		gridId={data.filterProps.gridId}
	/>
</ExperiencesRoute>
```

Adjust import paths for `hu/` and `de/` (`../../plugins/...`).

- [ ] **Step 5: Typecheck + smoke test**

Run: `bun run typecheck`
Expected: PASS

Manual: open `/experiences` — filters show taxonomy labels; click filters; no console errors.

---

### Task 6: Menu block CMS-first tabs

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Menu.astro`

**Interfaces:**
- Consumes: `flattenCategoryTerms`, `MENU_CATEGORY_TAXONOMY`
- Produces: dynamic tab list from CMS

- [ ] **Step 1: Replace hardcoded `MENU_CATEGORIES`**

```astro
import { flattenCategoryTerms } from "../../utils/taxonomy.ts";
import { MENU_CATEGORY_TAXONOMY } from "../../types/taxonomies.ts";

const categoryTerms = flattenCategoryTerms(await getTaxonomyTerms(MENU_CATEGORY_TAXONOMY));

const categoryResults = await Promise.all(
	categoryTerms.map((term) =>
		getEmDashCollection("menu_items", {
			locale,
			where: { menu_category: term.slug },
			orderBy: { sort_order: "asc" },
		}),
	),
);

const tabLabels = Object.fromEntries(
	categoryTerms.map((term) => [term.slug, term.label]),
);

const itemsByCategory = Object.fromEntries(
	categoryTerms.map((term, index) => [
		term.slug,
		categoryResults[index]?.entries.map(/* unchanged */) ?? [],
	]),
);
```

- [ ] **Step 2: Iterate `categoryTerms` in template**

Replace `MENU_CATEGORIES.map` with `categoryTerms.map((term) => term.slug)` for radios, labels, panels.

- [ ] **Step 3: Replace active-tab CSS**

Remove `:has(#menu-tab-alcoholic:checked)` block. Add:

```css
.menu-tab-label[aria-selected="true"] {
	background-color: var(--color-brand);
	color: #1c1305;
}
```

- [ ] **Step 4: Manual check**

Home `#menu` — tabs match CMS; switch tabs at 375px; active pill styled.

---

### Task 7: Seed script alignment

**Files:**
- Modify: `scripts/generate-bol-seed.ts`

**Interfaces:**
- Consumes: `DEFAULT_EXPERIENCE_CATEGORIES`, `DEFAULT_MENU_CATEGORIES` from `types/taxonomies.ts`

- [ ] **Step 1: Import shared constants**

```typescript
import {
	DEFAULT_EXPERIENCE_CATEGORIES,
	DEFAULT_MENU_CATEGORIES,
} from "../src/plugins/bol-theme/types/taxonomies.ts";
```

- [ ] **Step 2: Replace inline unions**

Change `EXPERIENCES` item type:

```typescript
category: (typeof DEFAULT_EXPERIENCE_CATEGORIES)[number];
```

Change `MENU_ITEMS` (or equivalent) category field similarly.

Replace `localizedTerms("menu-cat", ["alcoholic", "nonalcoholic", "snacks"], ...)` with:

```typescript
localizedTerms("menu-cat", [...DEFAULT_MENU_CATEGORIES], MENU_CATEGORY_LABELS)
```

Same for experience categories:

```typescript
localizedTerms("exp-cat", [...DEFAULT_EXPERIENCE_CATEGORIES], EXPERIENCE_CATEGORY_LABELS)
```

Update `Record<"gaming" | ...>` keys on label maps to use `(typeof DEFAULT_EXPERIENCE_CATEGORIES)[number]`.

- [ ] **Step 3: Verify script runs**

Run: `bun scripts/generate-bol-seed.ts` (or project’s documented seed command)
Expected: completes without type errors; output structure unchanged.

---

### Task 8: Documentation + spec status

**Files:**
- Modify: `docs/SEED-REFERENCE.md`
- Modify: [`../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md`](../../2026-09-10/specs/2026-09-05-bol-theme-migration-design.md)
- Modify: `docs/superpowers/specs/2026-09-07-bol-final-refactor-design.md`
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/plans/README.md`

- [ ] **Step 1: SEED-REFERENCE**

Add short section under experiences/menu taxonomies:

- Runtime labels from CMS taxonomy terms (not i18n).
- New admin terms appear in filters/tabs automatically.
- Chip colors: known slugs in `types/taxonomies.ts`; unknown slugs use neutral fallback until dev adds palette entry.

- [ ] **Step 2: Migration design changelog**

Append entry linking `2026-09-07-bol-final-refactor-design.md` — CMS-first taxonomies, social dedupe, loader pattern.

- [ ] **Step 3: Set spec status**

`2026-09-07-bol-final-refactor-design.md` → **Implemented** with date.

- [ ] **Step 4: Update README indexes**

Plans + specs tables — add this plan as current/shipped after implementation.

---

## Completion gate

- [ ] `bun run typecheck` — zero errors
- [ ] `/experiences` en/hu/de — filters use taxonomy labels; filtering works
- [ ] Home `#menu` — dynamic tabs; active style via `aria-selected`
- [ ] Contact / footer / mobile nav — social links unchanged
- [ ] No `as "gaming" | "social" | "events"` (or similar) in `src/plugins/bol-theme/`
- [ ] Spec + plan README updated

**Optional:** add throwaway `experience_category` term in admin — verify filter + neutral chip.
