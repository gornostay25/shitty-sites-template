# BOL Migration — Part 3: Seed + Theme Chrome

> **Part 3 of 5** · Index: [2026-09-05-bol-theme-migration.md](./2026-09-05-bol-theme-migration.md) · Spec: [design doc](../specs/2026-09-05-bol-theme-migration-design.md)

**Prerequisites:** Part 2 complete (`bol-theme` registered, venue settings, `getUiStrings()`).

**Delivers:** BOL collections in seed, header/footer/mobile bar wired into Base — site has navigable chrome but home PT blocks not yet rendered (Part 4).

**Next:** [Part 4 — Blocks](./2026-09-05-bol-theme-migration-04-blocks.md)

---

## Files touched in this part

| Path | Responsibility |
|------|----------------|
| `seed/seed.json` | BOL collections, taxonomies, menus, demo content |
| `.emdash/uploads/` | Local seed media (`$media.file`) |
| `src/plugins/bol-theme/astro/theme/*.astro` | Header, footer, mobile bar |
| `src/plugins/bol-theme/astro/islands/MobileNav.tsx` | Full-screen mobile menu |
| `src/layouts/Base.astro` | Wire bol-theme chrome |

---

## Task 9: Replace seed with BOL collections

**Files:**
- Modify: `seed/seed.json`
- Create: `.emdash/uploads/` — local seed media (git-track demo images)

- [ ] **Step 1: Define collection schemas** per spec field tables (`menu_items`, `experiences`, `gallery_items`; taxonomies `menu_category`, `experience_category`)

- [ ] **Step 2: Add taxonomy terms** (en seed first; hu/de via `locale` + `translationOf`)

- [ ] **Step 3: Stage seed media** — copy prototype placeholders into `.emdash/uploads/` ([Including Media](https://docs.emdashcms.com/themes/creating-themes/#including-media)). Do not reference `docs/design/v1/public/` in seed.

- [ ] **Step 4: Migrate demo data** from prototype `data/*.ts`; image fields use local `$media`:

```json
"image": {
  "$media": {
    "file": "beer-pour.png",
    "alt": "Craft beer poured fresh from the tap"
  }
}
```

- [ ] **Step 5: Create `pages` home entry** slug `home` — placeholder PT until Part 4; hero background via `$media.file` (e.g. `hero.png`)

- [ ] **Step 6: Create `primary` menu** per locale

- [ ] **Step 7: Apply seed** — reset local D1 if needed; reload admin. Confirm collections + Media Library entries.

---

## Task 10: SiteHeader + LanguageSwitcher

**Files:**
- Create: `src/plugins/bol-theme/astro/theme/SiteHeader.astro`
- Create: `src/plugins/bol-theme/astro/theme/LanguageSwitcher.astro`
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Rewrite header** — logo, nav, lang switcher; match prototype layout without copying TSX

- [ ] **Step 2: LanguageSwitcher** — `getRelativeLocaleUrl` for `/` and `/experiences`

- [ ] **Step 3: Wire into Base.astro**

- [ ] **Step 4: Manual check 375px + 1440px** — nav readable, no overflow

---

## Task 11: MobileNav island

**Files:**
- Create: `src/plugins/bol-theme/astro/islands/MobileNav.tsx`

- [ ] **Step 1: Implement open/close state** — plain buttons, Tailwind, no shadcn Sheet

- [ ] **Step 2: Mount from SiteHeader** with `client:load` — portal or sibling pattern (overlay **outside** sticky header, `z-[60]`)

- [ ] **Step 3: Manual check** — menu covers viewport, closes on link click, header z-index correct

---

## Task 12: SiteFooter + MobileActionBar

**Files:**
- Create: `src/plugins/bol-theme/astro/theme/SiteFooter.astro`
- Create: `src/plugins/bol-theme/astro/theme/MobileActionBar.astro`

- [ ] **Step 1: Footer** — tagline, socials, address, phone, email — **no hours column**

- [ ] **Step 2: MobileActionBar** — fixed bottom `z-40`, call / #menu / maps / mailto, safe-area padding

- [ ] **Step 3: Wire into Base.astro**

- [ ] **Step 4: Manual check** — footer not hidden behind action bar

---

## Part 3 completion gate

- [ ] Seed applied: menu_items, experiences, gallery_items, home page stub, menus
- [ ] Header sticky `z-50`, lang switcher works
- [ ] Mobile nav + bottom action bar functional
- [ ] Footer shows venue contact, **no hours**
- [ ] Ready for Part 4 PT blocks
