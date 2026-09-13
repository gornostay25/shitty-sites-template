# Hub Feedback Vite Plugin — Design Spec

**Status:** Implemented (archived 2026-09-12) — plan at [`../plans/2026-09-07-hub-feedback-vite-plugin.md`](../plans/2026-09-07-hub-feedback-vite-plugin.md)  
**Date:** 2026-09-07 (revised 2026-09-12)  
**Supersedes (fully):** [`../../2026-09-03/specs/2026-09-03-hub-feedback-plugin-design.md`](../../2026-09-03/specs/2026-09-03-hub-feedback-plugin-design.md) — EmDash native plugin removed  
**Scope:** Replace the native EmDash `hub-feedback` plugin with an in-repo hub feedback widget. No compile-time source annotations in shipped HTML.

**Ship note (2026-09-12):** Shipped at `src/hub-feedback/` — React island + `.env` credentials + `vite.define` in `astro.config.mjs`. No Vite plugin wrapper (planned `hubFeedback()` plugin was dropped during implementation).

---

## Summary

Remove the EmDash native plugin (`page:fragments`, admin `settingsSchema`, Astro island + `data-*` config). Replace it with `hubFeedback()` — a Vite plugin at `src/vite-plugins/hub-feedback/` registered in `astro.config.mjs`.

The widget UI and API client stay the same (`@fasterfixes/core`, copied FasterFixes widget components). Feedback metadata uses the stock `@fasterfixes/core` `captureElementContext()` — selectors, element description, nearby text, pin placement, screenshots, diagnostic trail. **`sourceFile` and Astro file paths are not injected into the DOM** because shipped client sites must not expose internal file structure in HTML.

### Decisions (brainstorming 2026-09-07, revised 2026-09-12)

| Topic | Decision |
|-------|----------|
| Configuration | `hubFeedback({ apiKey, siteId })` in `astro.config.mjs` → `vite.plugins` |
| Source annotations | **None** — no `data-hub-src` or compile-time path injection in any build |
| Widget mount | One line in `Base.astro`: `import "virtual:hub-feedback/client"` |
| Package location | In-repo flat: `src/vite-plugins/hub-feedback/` (template-only, not published) |
| Enable/disable | Remove the virtual import from `Base.astro` manually (no admin toggle, no env flag) |

**Revision note (2026-09-12):** Compile-time `data-hub-src` was dropped. Client-facing production HTML must not leak `src/components/...` paths inspectable in DevTools or view-source.

Authentication unchanged from the EmDash plugin:

| Header | Source |
|--------|--------|
| `X-API-Key` | `apiKey` — plugin option |
| `X-Reviewer-Token` | `siteId` — plugin option |

No `?ff_token=`. No localStorage reviewer token. Widget config hardcoded client-side (`enabled: true`, `branding: false`).

---

## Architecture

```
astro.config.mjs
  vite.plugins: [hubFeedback({ apiKey, siteId, apiOrigin? })]

Build time
  virtual module resolves virtual:hub-feedback/client
    embeds apiKey, siteId, apiOrigin at build time

Base.astro
  import "virtual:hub-feedback/client"   // client bootstrap, one line

Runtime (browser)
  virtual-client.ts
    create #hub-feedback-root if needed
    mount HubFeedbackWidget (FasterFixesClient + FeedbackProviderCore)
  submit feedback
    captureElementContext() from @fasterfixes/core (selectors, description, fiber path when available)

Hub API
  https://shitty-hub.gornostay25.dev/support/api/v1/feedback/...
```

**Removed paths:**

- EmDash `hubFeedbackPlugin()` descriptor + `createPlugin()` + `page:fragments`
- Admin settings UI for `hubApiKey` / `siteId`
- `HubFeedback.astro` React island
- `HubFeedbackMount.tsx` reading `#hub-feedback-root` data attributes
- `escapeHtmlAttr` / `readHubFeedbackConfig` server→client bridge

---

## Plugin API

```js
// astro.config.mjs
import { hubFeedback } from "./src/vite-plugins/hub-feedback/index.ts";

export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      hubFeedback({
        apiKey: "...",
        siteId: "...",
        apiOrigin: "https://shitty-hub.gornostay25.dev/support", // optional
      }),
    ],
  },
});
```

| Option | Required | Default | Notes |
|--------|----------|---------|-------|
| `apiKey` | yes | — | Sent as `X-API-Key` on every feedback API call |
| `siteId` | yes | — | Sent as `X-Reviewer-Token` |
| `apiOrigin` | no | `https://shitty-hub.gornostay25.dev/support` | Override for staging |

**Validation:** If `apiKey` or `siteId` is missing at config time, log a warning and emit a no-op virtual client (build succeeds, widget does nothing at runtime).

---

## Virtual module

```ts
// src/layouts/Base.astro frontmatter
import "virtual:hub-feedback/client";
```

The plugin resolves `virtual:hub-feedback/client` to a client entry that:

1. Creates `#hub-feedback-root` if absent
2. Mounts the React widget with baked-in config (no `window` global, no server-injected `data-*` div)
3. Runs entirely on the client — no Astro island wrapper

TypeScript: add `src/vite-plugins/hub-feedback/virtual.d.ts` (or equivalent) declaring the virtual module so `import "virtual:hub-feedback/client"` typechecks.

---

## Feedback metadata

Use `@fasterfixes/core` `captureElementContext()` directly — no custom capture wrapper, no DOM source attributes.

### What is captured

| Field | Astro SSR pages | React islands (dev) |
|-------|-----------------|---------------------|
| `elementDescription` | ✅ | ✅ |
| `nearbyText` | ✅ | ✅ |
| `selectors` | ✅ | ✅ |
| `pinAnchor` / `pinPlacement` | ✅ | ✅ |
| Screenshot | ✅ | ✅ |
| Diagnostic trail | ✅ | ✅ |
| `reactComponentPath` | ❌ (no React fiber) | ⚠️ sometimes in dev |
| `sourceFile` | ❌ | ⚠️ sometimes in dev (`_debugSource`) |

This matches the previous EmDash plugin behavior. Agency developers reviewing via Shitty Hub still get selectors, screenshots, and page URL — enough to locate elements without exposing file paths in client HTML.

### Example metadata payload (typical Astro page)

```json
{
  "elementDescription": "h1 \"Welcome\"",
  "nearbyText": "...",
  "selectors": { "nthOfType": "#main-content > section:nth-of-type(1) > h1" },
  "sourceFile": null,
  "reactComponentPath": null,
  "pinAnchor": { "x": 0.47, "y": 0.27 },
  "pinPlacement": { "mode": "document", "targetKind": "normal", "documentPoint": { "x": 619, "y": 472 }, "viewportPoint": { "x": 619, "y": 472 } }
}
```

---

## File layout

```
src/vite-plugins/hub-feedback/
├── index.ts                 # hubFeedback() Vite plugin factory
├── types.ts                 # HubFeedbackOptions
├── virtual-client.ts        # virtual:hub-feedback/client bootstrap + React mount
├── virtual.d.ts             # declare module "virtual:hub-feedback/client"
├── constants.ts             # HUB_API_ORIGIN, WIDGET_CONFIG
└── widget/
    ├── HubFeedbackWidget.tsx
    ├── feedback-provider-core.tsx
    ├── context.ts, utils.ts, styles.ts
    └── components/          # copied FasterFixes UI (unchanged behavior)

src/layouts/Base.astro       # import "virtual:hub-feedback/client"
astro.config.mjs             # hubFeedback() in vite.plugins; remove from emdash({ plugins })

DELETE:
src/plugins/hub-feedback/    # entire EmDash plugin directory
```

### `index.ts` responsibilities

- Register and resolve `virtual:hub-feedback/client`
- Ensure widget React/TS resolves correctly in the Vite graph
- Validate options at config time

### Widget integration

- Move `src/plugins/hub-feedback/widget/*` → `src/vite-plugins/hub-feedback/widget/`
- `comment-popover.tsx` keeps `captureElementContext` from `@fasterfixes/core` (unchanged)
- Delete `HubFeedbackMount.tsx` — logic absorbed by `virtual-client.ts`

---

## Migration (this template)

| Remove | Add / move |
|--------|------------|
| `src/plugins/hub-feedback/index.ts` | `src/vite-plugins/hub-feedback/index.ts` |
| `hubFeedbackPlugin()` from `emdash({ plugins })` | `hubFeedback({ apiKey, siteId })` in `vite.plugins` |
| `HubFeedback.astro` + island import in `Base.astro` | `import "virtual:hub-feedback/client"` |
| `HubFeedbackMount.tsx` | `virtual-client.ts` |
| `constants.ts` (`readHubFeedbackConfig`, `escapeHtmlAttr`) | Baked config in virtual module |
| `src/plugins/hub-feedback/widget/*` | `src/vite-plugins/hub-feedback/widget/` |

Update `README.md`: replace EmDash plugin section with Vite plugin setup instructions.

Archive note: after implementation, archive this spec and the old EmDash hub-feedback spec remains historical reference for the superseded approach.

---

## Error handling

| Case | Behavior |
|------|----------|
| Missing `apiKey` / `siteId` at build | Console warn; virtual client no-op |
| Import removed from `Base.astro` | Widget off — intended toggle |
| Click on element | Selector + screenshot work; `sourceFile` null on Astro SSR |
| API failure on submit | Same as today — user-facing error on submit; pin refresh fails silently |

---

## Dependencies

| Package | Role |
|---------|------|
| `@fasterfixes/core` | API client, selectors, browser info, element context |
| `@floating-ui/react` | Widget UI positioning |
| `modern-screenshot` | Screenshot capture |

No new dependencies beyond the existing hub-feedback stack.

---

## Out of scope (v1)

- Compile-time source annotations (`data-hub-src`, Astro AST transform) — privacy: no file paths in client HTML
- EmDash admin settings UI or KV-backed configuration
- Environment-variable toggle without rebuild
- CMS content block / entry ID in feedback metadata
- Publishing the plugin as a standalone npm package
- `ff_token` URL param or localStorage reviewer token flow
- Sandboxed EmDash plugin equivalent

---

## Manual verification

1. **Build:** `bun run typecheck` and `bun run build` pass; no EmDash `hub-feedback` capability warnings.
2. **Config:** `hubFeedback()` in `vite.plugins`; `hubFeedbackPlugin()` removed from `emdash({ plugins })`.
3. **Widget:** Dev server → public page → feedback UI visible; submit succeeds against Hub API with correct headers.
4. **Metadata:** Submitted feedback includes selectors, screenshot, pin placement; `sourceFile` is null on typical Astro SSR clicks.
5. **No path leak:** View-source / DevTools on production build — no `data-hub-src`, `data-astro-source-file`, or similar path attributes added by this plugin.
6. **Toggle off:** Remove virtual import from `Base.astro` → rebuild → no widget, no hub network calls.
7. **Regression:** `/_emdash/admin` loads; `demo-blocks` plugin unaffected.

---

## Related documents

- Superseded: [2026-09-03 Hub Feedback EmDash plugin](../archive/2026-09-03/specs/2026-09-03-hub-feedback-plugin-design.md)
- FasterFixes element context: `@fasterfixes/core` `captureElementContext()` (fiber + `_debugSource` when available)
