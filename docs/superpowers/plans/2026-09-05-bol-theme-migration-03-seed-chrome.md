# BOL Migration — Part 3: Seed + Theme Chrome

> **Part 3 of 5** · Index: [2026-09-05-bol-theme-migration.md](./2026-09-05-bol-theme-migration.md) · Spec: [design doc](../specs/2026-09-05-bol-theme-migration-design.md)

**Prerequisites:** Part 2 complete (`bol-theme` registered, venue settings, `getUiStrings()`).

**Delivers:** BOL collections in seed, header/footer/mobile bar wired into Base — site has navigable chrome but home PT blocks not yet rendered (Part 4). Theme partials use `getUiStrings(Astro.currentLocale)` for en/hu/de labels; plugin admin stays English-only. Mobile nav uses native `<dialog popover>` (see Task 11).

**Next:** [Part 4 — Blocks](./2026-09-05-bol-theme-migration-04-blocks.md)

---

## Official documentation

Verify against live docs ([Docs MCP](https://docs.emdashcms.com/docs-mcp/) · [llms.txt](https://docs.emdashcms.com/llms.txt)) before implementing.

| Task | Read first |
|------|------------|
| 9 — seed | [Seed file format](https://docs.emdashcms.com/themes/seed-files/) · [Creating themes — including media](https://docs.emdashcms.com/themes/creating-themes/#including-media) · [Field types](https://docs.emdashcms.com/reference/field-types/) · [Taxonomies](https://docs.emdashcms.com/guides/taxonomies/) · [Internationalization](https://docs.emdashcms.com/guides/internationalization/) |
| 10 — header | [Navigation menus](https://docs.emdashcms.com/guides/menus/) · [Querying content](https://docs.emdashcms.com/guides/querying-content/) · [Internationalization](https://docs.emdashcms.com/guides/internationalization/) |
| 11–12 — chrome | [Site settings](https://docs.emdashcms.com/guides/site-settings/) (social handles) |

**Project skills:** `.agents/skills/building-emdash-site/references/schema-and-seed.md` · `site-features.md`

---

## Files touched in this part

| Path | Responsibility |
|------|----------------|
| `seed/seed.json` | BOL collections, taxonomies, menus, demo content |
| `scripts/generate-bol-seed.ts` | Seed generator (optional regen) |
| `.emdash/uploads/` | Local seed media (`$media.file`) |
| `src/plugins/bol-theme/astro/theme/*.astro` | Header, footer, mobile nav, mobile bar |
| `src/plugins/bol-theme/astro/icons/` | Icon.astro + icons.tsx |
| `src/plugins/bol-theme/utils/nav.ts` | Primary nav builder |
| `src/layouts/Base.astro` | Wire bol-theme chrome |

---

## Task 9: Replace seed with BOL collections

**Files:**
- Modify: `seed/seed.json`
- Create: `.emdash/uploads/` — local seed media (git-track demo images)

- [x] **Step 1: Define collection schemas** per spec field tables (`menu_items`, `experiences`, `gallery_items`; taxonomies `menu_category`, `experience_category`)

- [x] **Step 2: Add taxonomy terms**
- [x] **Step 3: Stage seed media**
- [x] **Step 4: Migrate demo data**
- [x] **Step 5: Create `pages` home entry**
- [x] **Step 6: Create `primary` menu**
- [ ] **Step 7: Apply seed** — reset local D1 if needed; reload admin. Confirm collections + Media Library entries.

---

## Task 10: SiteHeader + LanguageSwitcher

**Files:**
- Create: `src/plugins/bol-theme/astro/theme/SiteHeader.astro`
- Create: `src/plugins/bol-theme/astro/theme/LanguageSwitcher.astro`
- Modify: `src/layouts/Base.astro`

- [x] **Step 1: Rewrite header**
- [x] **Step 2: LanguageSwitcher**
- [x] **Step 3: Wire into Base.astro**
- [ ] **Step 4: Manual check 375px + 1440px**

---

## Task 11: MobileNav (native popover)

**Files:**
- Create: `src/plugins/bol-theme/astro/theme/MobileNav.astro`

**Approach (shipped):** Native `<dialog popover="auto">` — not a React island. CSS handles open/close transitions (`:popover-open`, `@starting-style`, `allow-discrete` on `display`/`overlay`); a tiny inline script syncs ARIA on the trigger and closes on nav link click. Popover-specific styles live in `<style is:global>` inside `MobileNav.astro` (not `global.css`). Panel renders as a **sibling** of `<header>` (below `top-16`) so `backdrop-blur` on the header does not trap the overlay and the logo stays stable.

- [x] **Step 1: Trigger + dialog panel** — `part="trigger"` in header (`popovertarget="bol-mobile-nav"`); `part="panel"` after header
- [x] **Step 2: CSS transitions** — symmetric open/close; staggered link/section fade-in; `prefers-reduced-motion`
- [x] **Step 3: Scroll lock + icon swap** — `html:has(.bol-mobile-nav:popover-open)` for overflow + menu/X toggle
- [ ] **Step 4: Manual check 375px** — open/close symmetric; no logo jump; header stays visible

---

## Task 12: SiteFooter + MobileActionBar

**Files:**
- Create: `src/plugins/bol-theme/astro/theme/SiteFooter.astro`
- Create: `src/plugins/bol-theme/astro/theme/MobileActionBar.astro`

- [x] **Step 1: Footer**
- [x] **Step 2: MobileActionBar**
- [x] **Step 3: Wire into Base.astro**
- [ ] **Step 4: Manual check**

---

## Part 3 completion gate

- [ ] Seed applied: menu_items, experiences, gallery_items, home page stub, menus
- [x] Header sticky `z-50`, lang switcher works
- [x] Mobile nav: native popover, symmetric CSS open/close, header/logo stable
- [x] Footer shows venue contact, **no hours**
- [x] Ready for Part 4 PT blocks
