# Worklog — Bar of Legends visual prototype

Project: Next.js 16 App Router visual prototype for Bar of Legends (Győr) — landing + Experiences catalog, locales en|hu|de, premium dark gamer-bar aesthetic.

---
Task ID: 0
Agent: orchestrator (Z.ai Code)
Task: Inspect scaffold, plan build, initialize shared worklog

Work Log:
- Confirmed scaffold: Next.js 16 (App Router), Tailwind CSS 4 (@theme inline), shadcn/ui set in src/components/ui, TypeScript, bun.
- Key files read: package.json, src/app/layout.tsx, src/app/globals.css, next.config.ts, src/components/ui/button.tsx.
- Decision: adopt the documented i18n pattern where src/app/[locale]/layout.tsx is the root layout (renders <html lang>); "/" is redirected to /en via next.config redirects. Old src/app/layout.tsx, src/app/page.tsx and src/app/api/ will be removed to satisfy "no API routes / two pages only".
- Design tokens locked: bg #0d0d0f, surfaces #16161a/#1e1e24, amber accent #f2b33d, muted teal #45d0c8, Bebas Neue display + Manrope body (latin-ext for Hungarian), radius-card 1rem, amber glow shadow.
- Task 1 (placeholder photos) runs as a resumable background bun script (scripts/generate-placeholders.ts) writing 26 images to public/placeholders.

Stage Summary:
- Plan of task IDs: 1 images (bg job) · 2 tokens/shell · 3 i18n + data · 4 chrome · 5 landing blocks · 6 experiences · 7 README/lint · 8 agent-browser verification · 9 worklog finalization.

---
Task ID: 1
Agent: orchestrator (background job: scripts/generate-placeholders.ts)
Task: Generate 26 AI placeholder photos into public/placeholders

Work Log:
- Wrote resumable bun script (z-ai-web-dev-sdk, 2 workers, 429-aware backoff, 2s pacing).
- First detached runs died silently / hit 429 storms; switched to resumable foreground chunks.
- Chunk 1: 17 images; chunk 2: remaining 9 → ALL_DONE (26/26).

Stage Summary:
- 26 photos in public/placeholders (hero, drinks, snacks, venue scenes), ~2.7 MB total, JPEG bytes with .png names (browser-safe).

---
Task ID: 2-9 (orchestrator)
Agent: Z.ai Code
Task: Tokens/shell, i18n+data, chrome, landing blocks, experiences, README, lint, browser verification

Work Log:
- src/app/[locale]/layout.tsx adopted as ROOT layout (Bebas Neue + Manrope, latin-ext, <html lang>); "/" → /en via next.config redirect; deleted src/app/{layout,page}.tsx and src/app/api (no API routes).
- globals.css: dark-only brand tokens (--color-bg #0d0d0f, --color-surface, --color-accent #f2b33d, --color-accent-muted #45d0c8, --font-display, --font-body, --radius-card, --shadow-glow) mapped into Tailwind 4 @theme inline; kenburns/status-pulse keyframes; reduced-motion + focus-ring + scrollbar styles.
- Data layer: i18n dictionaries (en/hu/de, type-enforced via `hu: Dictionary`), menu.ts (18 items, HUF), experiences.ts (6 cards), hours.ts (Mon-first, post-midnight closes, computeStatus), gallery.ts, venue.ts, format.ts (HUF grouping, templates).
- Chrome: Header (sticky, blur), MobileNav (full-screen), LanguageSwitcher (path-preserving), Footer (hours/address/email/socials/copyright), MobileActionBar (call/menu/map/book, safe-area, md:hidden).
- Landing: Hero (poster + kenburns + scrim, stacked CTAs), Benefits (3 cards), MenuTabs (ARIA tabs, price badges), GalleryBento (12 items, spans, dense flow), ContactSection (hours table, OpenNowBadge, Maps/Waze, tel/mailto, socials).
- Experiences: hero, ExperienceGrid (aria-pressed filter chips), ExperienceCard (category chip, meta, tel/mailto/ask CTA), CTA band; favicon.svg; README with file manifest + scope disclaimer.
- BUGFIX 1: mobile menu overlay rendered inside <header> whose backdrop-blur created a CSS containing block, trapping the fixed overlay → moved MobileNav outside <header> as sibling.
- BUGFIX 2: stale Turbopack CSS cache (old scaffold stylesheet served after edits, Turbopack panic) → killed server, rm -rf .next, restarted; fonts/tokens then served correctly.
- Verification (agent-browser): 375px — no horizontal scroll (scrollWidth=375), hero/menu tabs (Snacks=6 items)/contact badge ("Closed now · opens 2:00 PM")/mobile menu/socials OK; locales en/hu/de switch with path preservation and html lang; experiences filters (All=6, Events=2); desktop 1440px — 3-col menu + bento + contact + footer; console clean, no 404 assets; footer pb 88px clears the mobile action bar.

Stage Summary:
- Prototype complete: /en /hu /de (+/experiences) static-rendered, dark premium brand, trilingual, zero backend. Lint clean. Browser-verified at 375px and 1440px.

---
Task ID: 10
Agent: Z.ai Code
Task: Remove Waze button, add interactive Leaflet map (user feedback); fix duplicate React key "Karte" in MobileActionBar

Work Log:
- Fixed console error "two children with the same key Karte": MobileActionBar now keys actions by stable ids (call/menu/map/book); de.ts actions.menu renamed "Karte" → "Menü" so the de action bar reads Anruf/Menü/Karte/Buchen.
- Removed Waze: ContactSection Waze button deleted, `waze` key dropped from en/hu/de dictionaries, `wazeUrl` removed from venue.ts.
- Geocoded Szabadsajtó utca, Győr via Nominatim → VENUE.lat 47.6877 / lng 17.6326 (street-level, prototype placeholder).
- New src/components/VenueMap.tsx ('use client'): plain Leaflet via dynamic import (SSR-safe), dark Esri World Dark Gray basemap + Reference label overlay (keyless; CARTO tiles rejected — now served with "API KEY REQUIRED" watermark), amber gradient divIcon pin with glow, popup (name + localized address), scrollWheelZoom off, loading spinner, proper cleanup (StrictMode-safe).
- globals.css: Leaflet overrides scoped under .leaflet-container (specificity beats leaflet.css regardless of import order) — dark popup, zoom controls, attribution; amber .venue-pin styles.
- Address card rework: VenueMap (h-64 sm:h-72, rounded, bordered) + full-width Google Maps deep-link button (kept for turn-by-turn).
- Installed leaflet@1.9.4 + @types/leaflet; README manifest/scope updated.
- ENV QUIRK (again): Turbopack did not hot-rebuild globals.css edits — served stale chunk with same hash; required pkill + rm -rf .next + restart twice. Remember for future CSS token edits.

Stage Summary:
- Contact block now: hours + open/closed badge, interactive dark map with branded amber pin & popup, Google Maps deep link, tel/mailto, socials. Duplicate-key console error eliminated; de/hu/en action bars all-unique.
- Browser-verified (375px + 1440px, en/hu/de): map tiles + pin + popup render, no console errors/warnings, scrollWidth=375 (no h-scroll), lint clean.

---
Task ID: 11
Agent: Z.ai Code
Task: Integrate FasterFixes visual feedback widget (self-hosted hub, hardcoded tokens)

Work Log:
- Installed @fasterfixes/react@0.0.10 (+transitive @fasterfixes/core). Read docs (faster-fixes.com/docs/widget/react) and inspected dist .d.ts: chose the self-host FeedbackProviderCore path per user snippet.
- New src/components/FeedbackWidget.tsx ('use client'): module-level FasterFixesClient({apiKey, apiOrigin}) → FeedbackProviderCore with reviewerToken, config {enabled:true, branding:false}, captureDiagnostics, apiOrigin — all hardcoded as requested; color=var(--color-accent) (brand amber), position bottom-right.
- Wrapped site content in app/[locale]/layout.tsx with <FeedbackWidget> (Context.Provider adds no DOM — layout unchanged).
- globals.css: mobile-only override lifts the widget portal child above the fixed action bar: [data-ff-widget] > div { bottom: calc(5rem + safe-area) !important } under max-width 767px (verified idle-state is the only div child; overlays return null when inactive).
- Clean rebuild (Turbopack globals.css cache quirk again) + lint clean.
- Browser-verified 375px & 1440px: widget mounts, amber trigger sits above mobile action bar (bottom 80px) / default 20px on desktop, click expands toolbar (112px) with pins/list/exit controls, console clean.
- HUB BLOCKER: API calls to https://shitty-hub.gornostay25.dev/support/api/v1/feedback fail with 403 `cf-mitigated: challenge` — Cloudflare bot challenge (curl server-side gets the same). Not fixable in project code; needs a Cloudflare allow rule for the API path/origin on the hub. Widget degrades gracefully (UI works, console stays clean).

Stage Summary:
- Feedback widget fully integrated per provided snippet with hardcoded tokens; renders in brand amber on both pages/locales. End-to-end API verification blocked by hub-side Cloudflare challenge (documented above).
