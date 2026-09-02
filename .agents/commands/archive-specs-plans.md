# Archive Specs & Plans

Archive shipped specs and plans under `docs/superpowers/archive/`. Update all README files and annotate superseded documents. **Do not commit** unless the user explicitly asks.

If the user names specific files, archive those. If they say "archive specs/plans" without names, infer from recently shipped work or ask which files.

## Paths

| Active                        | Archived                                     |
| ----------------------------- | -------------------------------------------- |
| `docs/superpowers/specs/*.md` | `docs/superpowers/archive/YYYY-MM-DD/specs/` |
| `docs/superpowers/plans/*.md` | `docs/superpowers/archive/YYYY-MM-DD/plans/` |

Use the ship date (today) for `YYYY-MM-DD`. Reuse an existing date folder if archiving more work from the same batch.

## Checklist

Complete every item — do not skip README or supersession notes.

```
- [ ] Move spec(s) and plan(s) to archive folder
- [ ] Set status on archived files
- [ ] Update docs/superpowers/specs/README.md
- [ ] Update docs/superpowers/plans/README.md
- [ ] Update docs/superpowers/archive/YYYY-MM-DD/README.md
- [ ] Update root README.md (if user-facing behavior changed)
- [ ] Annotate superseded older specs/plans
- [ ] Cross-link new spec → old when approach changed
```

## Step 1 — Move and set status

```bash
mv docs/superpowers/specs/<name>.md docs/superpowers/archive/YYYY-MM-DD/specs/
mv docs/superpowers/plans/<name>.md docs/superpowers/archive/YYYY-MM-DD/plans/
```

At the top of each archived file, set:

```markdown
**Status:** Implemented (archived YYYY-MM-DD) — plan at [`../plans/<plan>.md`](../plans/<plan>.md)
```

Plans link back to spec the same way. Fix relative paths after the move (`../specs/`, `../plans/`).

Remove entries from active `docs/superpowers/specs/README.md` and `docs/superpowers/plans/README.md`. Append a one-line summary to the matching **Archived** bullet (or add a new archive date section).

## Step 2 — Archive README

In `docs/superpowers/archive/YYYY-MM-DD/README.md`, add a section:

```markdown
## <Feature name> (YYYY-MM-DD)

<One sentence: what shipped.>

### Specs

- [`specs/<file>.md`](./specs/<file>.md)

### Plans

- [`plans/<file>.md`](./plans/<file>.md)
```

If the folder already has sections, add another `##` block — do not overwrite prior entries.

## Step 3 — Root README.md

Update `README.md` when the archived work changed anything users or developers need to know:

| Section                       | Update when                           |
| ----------------------------- | ------------------------------------- |
| **Features**                  | New or changed user-facing capability |
| **Tech Stack**                | New dependency or platform binding    |
| **Architecture**              | New jobs, queues, services, data flow |
| **API routes**                | New or renamed endpoints              |
| **Data model (D1)**           | New or changed tables                 |
| **Local Development / Setup** | New env vars, scripts, run commands   |
| **Environment variables**     | `src/env.ts` or binding changes       |
| **Project layout**            | New top-level dirs or major modules   |

Skip README edits for pure refactors with no outward change. When in doubt, add a brief note.

## Step 4 — Supersession (required when approach changed)

If the new spec/plan **replaces or changes** an older design (partial or full):

### On the **new** archived spec (header, after Status):

```markdown
**Supersedes (partially):** [`../../YYYY-MM-DD/specs/<old>.md`](../../YYYY-MM-DD/specs/<old>.md) — <what changed>
```

Use `(fully)` only when the old doc is entirely obsolete.

### On the **old** archived spec or plan:

Add immediately after the status block:

```markdown
### Amendment log

| Date       | Note                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| YYYY-MM-DD | **Superseded (partial):** <short description>. See [`../../YYYY-MM-DD/specs/<new>.md`](../../YYYY-MM-DD/specs/<new>.md). |
```

For old **plans** superseded by a new plan, same table — link to the new plan path.

Do not delete superseded content; annotate in place so history stays readable.

## Examples in this repo

- New spec supersedes old: `archive/2026-06-27/specs/2026-06-25-knowledge-graph-ai-v2-design.md` → journal AI v1
- New spec supersedes hardening sections: `archive/2026-06-28/specs/2026-06-28-knowledge-mentions-design.md` → hardening mention counters
- Archive batch README: `archive/2026-06-30/README.md` (multiple features, one date folder)
- Root README after env migration: Features unchanged; **Environment variables** + **Setup** updated for `src/env.ts` and `SESSION_SECRET` digest

## Do not

- Leave active entries in `docs/superpowers/specs/README.md` or `plans/README.md` after archiving
- Archive without updating root README when user-facing docs are stale
- Forget backward links on **old** specs when behavior moved to a new spec

## When done

Summarize what was archived, which READMEs changed, and any supersession links added.
