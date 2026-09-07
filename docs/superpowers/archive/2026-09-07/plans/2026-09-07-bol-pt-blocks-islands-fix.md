# BOL PT Blocks + Islands Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Implemented (archived 2026-09-07) — spec at [`../specs/2026-09-07-bol-pt-blocks-islands-fix-design.md`](../specs/2026-09-07-bol-pt-blocks-islands-fix-design.md). All task checkboxes below reflect completed work.

**Goal:** Fix Portable Text block prop wiring (`Astro.props.node`) and remove React islands from PT blocks so home/experiences load without hook SSR errors while CMS content renders correctly.

**Architecture:** Shared `getPtNode<T>()` helper + typed block nodes; all five `bol.*` blocks read CMS fields from `node`. Interactivity inside PT blocks becomes CSS (menu tabs) or co-located Astro `<script>` blocks (open-now badge, Leaflet map). `ExperienceFilter` stays a page-level React island with `client:load`. Home logic inlined into locale `index.astro` files; delete `HomeRoute.astro` wrapper.

**Tech Stack:** Astro 5, EmDash 0.36, astro-portabletext, Tailwind CSS, Leaflet (map only), React island (experiences filter only).

**Spec:** [2026-09-07-bol-pt-blocks-islands-fix-design.md](../specs/2026-09-07-bol-pt-blocks-islands-fix-design.md) (archived)

## Global Constraints

- Read PT block fields from **`Astro.props.node`** via `getPtNode()` — canonical pattern: `node_modules/emdash/src/components/Embed.astro`.
- **No React islands inside PT blocks** — Astro ignores `client:*` on components rendered through Portable Text’s `components` map.
- **Experiences filter:** React + `client:load` on page files only (`experiences.astro`, `hu/experiences.astro`, `de/experiences.astro`).
- **No automated tests** — manual verification + `bun run typecheck` only.
- **Keep `@astrojs/react`** — plugin admin UI still needs it.
- **Keep locale page folders** (`hu/`, `de/`) — Astro i18n requirement.
- **No git commits** unless user explicitly asks.

---

## Official documentation

| Task | Read first |
|------|------------|
| 1–5 — PT blocks | [Portable Text components](https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/) · in-repo `node_modules/emdash/src/components/Embed.astro` |
| 3 — menu tabs | [Astro client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives) (why no islands in PT) |
| 5 — map script | [Astro `<script>`](https://docs.astro.build/en/guides/client-side-scripts/) |
| 6 — home routes | [Internationalization](https://docs.emdashcms.com/guides/internationalization/) |

**Project skills:** `.agents/skills/building-emdash-site/references/querying-and-rendering.md` · `.agents/skills/creating-plugins/references/portable-text-blocks.md`

---

## File map

| Path | Action |
|------|--------|
| `src/plugins/bol-theme/utils/pt-node.ts` | **Create** |
| `src/plugins/bol-theme/types/pt-blocks.ts` | **Create** |
| `src/plugins/bol-theme/astro/blocks/Hero.astro` | **Modify** |
| `src/plugins/bol-theme/astro/blocks/Benefits.astro` | **Modify** |
| `src/plugins/bol-theme/astro/blocks/Menu.astro` | **Modify** — CSS tabs, delete island import |
| `src/plugins/bol-theme/astro/blocks/Gallery.astro` | **Modify** |
| `src/plugins/bol-theme/astro/blocks/Contact.astro` | **Modify** — node props + client scripts |
| `src/plugins/bol-theme/astro/blocks/contact-open-now.ts` | **Create** — open-now client init |
| `src/plugins/bol-theme/astro/islands/MenuTabs.tsx` | **Delete** |
| `src/plugins/bol-theme/astro/islands/OpenNowBadge.tsx` | **Delete** |
| `src/plugins/bol-theme/astro/islands/VenueMap.tsx` | **Delete** |
| `src/plugins/bol-theme/astro/islands/ExperienceFilter.tsx` | **Keep** |
| `src/plugins/bol-theme/astro/routes/HomeRoute.astro` | **Delete** |
| `src/pages/index.astro`, `hu/index.astro`, `de/index.astro` | **Modify** — inline home |
| `src/pages/experiences.astro`, `hu/experiences.astro`, `de/experiences.astro` | **Verify** |

---

### Task 1: PT node helper + block types

**Files:**
- Create: `src/plugins/bol-theme/utils/pt-node.ts`
- Create: `src/plugins/bol-theme/types/pt-blocks.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `getPtNode<T>(props)`, `BolHeroNode`, `BolBenefitsNode`, `BolMenuNode`, `BolGalleryNode`, `BolContactNode`

- [x] **Step 1: Create `pt-node.ts`**

```typescript
/** Portable Text custom block props from astro-portabletext / EmDash. */
export function getPtNode<T extends Record<string, unknown>>(
	props: Record<string, unknown>,
): T {
	if (props.node && typeof props.node === "object") {
		return props.node as T;
	}
	const { node: _node, index: _index, isInline: _inline, ...rest } = props;
	return rest as T;
}
```

- [x] **Step 2: Create `pt-blocks.ts`**

Field names must match plugin `action_id`s in `src/plugins/bol-theme/index.ts` and seed JSON `_type` blocks.

```typescript
export type BolHeroNode = {
	_type?: "bol.hero";
	_key?: string;
	kicker?: string;
	titleTop?: string;
	titleAccent?: string;
	subtitle?: string;
	ctaMenu?: string;
	ctaBook?: string;
	scrollHint?: string;
	backgroundImageUrl?: string;
};

export type BolBenefitItem = {
	icon?: "beer" | "gamepad" | "users";
	title?: string;
	body?: string;
};

export type BolBenefitsNode = {
	_type?: "bol.benefits";
	_key?: string;
	eyebrow?: string;
	title?: string;
	items?: BolBenefitItem[];
};

export type BolMenuNode = {
	_type?: "bol.menu";
	_key?: string;
	eyebrow?: string;
	title?: string;
	subtitle?: string;
	footnote?: string;
};

export type BolGalleryNode = {
	_type?: "bol.gallery";
	_key?: string;
	eyebrow?: string;
	title?: string;
	subtitle?: string;
};

export type BolContactNode = {
	_type?: "bol.contact";
	_key?: string;
	eyebrow?: string;
	title?: string;
	subtitle?: string;
	showHours?: boolean;
	showMap?: boolean;
	showPhone?: boolean;
	showSocials?: boolean;
};
```

- [x] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: 0 new errors (new files compile cleanly).

---

### Task 2: Hero + Benefits blocks — wire `node` props

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Hero.astro`
- Modify: `src/plugins/bol-theme/astro/blocks/Benefits.astro`

**Interfaces:**
- Consumes: `getPtNode`, `BolHeroNode`, `BolBenefitsNode`
- Produces: blocks that render CMS copy from seed (kicker, titles, items, etc.)

- [x] **Step 1: Update Hero.astro frontmatter**

Replace flat `interface Props` + `Astro.props` destructuring with:

```astro
---
import { Image } from "astro:assets";
import heroFallback from "../../../../assets/hero.webp";
import Icon from "../icons/Icon.astro";
import { fetchPublicVenue } from "../../utils/fetch-venue.ts";
import { getPtNode } from "../../utils/pt-node.ts";
import type { BolHeroNode } from "../../types/pt-blocks.ts";

const node = getPtNode<BolHeroNode>(Astro.props);
const {
	kicker,
	titleTop,
	titleAccent,
	subtitle,
	ctaMenu,
	ctaBook,
	scrollHint,
	backgroundImageUrl,
} = node;

const venue = await fetchPublicVenue(Astro.url.origin);
---
```

Leave template markup unchanged.

- [x] **Step 2: Update Benefits.astro frontmatter**

```astro
---
import Icon from "../icons/Icon.astro";
import { getPtNode } from "../../utils/pt-node.ts";
import type { BolBenefitItem, BolBenefitsNode } from "../../types/pt-blocks.ts";

type BenefitIcon = "beer" | "gamepad" | "users";

const node = getPtNode<BolBenefitsNode>(Astro.props);
const { eyebrow, title, items = [] } = node;

const iconNames: Record<BenefitIcon, "beer" | "gamepad2" | "users"> = {
	beer: "beer",
	gamepad: "gamepad2",
	users: "users",
};
---
```

In the template, type the map callback param as `BolBenefitItem`.

- [x] **Step 3: Manual check — Hero + Benefits**

```bash
bun dev
```

Open `http://localhost:4321/` — terminal must show **no** `Invalid hook call`. Hero shows kicker `"Győr · Szabadsajtó utca 2"`, title lines, CTAs. Benefits shows three cards.

Repeat `/hu/` and `/de/` — translated copy from seed.

---

### Task 3: Menu block — CSS tabs (delete MenuTabs island)

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Menu.astro`
- Delete: `src/plugins/bol-theme/astro/islands/MenuTabs.tsx`

**Interfaces:**
- Consumes: `getPtNode`, `BolMenuNode`, `formatHUF` from `utils/format.ts`
- Produces: server-rendered tabbed menu with no client JS

- [x] **Step 1: Rewrite Menu.astro**

Remove `MenuTabs` import. Use `getPtNode<BolMenuNode>(Astro.props)` for eyebrow/title/subtitle/footnote. Keep existing CMS queries (`menu_items`, `menu_category` taxonomy, cache hints).

Replace the `<MenuTabs client:visible … />` block with CSS `:has()` radio tabs. Port markup/classes from `MenuTabs.tsx`:

```astro
---
// … imports including getPtNode, BolMenuNode, formatHUF, getEmDashCollection, getTaxonomyTerms …

const MENU_CATEGORIES = ["alcoholic", "nonalcoholic", "snacks"] as const;
const node = getPtNode<BolMenuNode>(Astro.props);
const { eyebrow, title, subtitle, footnote } = node;
const locale = Astro.currentLocale ?? "en";
const menuTitle = title ?? "Menu";

// … existing Promise.all query + tabLabels + itemsByCategory …
---

<section id="menu" …>
	<!-- existing header -->

	<div class="menu-tabs mt-10">
		<div
			role="tablist"
			aria-label={menuTitle}
			class="scrollbar-slim -mx-1 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 sm:mx-0 sm:inline-flex sm:w-auto sm:overflow-visible"
		>
			{
				MENU_CATEGORIES.map((tab, index) => (
					<>
						<input
							type="radio"
							name="menu-category"
							id={`menu-tab-${tab}`}
							class="menu-tab-input sr-only"
							checked={index === 0}
						/>
						<label
							for={`menu-tab-${tab}`}
							role="tab"
							id={`menu-tab-label-${tab}`}
							aria-controls={`menu-panel-${tab}`}
							class="menu-tab-label min-h-12 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors sm:px-6"
						>
							{tabLabels[tab] ?? tab}
						</label>
					</>
				))
			}
		</div>

		{
			MENU_CATEGORIES.map((tab) => (
				<div
					role="tabpanel"
					id={`menu-panel-${tab}`}
					aria-labelledby={`menu-tab-label-${tab}`}
					class="menu-tab-panel mt-8"
					hidden
				>
					<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{
							(itemsByCategory[tab] ?? []).map((item) => (
								<li class="group overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 hover:border-brand/40 hover:shadow-glow">
									<div class="relative aspect-4/3 overflow-hidden">
										{
											item.image?.src ? (
												<img
													src={item.image.src}
													alt={item.image.alt ?? item.name}
													width={item.image.width}
													height={item.image.height}
													loading="lazy"
													class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
												/>
											) : (
												<div class="grid size-full place-items-center bg-surface-2 text-muted-foreground">
													<span class="text-sm">No image</span>
												</div>
											)
										}
										<span class="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1.5 font-display text-lg tracking-wide text-brand backdrop-blur">
											{formatHUF(item.price, locale)}
										</span>
									</div>
									<div class="p-4">
										<h3 class="font-display text-2xl tracking-wide">{item.name}</h3>
										{
											item.description && (
												<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
													{item.description}
												</p>
											)
										}
									</div>
								</li>
							))
						}
					</ul>
				</div>
			))
		}

		{footnote && <p class="mt-6 text-xs text-muted-foreground">{footnote}</p>}
	</div>
</section>

<style is:global>
	.menu-tabs:has(#menu-tab-alcoholic:checked) #menu-panel-alcoholic {
		display: block;
	}
	.menu-tabs:has(#menu-tab-alcoholic:checked) #menu-tab-label-alcoholic {
		background-color: var(--color-brand);
		color: #1c1305;
	}
	.menu-tabs:has(#menu-tab-nonalcoholic:checked) #menu-panel-nonalcoholic {
		display: block;
	}
	.menu-tabs:has(#menu-tab-nonalcoholic:checked) #menu-tab-label-nonalcoholic {
		background-color: var(--color-brand);
		color: #1c1305;
	}
	.menu-tabs:has(#menu-tab-snacks:checked) #menu-panel-snacks {
		display: block;
	}
	.menu-tabs:has(#menu-tab-snacks:checked) #menu-tab-label-snacks {
		background-color: var(--color-brand);
		color: #1c1305;
	}
	.menu-tab-label {
		color: var(--color-muted-foreground);
	}
	.menu-tab-label:hover {
		color: var(--color-foreground);
	}
</style>

<script>
	/** Sync aria-selected + hidden with checked radio (CSS handles visuals). */
	function syncMenuTabs(root: HTMLElement) {
		const radios = root.querySelectorAll<HTMLInputElement>(".menu-tab-input");
		const sync = () => {
			for (const radio of radios) {
				const tabId = radio.id.replace("menu-tab-", "");
				const label = root.querySelector<HTMLElement>(`#menu-tab-label-${tabId}`);
				const panel = root.querySelector<HTMLElement>(`#menu-panel-${tabId}`);
				const selected = radio.checked;
				label?.setAttribute("aria-selected", String(selected));
				if (panel) panel.hidden = !selected;
			}
		};
		for (const radio of radios) radio.addEventListener("change", sync);
		sync();
	}
	document.querySelectorAll<HTMLElement>(".menu-tabs").forEach(syncMenuTabs);
</script>
```

Note: minimal JS only for `aria-selected` / `hidden` parity with the old React island — no React, no hooks.

**Post-ship (2026-09-07):** Move radios **outside** `role="tablist"`; tablist holds labels only (`inline-flex items-center justify-center min-h-11`). Hidden radios inside flex broke active pill sizing on mobile.

- [x] **Step 2: Delete `MenuTabs.tsx`**

```bash
rm src/plugins/bol-theme/astro/islands/MenuTabs.tsx
```

- [x] **Step 3: Manual check — menu tabs** — 375px pill alignment + tab switch verified 2026-09-07

- [x] **Step 4: Tab layout fix** — radios outside tablist; labels-only flex row (see spec post-ship follow-up)

---

### Task 4: Gallery block — wire `node` props

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Gallery.astro`

**Interfaces:**
- Consumes: `getPtNode`, `BolGalleryNode`
- Produces: gallery bento grid with CMS eyebrow/title/subtitle

- [x] **Step 1: Update Gallery.astro frontmatter**

```astro
---
import { getEmDashCollection } from "emdash";
import { Image } from "emdash/ui";
import { getPtNode } from "../../utils/pt-node.ts";
import type { BolGalleryNode } from "../../types/pt-blocks.ts";

const node = getPtNode<BolGalleryNode>(Astro.props);
const { eyebrow, title, subtitle } = node;
const locale = Astro.currentLocale ?? "en";

// … existing gallery_items query + SPAN_CLASSES …
---
```

Template unchanged.

- [x] **Step 2: Manual check**

Home page gallery section shows bento grid with seeded images.

---

### Task 5: Contact block — node props + vanilla open-now + map

**Files:**
- Modify: `src/plugins/bol-theme/astro/blocks/Contact.astro`
- Delete: `src/plugins/bol-theme/astro/islands/OpenNowBadge.tsx`
- Delete: `src/plugins/bol-theme/astro/islands/VenueMap.tsx`

**Interfaces:**
- Consumes: `getPtNode`, `BolContactNode`, `computeStatus`/`rowsToWeekHours`/`mondayIndex` from `utils/hours.ts`, `applyTemplate`/`toBolLocale` from `utils/format.ts`
- Produces: contact section with live open-now badge (30s poll) and Leaflet map — no React

- [x] **Step 1: Update Contact.astro frontmatter**

Remove island imports. Add:

```astro
import { getPtNode } from "../../utils/pt-node.ts";
import type { BolContactNode } from "../../types/pt-blocks.ts";
import "../../styles/leaflet.css";

const node = getPtNode<BolContactNode>(Astro.props);
const {
	eyebrow,
	title,
	subtitle,
	showHours = true,
	showMap = true,
	showPhone = true,
	showSocials = true,
} = node;
```

- [x] **Step 2: Replace OpenNowBadge with badge + script**

Remove `<OpenNowBadge client:visible … />`. Add placeholder span:

```astro
<span
	id="open-now-badge"
	aria-live="polite"
	class="inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground"
>
	<span class="size-2 rounded-full bg-muted-foreground" aria-hidden="true"></span>
	<span id="open-now-badge-text">…</span>
</span>
```

Add co-located script (reuse server-side logic — `hours.ts` has no Node-only APIs):

```astro
<script define:vars={{
	openingHours: venue.openingHours,
	bolLocale,
	statusOpenTpl: ui.contact.statusOpenTpl,
	statusClosedTpl: ui.contact.statusClosedTpl,
	daysShort: ui.contact.daysShort,
}}>
	import {
		computeStatus,
		mondayIndex,
		rowsToWeekHours,
	} from "../../utils/hours.ts";
	import { applyTemplate } from "../../utils/format.ts";

	const badge = document.getElementById("open-now-badge");
	const textEl = document.getElementById("open-now-badge-text");
	if (!badge || !textEl) throw new Error("open-now-badge elements missing");

	const weekHours = rowsToWeekHours(openingHours);

	function renderStatus() {
		const status = computeStatus(new Date(), bolLocale, weekHours);
		const dot = badge.querySelector("span[aria-hidden]");
		if (status.isOpen) {
			badge.className =
				"inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300";
			if (dot) dot.className = "size-2 rounded-full bg-emerald-400 motion-safe:animate-pulse";
			textEl.textContent = applyTemplate(statusOpenTpl, { time: status.time });
		} else {
			badge.className =
				"inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground";
			if (dot) dot.className = "size-2 rounded-full bg-muted-foreground";
			const when =
				status.opensOnDay !== null && status.opensOnDay !== mondayIndex(new Date())
					? `${daysShort[status.opensOnDay]} ${status.time}`
					: status.time;
			textEl.textContent = applyTemplate(statusClosedTpl, { when });
		}
	}

	renderStatus();
	setInterval(renderStatus, 30_000);
</script>
```

- [x] **Step 3: Replace VenueMap with data-attribute root + script**

Remove `<VenueMap client:visible … />`. Add:

```astro
<div
	data-venue-map
	data-lat={venue.lat}
	data-lng={venue.lng}
	data-title={siteTitle}
	data-address={venue.address}
	role="region"
	aria-label={siteTitle}
	class="venue-map relative h-64 w-full sm:h-72"
>
	<div class="venue-map-canvas h-full w-full"></div>
	<div
		class="venue-map-loading absolute inset-0 grid place-items-center bg-surface"
		aria-hidden="true"
	>
		<span class="size-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand"></span>
	</div>
</div>
```

Add map init script (port from `VenueMap.tsx`):

```astro
<script>
	async function initVenueMaps() {
		const L = (await import("leaflet")).default;
		await import("leaflet/dist/leaflet.css");

		for (const root of document.querySelectorAll<HTMLElement>("[data-venue-map]")) {
			const canvas = root.querySelector<HTMLElement>(".venue-map-canvas");
			const loading = root.querySelector<HTMLElement>(".venue-map-loading");
			if (!canvas || canvas.dataset.initialized === "true") continue;

			const lat = Number(root.dataset.lat);
			const lng = Number(root.dataset.lng);
			const title = root.dataset.title ?? "";
			const address = root.dataset.address ?? "";

			const map = L.map(canvas, { scrollWheelZoom: false }).setView([lat, lng], 16);
			const tileOptions = { maxNativeZoom: 16, maxZoom: 19 } as const;

			L.tileLayer(
				"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
				{
					...tileOptions,
					attribution:
						'Tiles &copy; Esri — Source: Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
				},
			).addTo(map);
			L.tileLayer(
				"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
				tileOptions,
			).addTo(map);

			const pin = L.divIcon({
				className: "venue-pin-anchor",
				html: '<span class="venue-pin" aria-hidden="true"></span>',
				iconSize: [30, 30],
				iconAnchor: [15, 34],
				popupAnchor: [0, -30],
			});

			L.marker([lat, lng], { icon: pin, title })
				.addTo(map)
				.bindPopup(`<strong>${title}</strong><br/><span>${address}</span>`);

			canvas.dataset.initialized = "true";
			loading?.remove();
		}
	}

	initVenueMaps();
</script>
```

Keep `import "../../styles/leaflet.css"` in frontmatter for dark pin / z-index overrides.

- [x] **Step 4: Delete island files**

```bash
rm src/plugins/bol-theme/astro/islands/OpenNowBadge.tsx
rm src/plugins/bol-theme/astro/islands/VenueMap.tsx
```

- [x] **Step 5: Manual check — contact**

On `/#contact`: hours table renders, open-now badge shows status (updates on 30s interval), map loads with dark tiles + pin popup, Google Maps link works. Terminal: no hook errors.

---

### Task 6: Inline home routes — delete HomeRoute wrapper

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/hu/index.astro`
- Modify: `src/pages/de/index.astro`
- Delete: `src/plugins/bol-theme/astro/routes/HomeRoute.astro`

**Interfaces:**
- Consumes: same logic as current `HomeRoute.astro`
- Produces: locale home pages without extra wrapper component

- [x] **Step 1: Replace `src/pages/index.astro` with inlined home**

Copy body from `HomeRoute.astro` directly into the page (adjust import paths — one fewer `../` level):

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import { getEmDashEntry, getSiteSettings } from "emdash";
import { PortableText } from "emdash/ui";
import Base from "../layouts/Base.astro";
import { resolveSiteIdentity } from "../utils/site-identity";
import { buildContentSeo } from "../utils/seo";

const locale = Astro.currentLocale ?? "en";
const { entry: page, isPreview, cacheHint } = await getEmDashEntry("pages", "home", {
	locale,
});

if (!page) {
	return Astro.redirect("/404");
}

if (Astro.cache?.enabled) Astro.cache.set(cacheHint);

const settings = await getSiteSettings();
const identity = resolveSiteIdentity(settings);
const seo = buildContentSeo({
	entry: page,
	path: getRelativeLocaleUrl(locale, "/"),
	identity,
});
---

<Base
	{...seo}
	content={{ collection: "pages", id: page.data.id, slug: page.id }}
>
	{isPreview && (
		<p role="status" class="mx-auto max-w-6xl px-4 pt-4 text-sm text-brand">
			Preview mode — unpublished changes may be visible.
		</p>
	)}

	{
		page.data.content && (
			<div {...page.edit.content}>
				<PortableText value={page.data.content} />
			</div>
		)
	}
</Base>
```

- [x] **Step 2: Update locale wrappers**

`src/pages/hu/index.astro` and `src/pages/de/index.astro` — same content as `index.astro` but import paths use `../../`:

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import { getEmDashEntry, getSiteSettings } from "emdash";
import { PortableText } from "emdash/ui";
import Base from "../../layouts/Base.astro";
import { resolveSiteIdentity } from "../../utils/site-identity";
import { buildContentSeo } from "../../utils/seo";

// … identical logic to index.astro …
---
```

Alternative (DRY): duplicate full file in all three — spec prefers inline over wrapper; small duplication is acceptable for three locale entry points.

- [x] **Step 3: Delete HomeRoute**

```bash
rm src/plugins/bol-theme/astro/routes/HomeRoute.astro
```

- [x] **Step 4: Grep for stale imports**

```bash
rg "HomeRoute|MenuTabs|OpenNowBadge|VenueMap" src/
```

Expected: no matches.

---

### Task 7: Verify experiences pages + typecheck + full manual QA

**Files:**
- Verify: `src/pages/experiences.astro`, `src/pages/hu/experiences.astro`, `src/pages/de/experiences.astro`

**Interfaces:**
- Consumes: existing `ExperiencesRoute` + `ExperienceFilter` slot pattern (already correct)

- [x] **Step 1: Confirm experiences filter stays page-level**

Each experiences page must keep:

```astro
<ExperiencesRoute gridId={filter.gridId}>
	<ExperienceFilter
		slot="filters"
		client:load
		filterLabel={filter.filterLabel}
		filters={filter.filters}
		gridId={filter.gridId}
	/>
</ExperiencesRoute>
```

Do **not** move `ExperienceFilter` into `ExperiencesRoute.astro` or any PT block.

- [x] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: 0 errors.

- [x] **Step 3: Dev server smoke — no hook errors**

```bash
bun dev
```

Open `/`, `/hu/`, `/de/`, `/experiences`, `/hu/experiences`, `/de/experiences`. Terminal must show **zero** `Invalid hook call` / `useState` null errors.

- [ ] **Step 4: Full manual checklist (375px + 1440px, en/hu/de)**

| # | Check |
|---|-------|
| 1 | Hero: kicker, titleTop, titleAccent, subtitle, CTAs from CMS |
| 2 | Benefits: 3 cards with icons |
| 3 | Menu: tabs switch; HUF prices; footnote |
| 4 | Gallery: bento grid |
| 5 | Contact: hours, open-now badge, map popup, phone/email, socials |
| 6 | Mobile menu: symmetric open/close, logo stable, scroll lock |
| 7 | Experiences: filter chips (All/Gaming/Social/Events), 6 cards |
| 8 | Language switcher preserves page context |
| 9 | Footer socials/contact intact |

- [x] **Step 5: Update spec/plan docs** — 2026-09-07 (user-requested housekeeping)

---

## Completion gate

- [x] All five `bol.*` blocks read `Astro.props.node`
- [x] `MenuTabs.tsx`, `OpenNowBadge.tsx`, `VenueMap.tsx`, `HomeRoute.astro` deleted
- [x] `ExperienceFilter.tsx` remains page-level only
- [x] `bun run typecheck` — 0 errors
- [x] Home CMS copy renders; no hook SSR errors on `/` (smoke-tested 2026-09-07)
- [x] Menu tab pill layout at 375px (2026-09-07); full 1440px + hu/de pass — Part 5 Task 21
