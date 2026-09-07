# BOL Lucide Icons — Design

**Status:** Implemented (archived 2026-09-07) — plan at [`../plans/2026-09-07-bol-lucide-icons.md`](../plans/2026-09-07-bol-lucide-icons.md)  
**Date:** 2026-09-07  
**Context:** Custom inline SVGs in `Icon.astro` look inconsistent (footer contact icons called out). Replace with `@lucide/astro` via a thin wrapper so all bol-theme call sites keep the existing `<Icon name="…" />` API.

---

## Goals

1. **Consistent icon quality** — Lucide stroke icons site-wide in bol-theme.
2. **Minimal caller churn** — keep `Icon.astro` name-based API; no import rewrites in ~10 consumers.
3. **Remove duplication** — delete hand-rolled SVG paths and unused `icons.tsx`.
4. **Tree-shaking** — wrapper imports only the 14 mapped Lucide components.

## Non-goals

- Icons outside `bol-theme` (template `src/components/` etc.).
- `lucide-react` for React islands (none use icons today; add only if needed later).
- Custom icon design or Lucide Lab icons.
- Global CSS theming beyond existing Tailwind `class` on `<Icon />`.

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Scope | Full bol-theme — all `Icon.astro` usages |
| Package | `@lucide/astro` (`bun add @lucide/astro`) |
| API | Thin wrapper — `<Icon name="mail" class="size-4" />` unchanged |
| Social brands | Lucide removed brand icons — keep inline SVG for `instagram`, `facebook`, `tiktok` only |
| Default size | `class="size-5"` default on wrapper (same as today) |
| A11y | `aria-hidden="true"` on decorative icons (Lucide default + explicit on wrapper) |

---

## Architecture

### `Icon.astro` (rewritten)

Frontmatter:

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
  Users,
  X,
  // Tiktok — import if available in @lucide/astro
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
  tiktok: Tiktok, // or fallback
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

- Pass `class` through to Lucide (supports Tailwind `size-*`, `text-brand`, `shrink-0`, etc.).
- Do not set Lucide `size` prop when `class` includes dimensions — Tailwind wins via SVG width/height from class.
- Export `IconName` type for consumers that need it (optional; internal union in Props is enough for now).

### Deleted files

| File | Reason |
|------|--------|
| `astro/icons/icons.tsx` | Dead duplicate React SVGs; zero imports |

### Unchanged consumers (API-compatible)

| File | Usage |
|------|-------|
| `theme/SiteFooter.astro` | map-pin, mail, phone, social ids |
| `blocks/Contact.astro` | map-pin, phone, mail, social ids |
| `theme/MobileNav.astro` | menu, x, chevron-right, social ids |
| `theme/MobileActionBar.astro` | phone, beer, map-pin, calendar-check |
| `theme/SiteHeader.astro` | gamepad2 |
| `blocks/Benefits.astro` | beer, gamepad2, users via CMS map |
| `components/ExperienceCard.astro` | clock, phone/mail CTA |
| `routes/ExperiencesRoute.astro` | mail |
| `blocks/Hero.astro` | map-pin |

No changes to Benefits CMS icon keys (`beer` | `gamepad` | `users`) or social `SocialNetwork` ids.

---

## TikTok fallback

Lucide may ship `Tiktok` in `@lucide/astro`. At implementation:

1. Try `import { Tiktok } from "@lucide/astro"`.
2. If missing, keep a single inline SVG path for `tiktok` only inside `Icon.astro` (not a second full icon system).

---

## Dependencies

```bash
bun add @lucide/astro
```

No `astro.config.mjs` integration required — icons are imported as Astro components per [Lucide Astro guide](https://lucide.dev/guide/astro/getting-started).

---

## Manual verification

1. `bun run typecheck` — clean.
2. Footer contact row — mail, phone, map-pin crisp and aligned at 375px + 1440px.
3. Mobile nav — menu/x/chevron; action bar — 4 icons.
4. Home benefits — 3 benefit icons.
5. Social buttons — Instagram, Facebook, TikTok in footer, contact, mobile nav.
6. No visual regressions on experience cards (clock, CTA icons).

---

## Files touched

| Action | Path |
|--------|------|
| Modify | `src/plugins/bol-theme/astro/icons/Icon.astro` |
| Delete | `src/plugins/bol-theme/astro/icons/icons.tsx` |
| Modify | `package.json`, `bun.lock` |

---

## Next step

Implementation plan via `writing-plans` skill.
