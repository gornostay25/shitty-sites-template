# Prod interactivity polish — Implementation Plan

**Status:** Implemented (archived 2026-09-17) — spec at [`../specs/2026-09-17-prod-interactivity-polish-design.md`](../specs/2026-09-17-prod-interactivity-polish-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove global public JS boot; defer Leaflet via `client:visible`; co-locate menu, open-now, gallery, and mobile-nav scripts in child components; align hero media types with EmDash image objects; ship a clean production build.

**Architecture:** React island for map only (`VenueMap.tsx` + shared `VIEWPORT_LAZY_ROOT_MARGIN`). All other interactivity uses deduped Astro processed `<script>` in statically imported child `.astro` files (PT blocks stay script-free). Delete `public-page.ts`, `venue-map-mount.ts`, and `VenueMapIsland.astro` after migration.

**Tech Stack:** Astro 7, React (existing admin + islands), EmDash 0.38, Leaflet 1.9.4, Bun

**Spec:** [`../specs/2026-09-17-prod-interactivity-polish-design.md`](../specs/2026-09-17-prod-interactivity-polish-design.md)

## Global Constraints

- No automated test files or test scripts (project has no test suite).
- Manual verification only (`bun run build`, browser smoke).
- Do not commit unless the user explicitly asks.
- PT block `.astro` files (`Menu.astro`, `Contact.astro`, `Gallery.astro`) must **not** gain hoisted `<script>` tags.
- No legacy re-export shims when deleting moved modules — update imports, then delete.
- Image fields in CMS are objects — prefer `<Image image={…} />` from `"emdash/ui"` on public pages.

---

## File map

| File | Action |
|------|--------|
| `src/plugins/bol-theme/astro/islands/constants.ts` | Create |
| `src/plugins/bol-theme/astro/islands/VenueMap.tsx` | Create |
| `src/plugins/bol-theme/astro/components/OpenNowBadge.astro` | Create |
| `src/plugins/bol-theme/astro/components/MenuTabsEnhancer.astro` | Create |
| `src/plugins/bol-theme/astro/components/GalleryLightbox.astro` | Create |
| `src/plugins/bol-theme/astro/components/gallery-lightbox.ts` | Create |
| `src/plugins/bol-theme/astro/components/MobileNavEnhancer.astro` | Create |
| `src/plugins/bol-theme/astro/components/mobile-nav-client.ts` | Create |
| `src/plugins/bol-theme/astro/blocks/Contact.astro` | Modify |
| `src/plugins/bol-theme/astro/blocks/Menu.astro` | Modify |
| `src/plugins/bol-theme/astro/blocks/Gallery.astro` | Modify |
| `src/plugins/bol-theme/astro/blocks/contact-open-now.ts` | Modify (element-scoped API) |
| `src/plugins/bol-theme/astro/theme/MobileNav.astro` | Modify |
| `src/pages/experiences.astro` | Modify (`client:idle`) |
| `src/layouts/Base.astro` | Modify (remove global script) |
| `src/plugins/bol-theme/types/pt-blocks.ts` | Modify (hero image type) |
| `src/plugins/bol-theme/astro/blocks/Hero.astro` | Modify (`Image` from emdash/ui) |
| `src/plugins/bol-theme/astro/client/public-page.ts` | Delete |
| `src/plugins/bol-theme/astro/blocks/venue-map-mount.ts` | Delete |
| `src/plugins/bol-theme/astro/components/VenueMapIsland.astro` | Delete |
| `src/plugins/bol-theme/utils/resolve-media-picker-url.ts` | Delete if unused after Hero |

---

### Task 1: Shared island constant

**Files:**
- Create: `src/plugins/bol-theme/astro/islands/constants.ts`

**Interfaces:**
- Produces: `export const VIEWPORT_LAZY_ROOT_MARGIN = "200px"`

- [ ] **Step 1: Add constants file**

```ts
/** Matches prior Lighthouse map deferral — passed to Astro `client:visible`. */
export const VIEWPORT_LAZY_ROOT_MARGIN = "200px";
```

- [ ] **Step 2: Verify**

Run: `bun run build`  
Expected: succeeds (file unused until Task 2 is fine).

---

### Task 2: Venue map React island

**Files:**
- Create: `src/plugins/bol-theme/astro/islands/VenueMap.tsx`
- Modify: `src/plugins/bol-theme/astro/blocks/Contact.astro`
- Delete: `src/plugins/bol-theme/astro/components/VenueMapIsland.astro`
- Delete: `src/plugins/bol-theme/astro/blocks/venue-map-mount.ts`

**Interfaces:**
- Consumes: `VIEWPORT_LAZY_ROOT_MARGIN` from `./constants.ts`
- Props: `{ lat: number; lng: number; title: string; address: string; ariaLabel: string }`
- Produces: default export React component for `<VenueMap client:visible={{ rootMargin: VIEWPORT_LAZY_ROOT_MARGIN }} … />`

- [ ] **Step 1: Create `VenueMap.tsx`**

Port logic from `venue-map-mount.ts` `initVenueMap()` into `useEffect` (runs only after `client:visible` hydrates). Use a ref on the canvas container; guard with `ref.dataset.initialized` or a `useRef` flag.

```tsx
import { useEffect, useRef } from "react";

export type VenueMapProps = {
	lat: number;
	lng: number;
	title: string;
	address: string;
	ariaLabel: string;
};

export default function VenueMap({ lat, lng, title, address, ariaLabel }: VenueMapProps) {
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

		const canvas = root.querySelector<HTMLElement>(".venue-map-canvas");
		const loading = root.querySelector<HTMLElement>(".venue-map-loading");
		if (!canvas || canvas.dataset.initialized === "true") return;

		let cancelled = false;

		(async () => {
			await import("leaflet/dist/leaflet.css");
			await import("../../styles/leaflet.css");
			const L = (await import("leaflet")).default;
			if (cancelled) return;

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
		})();

		return () => {
			cancelled = true;
		};
	}, [lat, lng, title, address]);

	return (
		<div
			ref={rootRef}
			className="venue-map relative h-64 w-full sm:h-72"
			role="region"
			aria-label={ariaLabel}
		>
			<div className="venue-map-canvas h-full w-full" />
			<div
				className="venue-map-loading absolute inset-0 grid place-items-center bg-surface"
				aria-hidden="true"
			>
				<span className="size-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Wire `Contact.astro`**

Replace `VenueMapIsland` import with:

```astro
---
import VenueMap from "../islands/VenueMap.tsx";
import { VIEWPORT_LAZY_ROOT_MARGIN } from "../islands/constants.ts";
---
```

Replace the map component usage:

```astro
<VenueMap
	client:visible={{ rootMargin: VIEWPORT_LAZY_ROOT_MARGIN }}
	lat={venue.lat}
	lng={venue.lng}
	title={siteTitle}
	address={venue.address}
	ariaLabel={siteTitle}
/>
```

- [ ] **Step 3: Delete** `VenueMapIsland.astro` and `venue-map-mount.ts`

- [ ] **Step 4: Manual verify**

Dev server: open `/`, Network tab — Leaflet chunks should **not** load until contact/map nears viewport. Map renders, spinner removed.

---

### Task 3: Open-now badge component

**Files:**
- Create: `src/plugins/bol-theme/astro/components/OpenNowBadge.astro`
- Modify: `src/plugins/bol-theme/astro/blocks/contact-open-now.ts`
- Modify: `src/plugins/bol-theme/astro/blocks/Contact.astro`

**Interfaces:**
- Consumes: `OpenNowConfig` from `contact-open-now.ts`
- Produces: `initOpenNowBadge(badgeEl: HTMLElement, config: OpenNowConfig): void` (element-scoped; replaces id-based lookup)

- [ ] **Step 1: Refactor `contact-open-now.ts`**

Replace `initOpenNowBadge(badgeId: string, config)` with:

```ts
export function initOpenNowBadge(badgeEl: HTMLElement, config: OpenNowConfig): void {
	const textEl = badgeEl.querySelector<HTMLElement>("[data-open-now-text]");
	if (!textEl) return;
	// … same renderStatus logic, using badgeEl + textEl …
}
```

- [ ] **Step 2: Create `OpenNowBadge.astro`**

Props: `config: OpenNowConfig` (pass JSON-serializable object from Contact frontmatter).

Markup: root `span` with `data-open-now-config={JSON.stringify(config)}`, inner dot + `<span data-open-now-text>…</span>`.

Script:

```astro
<script>
	import { initOpenNowBadge, type OpenNowConfig } from "../blocks/contact-open-now.ts";

	for (const badge of document.querySelectorAll<HTMLElement>("[data-open-now-config]")) {
		const raw = badge.dataset.openNowConfig;
		if (!raw) continue;
		initOpenNowBadge(badge, JSON.parse(raw) as OpenNowConfig);
	}
</script>
```

- [ ] **Step 3: Replace inline badge in `Contact.astro`** with `<OpenNowBadge config={{ openingHours: venue.openingHours, bolLocale, … }} />`

- [ ] **Step 4: Manual verify**

Contact hours card shows open/closed state; updates without console errors.

---

### Task 4: Menu tabs enhancer

**Files:**
- Create: `src/plugins/bol-theme/astro/components/MenuTabsEnhancer.astro`
- Modify: `src/plugins/bol-theme/astro/blocks/Menu.astro`

**Interfaces:**
- Consumes: `initMenuTabs(root: HTMLElement)` from `../blocks/menu-tabs.ts` (unchanged)

- [ ] **Step 1: Create `MenuTabsEnhancer.astro`**

No visible DOM:

```astro
<script>
	import { initMenuTabs } from "../blocks/menu-tabs.ts";
	document.querySelectorAll<HTMLElement>(".menu-tabs").forEach(initMenuTabs);
</script>
```

- [ ] **Step 2: Import at end of `Menu.astro`** (after `</section>` or inside section after `.menu-tabs` markup):

```astro
import MenuTabsEnhancer from "../components/MenuTabsEnhancer.astro";
---
<!-- existing markup -->
<MenuTabsEnhancer />
```

- [ ] **Step 3: Manual verify**

Home `#menu`: click tabs, arrow keys, first panel visible by default.

---

### Task 5: Gallery lightbox (processed script)

**Files:**
- Create: `src/plugins/bol-theme/astro/components/gallery-lightbox.ts`
- Create: `src/plugins/bol-theme/astro/components/GalleryLightbox.astro`
- Modify: `src/plugins/bol-theme/astro/blocks/Gallery.astro`

**Interfaces:**
- Produces: `export function initGalleryLightbox(root: HTMLElement): void`

- [ ] **Step 1: Create `gallery-lightbox.ts`**

Move logic from current `Gallery.astro` inline script; scope queries to `root`:

```ts
export function initGalleryLightbox(root: HTMLElement): void {
	const dialog = root.querySelector<HTMLDialogElement>("[data-gallery-dialog]");
	const img = root.querySelector<HTMLImageElement>("[data-gallery-img]");
	const caption = root.querySelector<HTMLElement>("[data-gallery-caption]");
	const grid = root.querySelector(".bol-gallery-grid");

	grid?.addEventListener("click", (event) => {
		const trigger =
			event.target instanceof Element ? event.target.closest(".bol-gallery__trigger") : null;
		if (!trigger || !dialog || !img || !caption) return;
		const src = (trigger as HTMLElement).dataset.src;
		const alt = (trigger as HTMLElement).dataset.alt ?? "";
		if (!src) return;
		img.src = src;
		img.alt = alt;
		caption.textContent = alt;
		if (typeof dialog.showPopover === "function") dialog.showPopover();
	});

	dialog?.addEventListener("click", (event) => {
		if (event.target === dialog) dialog.hidePopover();
	});

	root.querySelector("[data-gallery-close]")?.addEventListener("click", () => {
		dialog?.hidePopover();
	});
}
```

- [ ] **Step 2: Create `GalleryLightbox.astro`**

Props: `lightboxLabel: string`, `closeLabel: string`. Wrapper `div` with `data-bol-gallery-root`. Default slot for grid + header content OR split: Gallery keeps header/grid inside wrapper.

Recommended structure in `Gallery.astro`:

```astro
import GalleryLightbox from "../components/GalleryLightbox.astro";
---
<section …>
  <GalleryLightbox lightboxLabel={ui.gallery.lightboxLabel} closeLabel={ui.gallery.close}>
    <!-- eyebrow, title, grid (unchanged) -->
  </GalleryLightbox>
</section>
```

`GalleryLightbox.astro` template:

```astro
---
interface Props {
	lightboxLabel: string;
	closeLabel: string;
}
const { lightboxLabel, closeLabel } = Astro.props;
---
<div data-bol-gallery-root class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
	<slot />
	<dialog popover="auto" class="bol-gallery-lightbox" aria-label={lightboxLabel} data-gallery-dialog>
		<!-- move inner close button, img data-gallery-img, caption data-gallery-caption -->
	</dialog>
</div>
<script>
	import { initGalleryLightbox } from "./gallery-lightbox.ts";
	document.querySelectorAll<HTMLElement>("[data-bol-gallery-root]").forEach(initGalleryLightbox);
</script>
```

Move global gallery `<style is:global>` blocks with the dialog (stay in `Gallery.astro` or move to `GalleryLightbox.astro` — either is fine; keep selectors unchanged).

- [ ] **Step 3: Remove** `is:inline` script block from `Gallery.astro` (lines ~253–285).

- [ ] **Step 4: Manual verify**

Click gallery tile → lightbox opens; backdrop click and close button dismiss.

---

### Task 6: Mobile nav enhancer

**Files:**
- Create: `src/plugins/bol-theme/astro/components/mobile-nav-client.ts`
- Create: `src/plugins/bol-theme/astro/components/MobileNavEnhancer.astro`
- Modify: `src/plugins/bol-theme/astro/theme/MobileNav.astro`

- [ ] **Step 1: Add dataset on trigger** (`part === "trigger"` button):

```astro
data-open-label={ui.nav.openMenu}
data-close-label={ui.nav.closeMenu}
```

- [ ] **Step 2: Create `mobile-nav-client.ts`**

```ts
export function initMobileNav(): void {
	const dialog = document.getElementById("bol-mobile-nav");
	const trigger = document.querySelector<HTMLElement>(".bol-mobile-nav-trigger");
	if (!dialog || !trigger) return;

	const openLabel = trigger.dataset.openLabel ?? "";
	const closeLabel = trigger.dataset.closeLabel ?? "";

	dialog.addEventListener("toggle", (event) => {
		const open = (event as ToggleEvent).newState === "open";
		trigger.setAttribute("aria-expanded", String(open));
		trigger.setAttribute("aria-label", open ? closeLabel : openLabel);
	});

	dialog.addEventListener("click", (event) => {
		const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
		if (link && dialog.contains(link)) dialog.hidePopover();
	});
}
```

- [ ] **Step 3: `MobileNavEnhancer.astro`**

```astro
<script>
	import { initMobileNav } from "./mobile-nav-client.ts";
	initMobileNav();
</script>
```

Import once from `MobileNav.astro` panel branch (after `</dialog>`) or from `SiteHeader.astro` once per page — **only one** enhancer import sitewide (e.g. end of panel `part` in `MobileNav.astro`).

- [ ] **Step 4: Remove** `is:inline define:vars` script block from `MobileNav.astro`.

- [ ] **Step 5: Manual verify**

Mobile width: open menu → `aria-label` switches to close; tap link → menu closes.

---

### Task 7: Remove global boot

**Files:**
- Modify: `src/layouts/Base.astro`
- Delete: `src/plugins/bol-theme/astro/client/public-page.ts`
- Modify: `src/plugins/bol-theme/astro/client/public-page.ts` importers (grep first)

- [ ] **Step 1: Remove from `Base.astro`**

Delete:

```astro
<script>
	import "../plugins/bol-theme/astro/client/public-page.ts";
</script>
```

- [ ] **Step 2: Delete** `public-page.ts`

- [ ] **Step 3: Grep** repo for `public-page` / `initVenueMaps` / `initAllMenuTabs` — expect zero hits.

- [ ] **Step 4: Manual verify**

Full home smoke again (menu, contact, gallery, header).

---

### Task 8: Experiences filter hydration

**Files:**
- Modify: `src/pages/experiences.astro`

- [ ] **Step 1: Change directive**

```astro
<ExperienceFilter
	slot="filters"
	client:idle
	…
/>
```

- [ ] **Step 2: Manual verify**

`/experiences` — filters work after brief idle; no hydration console errors.

---

### Task 9: Hero media types + EmDash Image

**Files:**
- Modify: `src/plugins/bol-theme/types/pt-blocks.ts`
- Modify: `src/plugins/bol-theme/astro/blocks/Hero.astro`
- Delete: `src/plugins/bol-theme/utils/resolve-media-picker-url.ts` (if no remaining imports)

**Interfaces:**
- Use collection image shape from `emdash-env.d.ts` (e.g. fields on `gallery_items` image) or inline `{ src?: string; alt?: string; width?: number; height?: number; id?: string; meta?: … }` matching generated types.

- [ ] **Step 1: Update `BolHeroNode`**

```ts
/** Block Kit `media_picker` — EmDash image object after seed media upload. */
backgroundImage?: {
	id?: string;
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	meta?: Record<string, unknown>;
};
```

(Align field names with what PT actually returns — inspect runtime or `emdash-env.d.ts` if block fields differ.)

- [ ] **Step 2: Update `Hero.astro`**

Remove `resolveMediaPickerUrl` and plain `<img src={heroSrc}>`. Use:

```astro
import { Image } from "emdash/ui";
---
{backgroundImage?.src ? (
  <Image
    image={backgroundImage}
    alt=""
    priority
    sizes="100vw"
    placeholder={false}
    class="bol-hero-cover …"
  />
) : (
  /* gradient-only fallback */
)}
```

Keep `HERO_IMAGE_WIDTH` / `HEIGHT` only if still needed for layout; prefer image object dimensions when present.

- [ ] **Step 3: Delete** `resolve-media-picker-url.ts` if grep shows no usages.

- [ ] **Step 4: Manual verify**

Home hero LCP image loads with `fetchpriority` / eager behavior; no `@fs` URLs in DOM.

---

### Task 10: Production gate

- [ ] **Step 1: Build**

Run: `bun run build`  
Expected: exit 0, no TypeScript errors.

- [ ] **Step 2: Smoke checklist** (from spec)

| Route | Check |
|-------|--------|
| `/` | Menu tabs, gallery lightbox, contact map deferral, open-now |
| `/experiences` | Idle filter |
| `/hu/` | Same home checks |
| Mobile | Nav popover |

- [ ] **Step 3: Optional Lighthouse** mobile `/` — perf not worse than post-hero baseline.

---

## Plan self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| No global boot in Base | 7 |
| Map via `client:visible`, no custom IO | 2 |
| Menu / open-now / gallery / mobile processed scripts in children | 3–6 |
| No unnecessary `is:inline` | 5–6 |
| `client:idle` on ExperienceFilter | 8 |
| Hero image types + EmDash Image | 9 |
| Delete dead modules | 2, 7, 9 |
| Manual verification | All tasks + 10 |
