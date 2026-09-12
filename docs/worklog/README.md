# EmDash pipeline worklog — Bar of Legends

Chronicle of building the Bar of Legends production site on the ShittySites EmDash template. Covers **template foundation → BOL migration → hardening → Cloudflare deploy**.

**Purpose:** Capture what was done, why, and how — including decisions and template gaps — so learnings can feed back into the ShittySites template for future client sites.

**Out of scope:** The Next.js visual prototype in `docs/design/v1/` was built in a separate pipeline. It is referenced only as design input for the EmDash migration, not documented here. See [`docs/design/v1/worklog.md`](../design/v1/worklog.md) for that history.

**Template backlog:** Consolidated lessons for improving the ShittySites template → [`../template-lessons.md`](../template-lessons.md).

---

## Phase index

| Phase | Period | Commits | File |
|-------|--------|---------|------|
| 1 — Template foundation | 2026-09-02 – 2026-09-03 | `ef717c3`, `47ee3fb`, `5ea961c` | [`01-template-foundation.md`](./01-template-foundation.md) |
| 2 — BOL migration | 2026-09-05 – 2026-09-07 | `5cc37b2` → `291ca20` | [`02-bol-migration.md`](./02-bol-migration.md) |
| 3 — BOL hardening | 2026-09-10 – 2026-09-12 | `4be3086`, `c7eb374` | [`03-bol-hardening.md`](./03-bol-hardening.md) |
| 4 — Cloudflare deploy | 2026-09-12 | `4ed0ae1` | [`04-cloudflare-deploy.md`](./04-cloudflare-deploy.md) |

### Supplementary

| Doc | Scope |
|-----|--------|
| [`05-design-migration.md`](./05-design-migration.md) | How the Next.js prototype was rewritten into EmDash — component mapping, pitfalls, interactivity rules (cross-cutting; spans phases 2–3) |

---

## Project arc (one paragraph)

The repo started as the EmDash Marketing starter, was reshaped into the **ShittySites agency base** (unstyled semantic HTML + full EmDash demo), then forked for **Bar of Legends**: a native `bol-theme` plugin with CMS collections, Portable Text blocks, en/hu/de i18n, and venue admin. Production deploy on Cloudflare Workers exposed platform limits (setup wizard + KV object cache, D1 FTS5 import, `$media.file` seed gap) that required custom Bun scripts and a dedicated runbook.

---

## Source inventory

| Source | Used for |
|--------|----------|
| **Git history** (`git log`, `git show`) | Authoritative record of what shipped |
| **Archived specs/plans** (`docs/superpowers/archive/`) | Intended design, decisions, task breakdown |
| **Agent transcripts** (Cursor, Sep 2025) | Rationale, dead ends, debugging — see mapping below |
| **Runbooks** (`CLOUDFLARE-DEPLOYMENT.md`, `SEED-REFERENCE.md`) | Cross-linked; not duplicated in full |

### Transcript → phase mapping

| Transcript ID | Phase | Notes |
|---------------|-------|-------|
| `ab5753af` | 2 | BOL migration design brainstorm (Sep 4–5) |
| `585d0517` | 2, 4 | **Primary thread** — Parts 1–5 execution, post-ship fixes, Cloudflare deploy (Sep 5–12) |
| `8742e188` | 2 | Parallel migration thread (Parts 3–5, Sep 6–7) |
| `bc62729d` | 2 | Superseded monolithic migration attempt (Sep 5) |
| `c466be39` | 3 | Hero media picker + archive specs (Sep 9–10) |
| `518544bc` | 3 | EmDash 0.37 upgrade + patch (Sep 12) |
| `d363f8e1` | 4 | D1 export script TypeScript fix (Sep 12) |
| `ab5753af`, `bc62729d` | 5 (design) | Prototype → EmDash design brainstorm + failed monolith (Sep 5) |

**Gaps:** Commits `ef717c3`, `47ee3fb`, `5ea961c` (phase 1) have no agent transcript coverage. Reconstructed from git diff and archived specs only.

---

## How to read each phase file

Every phase file follows the same structure:

1. **Context** — template/site state at phase start
2. **Work log** — chronological entries (what / why / how)
3. **Key decisions** — summary table
4. **Template takeaways** — phase-local bullets; consolidated in [`../template-lessons.md`](../template-lessons.md)
