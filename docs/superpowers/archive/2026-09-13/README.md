# Archive — 2026-09-13

Shipped work archived from `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Template backport (2026-09-13)

Backported Bar of Legends production patterns into ShittySites: KV bindings, deploy scripts, `$media.file` seed media, `site-theme` plugin scaffold, i18n demo seed (`en` + `uk`).

### Specs

- [`specs/2026-09-13-template-backport-design.md`](./specs/2026-09-13-template-backport-design.md)

### Plans

- [`plans/2026-09-13-template-backport.md`](./plans/2026-09-13-template-backport.md)

## Post-backport fixes — i18n routing (2026-09-13)

Fixed UK locale 404s and Hub Feedback regression after the backport. Canonical i18n pattern for EmDash single-template sites:

| Requirement | Why |
|-------------|-----|
| `routing.fallbackType: "rewrite"` in `astro.config.mjs` | No `src/pages/uk/` folders — Astro must rewrite `/uk/…` to root templates with `Astro.currentLocale = "uk"` |
| Locale slug guard in root `[slug].astro` | `/uk/` otherwise matches `slug = "uk"` and CMS lookup 404s |
| `Astro.rewrite("/")` for locale home paths | Rewrites `/uk` and `/uk/` to index without redirect loop |
| `notFoundPath()` helper | Locale-aware `/404` redirects via `getRelativeLocaleUrl` |
| `src/utils/i18n/locales.ts` | Non-default locale codes — keep in sync with `astro.config.mjs` |

Never use `prefixDefaultLocale: true` — breaks `/_emdash/admin`.

Also: Hub Feedback credentials loaded via Vite `loadEnv()` in `astro.config.mjs`; restart `bun dev` after `.env` changes.

### Specs

- [`specs/2026-09-13-post-backport-fixes-design.md`](./specs/2026-09-13-post-backport-fixes-design.md) (supersedes backport spec § i18n routing)

### Plans

- [`plans/2026-09-13-post-backport-fixes.md`](./plans/2026-09-13-post-backport-fixes.md)
