# Bar of Legends — Design Prototype Prompt (GLM Agent)

```
ROLE:
You are a senior product designer and front-end visual prototyper specializing in premium hospitality and gaming-venue websites.

TASK:
Design and scaffold a Next.js App Router visual prototype for Bar of Legends (Győr, Hungary). Deliver a design-first, mobile-first UI shell with two routes: a single-page landing and an Experiences catalog page. Return the complete project file tree plus all layout, component, and style files needed to render both pages in the browser.
 
CONTEXT:
Bar of Legends is an esports bar at Szabadsajtó utca 2, Győr, Hungary. Reference the current public site at https://www.baroflegends.net/en — a Wix landing with weak mobile UX, PDF drink menus, vague marketing copy, and an empty Experiences page.

This prototype exists only to lock visual design, information architecture, and component patterns. Success means a stakeholder opens it on a phone, instantly feels a premium dark gamer-bar brand, finds menu items and contact actions without friction, and browses experience offerings as real cards—not lorem ipsum.

Audience: 90% mobile visitors (tourists and locals planning a night out). They need fast answers: what is this place, what's on the menu, what's happening tonight, how do I get there, can I book.

Venue facts to embed in the design:
- Address: Szabadsajtó utca 2, Győr, Hungary
- Email: baroflegendsgyor@gmail.com
- Social: Instagram, Facebook, TikTok
- Locales: English, Hungarian, German (en | hu | de)
- Stack: Next.js App Router + Tailwind CSS
- Scope: visual prototype only — landing + Experiences page

Opening hours (use in footer and contact block):
- Monday: 2:00 PM – 11:00 PM
- Tuesday: 2:00 PM – 12:00 AM
- Wednesday: 2:00 PM – 1:00 AM
- Thursday: 2:00 PM – 12:00 AM
- Friday: 2:00 PM – 2:00 AM
- Saturday: 2:00 PM – 2:00 AM
- Sunday: 2:00 PM – 11:00 PM

Use placeholder photos/videos and realistic Hungarian bar pricing in HUF. No backend, booking engine, payment, or auth.

CONSTRAINTS:
Visual direction (MUST follow):
- Premium Dark Mode: deep graphite/near-black backgrounds (#0d0d0f to #1a1a1e range), layered surfaces with subtle elevation, restrained neon accents (amber/gold, muted cyan, or soft emerald)—NEVER garish purple or high-saturation "RGB gamer" gradients.
- Typography: one strong display face for headlines, one highly legible sans for body; generous line-height on mobile.
- Imagery: cinematic bar atmosphere—craft beer pours (Vaskakas), cocktails, gaming setups, social crowd energy. Use `<video>` or CSS placeholders where assets are missing; NEVER leave empty hero.

Mobile-first (MUST):
- Design at 375px width first, then scale up to tablet and desktop.
- Primary actions (call, menu, book, map) MUST sit in thumb-reachable zones: sticky bottom bar or fixed FAB cluster on mobile is acceptable.
- Touch targets minimum 48×48px; spacing between tappable elements minimum 8px.

Code philosophy (MUST):
- This is a **design prototype**, not production software. Minimize logic: no API routes, no database, no form submissions, no state management libraries, no authentication.
- Use static/mock data arrays inlined in components or a single `data/` folder. Buttons and tabs MAY use client-side UI state only (tab switch, mobile menu open/close, language toggle).
- Prefer Tailwind CSS utility classes. Keep components flat and readable.
- i18n: simple locale switcher (en | hu | de) with JSON or TS dictionaries—no i18n framework required. All visible strings MUST exist in all three locales.
- URL pattern: /en, /hu, /de via `[locale]` segment or equivalent.
- Do NOT integrate CMS, headless APIs, PDF viewers, or third-party booking widgets.
- Do NOT mention downstream migration targets or internal stack in code comments or README.

Site map (exactly two pages plus shared chrome):
1. Landing (home) — single scroll page, five blocks in order below.
2. Experiences — full catalog page (see OUTPUT section).

Shared chrome (both pages):
- Header: logo left, primary nav (Home, Menu anchor, Experiences, Contact anchor), language switcher, mobile hamburger → full-screen or slide-over menu.
- Footer: opening hours summary, address, email, social icons (Instagram, Facebook, TikTok), compact copyright.

Landing page blocks (top to bottom, MUST include all):

Block 1 — Hero
- Full-viewport background: looped muted autoplay video (bar atmosphere / Vaskakas pour) or poster + play overlay fallback. Dark gradient scrim for text contrast.
- H1: hard-hitting offer line (example EN: "Esports, craft beer & cocktails in the heart of Győr" — adapt per locale).
- Subline: one sentence on atmosphere, not abstract fluff.
- Two primary CTAs side by side on desktop, stacked on mobile: "View menu" (scroll to menu block) and "Book a table" (tel: or mailto: placeholder).
- Optional: subtle scroll indicator.

Block 2 — Benefits (3 columns → 1 column stack on mobile)
- Three fact cards—no vague marketing:
  1. Vaskakas craft beer + cocktails from Hungary's bartender of the year.
  2. High-spec gaming PCs, PS5, board games, weekly pub quizzes.
  3. A regular community—not an anonymous tourist trap.
- Each card: icon or small image, headline, 2–3 sentence body.

Block 3 — Next-gen menu
- Single in-page section with three tabs: Alcoholic | Non-alcoholic | Snacks.
- Tab panel: responsive grid of menu cards—photo, name, price in HUF (e.g. "2 490 Ft"), one-line description.
- At least 6 items per tab with realistic placeholder data.
- NO PDF links, NO subpage navigation for menu categories.

Block 4 — Gallery (Bento grid)
- Asymmetric bento layout: mix of landscape/portrait cells, 8–12 items.
- Hover/tap subtle zoom or brightness shift. Lightbox optional.
- Intentional visual rhythm, not chaotic masonry.

Block 5 — Contact & pragmatics
- Opening hours table for all seven days.
- Live status badge: "Open now" / "Closed now" from static hours + client local time (simple JS allowed).
- Address with one-tap buttons: "Google Maps" and "Waze" (external links, placeholder coords OK).
- Clickable tel: link and mailto: for baroflegendsgyor@gmail.com.
- Social icon row (Instagram, Facebook, TikTok) linking to # placeholders.

Experiences page (MUST — full catalog, not empty state):
- Page hero: title + one-line intro ("More than drinks—pick your night").
- Filter chips or category tabs optional: All | Gaming | Social | Events.
- Grid of experience cards (minimum 6). Required categories:
  1. PC & PS5 gaming stations
  2. Board game library
  3. Weekly pub quiz
  4. Foosball & darts
  5. Private events / party booking
  6. One wildcard (e.g. console tournaments or watch parties)
- Each card: photo placeholder, category label, title, 2–3 sentence description, optional meta (duration, group size, schedule hint), CTA ("Book" → tel/mailto OR "Ask at the bar" → contact anchor).
- Bottom CTA band: "Don't see what you want? Contact us" → mailto or contact section.

Accessibility & polish (MUST):
- Color contrast WCAG AA for body text on dark backgrounds.
- Visible focus rings on interactive elements.
- `prefers-reduced-motion`: disable video autoplay and heavy animations.
- Semantic HTML landmarks: header, main, footer, nav, section headings in order.

Forbidden (NEVER):
- Light-mode default theme or white hero backgrounds.
- Stock "crypto/neon purple" aesthetic.
- PDF menu downloads as primary UX.
- Lorem ipsum (write real-sounding bar copy in all locales).
- Backend/server actions beyond static rendering.
- Blog, shop, login, admin, or extra pages beyond Home + Experiences.

OUTPUT:
Return a complete Next.js project with this structure minimum:

app/
  [locale]/
    layout.tsx          # shared shell, fonts, metadata
    page.tsx            # landing — all 5 blocks
    experiences/
      page.tsx          # experiences catalog
components/
  Header.tsx
  Footer.tsx
  Hero.tsx
  Benefits.tsx
  MenuTabs.tsx
  GalleryBento.tsx
  ContactSection.tsx
  ExperienceCard.tsx
  ExperienceGrid.tsx
  LanguageSwitcher.tsx
  MobileNav.tsx
  OpenNowBadge.tsx
data/
  menu.en.ts / menu.hu.ts / menu.de.ts   (or single menu with locale keys)
  experiences.en.ts / …
  hours.ts
  i18n/
    en.json
    hu.json
    de.json
public/
  placeholders/
styles/
  globals.css             # CSS variables for design tokens
README.md                 # how to run (npm/bun dev), scope disclaimer

Design tokens (in globals.css or tailwind.config):
- CSS custom properties: `--color-bg`, `--color-surface`, `--color-accent`, `--color-accent-muted`, `--font-display`, `--font-body`, `--radius-card`, `--shadow-glow`.

README MUST state: "Visual prototype only. Booking, menu CMS, and gallery assets will be wired in a later production pass."

List every created file path in a manifest comment at the top of README.

VALIDATION:
Before finishing, confirm:
- [ ] Landing renders all 5 blocks in order on 375px viewport without horizontal scroll.
- [ ] Experiences page shows at least 6 distinct experience cards with photo, title, description, and CTA.
- [ ] Language switcher toggles visible strings across en, hu, and de on both pages.
- [ ] Menu section uses tabs (Alcoholic / Non-alcoholic / Snacks) with HUF prices—no PDF links.
- [ ] Contact block shows open/closed badge, map deep links, tel:, mailto:, and social icons.
- [ ] No API routes, database code, or auth—only static/mock data and minimal client UI state.
- [ ] Dark premium aesthetic with restrained neon accents; no default light theme.
- [ ] Output matches the file tree above and includes a runnable README.
```
