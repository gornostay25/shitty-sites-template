# BOL Migration — Part 1: Foundation

> **Part 1 of 5** · Index: [2026-09-05-bol-theme-migration.md](./2026-09-05-bol-theme-migration.md) · Spec: [design doc](../specs/2026-09-05-bol-theme-migration-design.md)

**Prerequisites:** None — start here.

**Delivers:** Field Kit removed, en/hu/de i18n enabled, BOL design tokens in `global.css`, stripped `Base.astro` shell ready for bol-theme chrome (Part 3).

**Next:** [Part 2 — Plugin core](./2026-09-05-bol-theme-migration-02-plugin-core.md) after Tasks 1–3 checkboxes done.

---

## Official documentation

Verify against live docs ([Docs MCP](https://docs.emdashcms.com/docs-mcp/) · [llms.txt](https://docs.emdashcms.com/llms.txt)) before implementing.

| Task | Read first |
|------|------------|
| 1 — i18n | [Internationalization](https://docs.emdashcms.com/guides/internationalization/) · [Configuration](https://docs.emdashcms.com/reference/configuration/) |
| 2 — tokens / dark | [Dark mode](https://docs.emdashcms.com/guides/dark-mode/) |
| 3 — Base shell | [Site settings](https://docs.emdashcms.com/guides/site-settings/) · [Page layouts](https://docs.emdashcms.com/guides/page-layouts/) |

**Project skills:** `.agents/skills/building-emdash-site/` (querying, caching, configuration).

---

## Tasks in this part

| Task | Summary |
|------|---------|
| 1 | Remove Field Kit, enable i18n |
| 2 | BOL design tokens in global CSS |
| 3 | Strip Base.astro to BOL shell |

---

## Task 1: Remove unused plugins and enable i18n

**Files:**
- Modify: `astro.config.mjs`
- Modify: `package.json`
- Modify: `bun.lock` (via install)

- [ ] **Step 1: Remove Field Kit from `astro.config.mjs`**

Delete:
```javascript
import { fieldKitPlugin } from "@emdash-cms/plugin-field-kit";
```
and remove `fieldKitPlugin()` from the `plugins` array.

- [ ] **Step 2: Uninstall Field Kit**

```bash
bun remove @emdash-cms/plugin-field-kit
```

- [ ] **Step 3: Enable i18n in `astro.config.mjs`**

```javascript
i18n: {
  defaultLocale: "en",
  locales: ["en", "hu", "de"],
  fallback: { hu: "en", de: "en" },
},
```

Do not add `prefixDefaultLocale` or `routing: "prefix-always"`.

- [ ] **Step 4: Verify against running dev server**

Open `http://localhost:4321` and `/_emdash/admin` (restart only if config change not picked up).

Expected: admin loads without 404.

---

## Task 2: BOL design tokens in global CSS

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace demo tokens with BOL palette**

Add to `@theme inline` and `:root` (reference prototype README token table, do not paste prototype `globals.css` wholesale):

| Variable | Value |
|----------|-------|
| `--bol-bg` | `#0d0d0f` |
| `--bol-surface` | `#16161a` |
| `--bol-surface-2` | `#1e1e24` |
| `--bol-accent` | `#f2b33d` |
| `--bol-accent-muted` | `#45d0c8` |
| `--radius-card` | `1rem` |

Map to Tailwind: `--color-bg`, `--color-surface`, `--color-brand`, `--font-display`, `--font-body`, etc.

- [ ] **Step 2: Add fonts**

Load Bebas Neue + Manrope with latin-ext via Astro font providers or `@fontsource` packages. Wire `--font-display-src` / `--font-body-src`.

- [ ] **Step 3: Add reduced-motion and focus-ring utilities**

Port **behaviour** from prototype globals (kenburns keyframe optional for hero) — rewrite CSS, don't copy file.

- [ ] **Step 4: Manual check**

Reload a page; confirm `global.css` builds with no Tailwind errors.

---

## Task 3: Strip Base.astro to BOL shell

**Files:**
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Remove ShittySites theme switcher** (inline cookie script + buttons + related `<script>`)

- [ ] **Step 2: Pin dark mode** — `class="dark"` on `<html>`

- [ ] **Step 3: Set `lang` from `Astro.currentLocale`**

- [ ] **Step 4: Add skip link** — copy from `getUiStrings(Astro.currentLocale).a11y.skipToContent`

- [ ] **Step 5: Add `pb` on `<main>`** for mobile action bar clearance: `pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0`

- [ ] **Step 6: Keep `EmDashHead`/`EmDashBodyEnd`**

Theme header/footer wired in Part 3 after plugin scaffold exists.

---

## Part 1 completion gate

- [ ] i18n locales active; admin reachable
- [ ] BOL tokens visible in computed styles
- [ ] Base layout: dark, no theme switcher, main has mobile bottom padding
- [ ] Ready for Part 2 plugin registration
