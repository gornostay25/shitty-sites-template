# Phase 3 — BOL hardening

**Period:** 2026-09-10 – 2026-09-12  
**Commits:** `4be3086`, `c7eb374`  
**Sources:** [migration spec (amended)](../superpowers/archive/2026-09-10/specs/2026-09-05-bol-theme-migration-design.md), agent transcripts `c466be39`, `518544bc`, git diff

## Context

BOL migration (phase 2) shipped the full public site: theme plugin, five PT blocks, experiences catalog, en/hu/de routes. Specs and plans were still in active `docs/superpowers/specs/` and `plans/`. Two follow-up items remained: a Block Kit limitation workaround for hero background images, and an EmDash version upgrade with patch migration.

---

## Work log

### 2026-09-10 — `4be3086` hero media picker + archive migration docs

- **What:** Changed hero block `backgroundImageUrl` field from manual URL `text_input` to Block Kit `media_picker`. Archived all BOL migration specs/plans to `docs/superpowers/archive/2026-09-10/`.
- **Why:**
  - Block Kit has no `media_picker` in the block modal during initial migration — hero used a plain URL text field as workaround
  - EmDash Block Kit now supports media picker; editors should pick from media library, not paste URLs
  - Active spec/plan folders should be empty after ship — archive per project convention
- **How:**
  - Updated `bol.hero` block definition in `src/plugins/bol-theme/index.ts` — field type `media_picker` instead of `text_input`
  - Stored value remains a URL string; Hero block reads it as before
  - Moved 1 spec + 6 plans to `docs/superpowers/archive/2026-09-10/`
  - Updated archive README, active specs/plans READMEs, set "Implemented" status headers
  - Also archived Sep 7 follow-up specs (PT fix, final refactor, Lucide) under `2026-09-07/` (started in commit `291ca20`, finalized here)
- **Decisions:**
  - Keep stored format as URL string — no schema migration needed for existing seed content
  - Archive rather than delete — history stays readable for template worklog and future forks

---

### 2026-09-12 — `c7eb374` EmDash 0.37 upgrade

- **What:** Bumped EmDash and related packages from 0.36 to 0.37. Recreated the byline type-generator patch for the new version.
- **Why:** Stay current with EmDash releases; 0.37 may include upstream fixes. Byline generator gap still present — patch must follow version.
- **How:**
  - Updated `package.json` dependencies: `emdash`, `@emdash-cms/cloudflare`, `@emdash-cms/admin`, etc.
  - Deleted `patches/emdash@0.36.0.patch`
  - Created `patches/emdash@0.37.0.patch` — same byline addition, adapted to 0.37 generator output
  - Updated `AGENTS.md` patch version reference
  - Verified `bun install` + `bun run typecheck` pass
- **Decisions:**
  - Keep byline patch until upstream EmDash generator ships the fix (GitHub issue tracked separately)
  - Patch file name must match exact installed version (`emdash@0.37.0.patch`)
- **Problems → fixes:**
  - Patch format differs between 0.36 and 0.37 generator — cannot rename; must recreate via `bun patch`

---

## Key decisions (summary)

| Decision | Alternatives considered | Rationale |
|----------|------------------------|-----------|
| Hero `media_picker` over URL text field | Keep text_input; use CMS featured_image | Editors pick from library; matches EmDash media patterns |
| Archive specs after ship | Leave in active folder | Project convention; active README stays clean |
| Upgrade to 0.37 before production deploy | Stay on 0.36 | Deploy on latest; patch migrates cleanly |
| Recreate patch vs wait for upstream | Remove patch, use casts again | Casts were explicitly removed in phase 1; patch is cleaner |

---

## Template takeaways

- **Document Block Kit field type limitations at fork time** — if a block needs media picker, verify Block Kit support before choosing field type; migrating field types post-ship is low-cost but avoidable.
- **Archive workflow should be part of template ship checklist** — move specs/plans, update READMEs, set status headers (command: `/archive-specs-plans`).
- **Patch version must track EmDash version exactly** — template should document `bun patch` recreation steps when upgrading EmDash.
- **Upgrade EmDash before first production deploy** — avoids deploying on stale version then upgrading live.
- **Keep `AGENTS.md` patch reference in sync** — agents rely on it to know which patch file is active.
