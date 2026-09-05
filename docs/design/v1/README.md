# Bar of Legends — Visual Prototype

Premium dark-mode design prototype for **Bar of Legends** (Szabadsajtó utca 2, Győr, Hungary) — an esports bar site with a single-page landing and an Experiences catalog, localized in **English, Hungarian and German**.

> **Visual prototype only. Booking, menu CMS, and gallery assets will be wired in a later production pass.**

## Run it

```bash
bun install        # already installed in the sandbox
bun run dev        # dev server on port 3000
```

Then open the preview panel. `/` redirects to `/en`; the locales live at `/en`, `/hu`, `/de`.

Lint check: `bun run lint`

## File manifest (every file created for this prototype)

```
next.config.ts                                  # "/" → "/en" redirect (prototype routing)
public/favicon.svg                              # branded favicon (D-pad mark)
public/placeholders/                            # AI-generated placeholder photos (26 images)
scripts/generate-placeholders.ts                # regeneration script for placeholder photos
src/app/globals.css                             # design tokens + brand theme (Tailwind 4)
src/app/[locale]/layout.tsx                     # root shell: fonts, header, footer, metadata
src/app/[locale]/page.tsx                       # landing — all 5 blocks
src/app/[locale]/experiences/page.tsx           # experiences catalog
src/components/Header.tsx                       # sticky header + desktop nav
src/components/MobileNav.tsx                    # full-screen mobile menu
src/components/LanguageSwitcher.tsx             # en | hu | de switcher
src/components/MobileActionBar.tsx              # thumb-zone action bar (call/map/menu/book)
src/components/VenueMap.tsx                     # interactive dark Leaflet map (contact block)
src/components/FeedbackWidget.tsx               # FasterFixes visual feedback widget (self-hosted hub)
src/components/Footer.tsx                       # hours, address, email, socials, copyright
src/components/Hero.tsx                         # block 1 — full-viewport hero
src/components/Benefits.tsx                     # block 2 — 3 fact cards
src/components/MenuTabs.tsx                     # block 3 — tabbed menu (no PDFs)
src/components/GalleryBento.tsx                 # block 4 — bento gallery
src/components/ContactSection.tsx               # block 5 — hours, badge, live map, tel, mailto
src/components/OpenNowBadge.tsx                 # live open/closed pill (client local time)
src/components/ExperienceCard.tsx               # catalog card
src/components/ExperienceGrid.tsx               # filter chips + card grid
src/components/icons.tsx                        # social icons (incl. TikTok)
src/data/venue.ts                               # address, email, phone, deep links, socials
src/data/hours.ts                               # opening hours + open/closed logic
src/data/menu.ts                                # 18 menu items × 3 locales (HUF prices)
src/data/experiences.ts                         # 6 experience cards × 3 locales
src/data/gallery.ts                             # bento gallery items + localized alt text
src/data/format.ts                              # HUF price + template helpers
src/data/i18n/config.ts                         # locale list & types
src/data/i18n/en.ts | hu.ts | de.ts             # dictionaries (type-checked completeness)
src/data/i18n/index.ts                          # getDictionary()
README.md
```

## Scope

- **Two pages only**: landing (`/en`) and Experiences (`/en/experiences`), plus shared chrome.
- **No backend**: no API routes, no database, no auth, no booking engine, no forms.
- **Interactive map**: embedded Leaflet map with a dark Esri/OSM basemap (no API key); "Google Maps" remains a deep link for turn-by-turn directions.
- **Feedback widget**: FasterFixes visual bug reporting (`@fasterfixes/react`) pointed at a self-hosted hub; credentials hardcoded in `src/components/FeedbackWidget.tsx` for the prototype.
- **Static data** lives in `src/data/` — edit those files to change copy, prices or cards.
- All visible strings exist in **all three locales**; the dictionaries are type-enforced (`hu: Dictionary`, `de: Dictionary`), so a missing translation fails the type check.
- Photos in `public/placeholders/` are AI-generated stand-ins; the phone number is a placeholder.

## Design tokens

Defined in `src/app/globals.css` (`:root`, consumed via Tailwind 4 `@theme inline`):

| Token | Value | Utility |
| --- | --- | --- |
| `--color-bg` | `#0d0d0f` | `bg-bg`, `bg-background` |
| `--color-surface` / `--color-surface-2` | `#16161a` / `#1e1e24` | `bg-surface`, `bg-surface-2` |
| `--color-accent` (amber) | `#f2b33d` | `text-brand`, `bg-brand` |
| `--color-accent-muted` (teal) | `#45d0c8` | `text-brand-muted` |
| `--font-display` | Bebas Neue (latin-ext) | `font-display` |
| `--font-body` | Manrope (latin-ext) | `font-body` |
| `--radius-card` | `1rem` | `rounded-card` |
| `--shadow-glow` | amber glow | `shadow-glow` |

Accessibility: WCAG AA body-text contrast on dark surfaces, visible amber focus rings, 48px+ touch targets, `prefers-reduced-motion` disables the hero zoom and animations, semantic landmarks (`header`/`main`/`footer`/`nav`/`section`) with labelled headings.
