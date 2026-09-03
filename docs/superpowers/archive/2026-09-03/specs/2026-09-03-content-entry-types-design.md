# Content Entry Types — Design Spec

**Status:** Implemented (archived 2026-09-03)  
**Supersedes (partially):** [`./2026-08-28-shittysites-template-design.md`](./2026-08-28-shittysites-template-design.md) — byline type patch and removal of content field casts after Spec 1/2  
**Date:** 2026-09-03  
**EmDash version:** 0.36.0 (+ bun patch)  
**Scope:** Template-wide type cleanup (Option B)

---

## Problem

The ShittySites template used TypeScript type assertions to work around gaps between EmDash's generated collection types and runtime query results.

### Root cause (fixed via patch)

EmDash 0.36 type generator emitted `bylines` but not `byline`, even though `getEmDashEntry` / `getEmDashCollection` hydrate both at runtime.

**Fix:** `patches/emdash@0.36.0.patch` adds to `zod-generator.ts`:

- `byline?: BylineSummary | null` on every collection interface
- `BylineSummary` to generated imports in `emdash-env.d.ts`

Remove the patch when upstream EmDash includes this in a release.

### Secondary issues (fixed in template)

Unnecessary casts in pages:

- `posts/[slug].astro`: `id as string`, `featured_image as never`
- `[slug].astro`: template double-cast
- `showcase/[slug].astro`: 11 field-level casts
- `PostMeta.astro`: `as Post & { byline? }` workaround

---

## Solution

1. **Upstream:** bun patch on `emdash@0.36.0` for `byline` in type generator
2. **Template:** remove all content field casts; use generated types directly
3. **Shared alias:** `src/types/content.ts` exports `PageTemplate` for layout map keys

No `HydratedEntryFields` bridge — patch closes the generator gap.

---

## Files changed

| File | Change |
|------|--------|
| `patches/emdash@0.36.0.patch` | Add `byline` field + `BylineSummary` import to generator |
| `package.json` | `patchedDependencies` for emdash |
| `src/types/content.ts` | `PageTemplate` alias from `Page["template"]` |
| `src/components/PostMeta.astro` | Direct `post.data.byline` / `.bylines` — no cast |
| `src/pages/posts/[slug].astro` | Remove `id` and `featured_image` casts |
| `src/pages/[slug].astro` | Typed layout map with `satisfies Record<PageTemplate, …>` |
| `src/pages/showcase/[slug].astro` | Destructure `entry.data`; remove all field casts |
| `AGENTS.md` | Document patch, `emdash-env.d.ts` rules, `PageTemplate` |

---

## Rules for agents

- **Never** hand-edit `emdash-env.d.ts` — regenerated on dev server start
- Use `post.data.byline` and `post.data.bylines` directly (typed after patch)
- Use `PageTemplate` from `src/types/content.ts` for page layout maps
- No `as never` / `as string` on content fields — fix types at source instead
- Remove `patches/emdash@0.36.0.patch` when EmDash ships `byline` in generator

---

## Verification

```bash
bun run typecheck   # 0 errors
rg ' as ' src/      # only `as const` / `satisfies` remain
```

Manual spot-check:

| Route | Expected |
|-------|----------|
| `/posts/welcome-to-shittysites` | Primary byline + multi-byline credits |
| `/about` | Page renders with Default template |
| `/showcase/all-fields` | All 16 field types render |

---

## Upstream PR target

In EmDash `generateTypeScript()` and `generateTypesFile()`:

```typescript
lines.push(`  byline?: BylineSummary | null;`);
const imports = ["BylineSummary", "ContentBylineCredit", "TaxonomyTerm"];
```

Until merged: keep `patches/emdash@0.36.0.patch`.
