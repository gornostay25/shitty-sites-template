# BOL Lucide Icons — Implementation Plan

**Status:** Implemented (archived 2026-09-07) — spec at [`../specs/2026-09-07-bol-lucide-icons-design.md`](../specs/2026-09-07-bol-lucide-icons-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-rolled SVGs in bol-theme with `@lucide/astro` via a thin `Icon.astro` wrapper; delete dead `icons.tsx`.

**Architecture:** Install `@lucide/astro`. Rewrite `Icon.astro` as a name → Lucide component map (14 icons). All ~10 consumers keep `<Icon name="…" class="…" />` unchanged. TikTok: use Lucide export if present, else minimal inline fallback in wrapper only.

**Tech Stack:** Astro 7, `@lucide/astro`, TypeScript, Tailwind CSS 4.

**Spec:** [2026-09-07-bol-lucide-icons-design.md](../specs/2026-09-07-bol-lucide-icons-design.md) (archived)

## Global Constraints

- **Scope:** bol-theme only — do not touch template `src/components/` icons.
- **API frozen:** `<Icon name="mail" class="size-4" />` — no caller rewrites.
- **No automated tests** — manual verification + `bun run typecheck` only.
- **No git commits** unless user explicitly asks.
- **Default class:** `size-5` on wrapper when `class` omitted.
- **A11y:** `aria-hidden="true"` on decorative icons.

---

## Official documentation

| Step | Read first |
|------|------------|
| Install + usage | [Lucide Astro getting started](https://lucide.dev/guide/astro/getting-started) |

---

## File map

| Path | Action |
|------|--------|
| `package.json`, `bun.lock` | **Modify** — add `@lucide/astro` |
| `src/plugins/bol-theme/astro/icons/Icon.astro` | **Modify** — Lucide wrapper |
| `src/plugins/bol-theme/astro/icons/icons.tsx` | **Delete** |
| `docs/superpowers/specs/2026-09-07-bol-lucide-icons-design.md` | **Modify** — status Implemented |
| `docs/superpowers/specs/README.md` | **Modify** |
| `docs/superpowers/plans/README.md` | **Modify** |

---

### Task 1: Install dependency + rewrite Icon.astro

**Files:**
- Modify: `package.json`, `bun.lock`
- Modify: `src/plugins/bol-theme/astro/icons/Icon.astro`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `@lucide/astro` in dependencies
  - `Icon.astro` with `IconName` union and Lucide map
  - Same public API: `name` + optional `class` (default `size-5`)

- [ ] **Step 1: Install package**

Run: `bun add @lucide/astro`
Expected: `@lucide/astro` added to `package.json` dependencies.

- [ ] **Step 2: Verify Tiktok export**

Run: `bun -e "import * as lucide from '@lucide/astro'; console.log('Tiktok' in lucide ? 'yes' : 'no')"`
Expected: `yes` or `no` — determines Step 3 branch.

- [ ] **Step 3: Replace `Icon.astro`**

If Tiktok exported, use full Lucide map:

```astro
---
import {
	Beer,
	CalendarCheck,
	ChevronRight,
	Clock,
	Facebook,
	Gamepad2,
	Instagram,
	Mail,
	MapPin,
	Menu,
	Phone,
	Tiktok,
	Users,
	X,
} from "@lucide/astro";

const ICONS = {
	beer: Beer,
	"calendar-check": CalendarCheck,
	"chevron-right": ChevronRight,
	clock: Clock,
	facebook: Facebook,
	gamepad2: Gamepad2,
	instagram: Instagram,
	mail: Mail,
	"map-pin": MapPin,
	menu: Menu,
	phone: Phone,
	tiktok: Tiktok,
	users: Users,
	x: X,
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
	name: IconName;
	class?: string;
}

const { name, class: className = "size-5" } = Astro.props;
const LucideIcon = ICONS[name];
---

<LucideIcon class={className} aria-hidden="true" />
```

If Tiktok **not** exported, use conditional render for `tiktok` only:

```astro
---
// ... same imports except omit Tiktok; ICONS map omits tiktok key
import type { SVGAttributes } from "astro/types";

interface Props {
	name: IconName | "tiktok";
	class?: string;
}

const { name, class: className = "size-5" } = Astro.props;
const LucideIcon = name !== "tiktok" ? ICONS[name as IconName] : null;
---

{
	LucideIcon ? (
		<LucideIcon class={className} aria-hidden="true" />
	) : (
		<svg
			viewBox="0 0 24 24"
			class={className}
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
		</svg>
	)
}
```

- [ ] **Step 4: Typecheck**

Run: `bun run typecheck`
Expected: PASS — all existing `<Icon name={…} />` call sites type-check against `IconName`.

---

### Task 2: Delete dead code + update docs

**Files:**
- Delete: `src/plugins/bol-theme/astro/icons/icons.tsx`
- Modify: `docs/superpowers/specs/2026-09-07-bol-lucide-icons-design.md`
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/plans/README.md`

**Interfaces:**
- Consumes: Task 1 `Icon.astro`
- Produces: no `icons.tsx`; spec status Implemented

- [ ] **Step 1: Delete `icons.tsx`**

Confirm zero imports first:

Run: `rg "icons/icons" src/`
Expected: no matches.

Then delete `src/plugins/bol-theme/astro/icons/icons.tsx`.

- [ ] **Step 2: Set spec status**

`2026-09-07-bol-lucide-icons-design.md` → **Implemented (2026-09-07)**.

- [ ] **Step 3: Update README indexes**

Add entry to specs + plans README tables.

- [ ] **Step 4: Final typecheck**

Run: `bun run typecheck`
Expected: PASS, 0 errors.

---

### Task 3: Manual verification

**Files:** none

- [ ] **Step 1: Footer contact** — `/` scroll to footer; map-pin, mail, phone aligned, crisp strokes.
- [ ] **Step 2: Mobile chrome** — 375px: hamburger menu/x/chevron; bottom action bar 4 icons.
- [ ] **Step 3: Home blocks** — benefits icons (beer, gamepad, users); hero map-pin.
- [ ] **Step 4: Socials** — footer + contact + mobile nav Instagram/Facebook/TikTok buttons.
- [ ] **Step 5: Experiences** — card clock + CTA mail/phone icons on `/experiences`.

---

## Completion gate

- [ ] `bun run typecheck` — zero errors
- [ ] `icons.tsx` deleted; no hand-rolled SVG paths in `Icon.astro` except TikTok fallback (if needed)
- [ ] All manual checks above pass at 375px
- [ ] Spec + plan README updated
