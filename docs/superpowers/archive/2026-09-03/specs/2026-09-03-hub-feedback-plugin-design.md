# Hub Feedback Plugin — Design Spec

**Status:** Implemented (archived 2026-09-03) — plan at [`../plans/2026-09-03-hub-feedback-plugin.md`](../plans/2026-09-03-hub-feedback-plugin.md)  
**Date:** 2026-09-03  
**EmDash version:** 0.36.0  
**Scope:** Native plugin injecting a Shitty Hub feedback widget on public site pages

---

## Summary

Add a native EmDash plugin (`hub-feedback`) that mounts a visual feedback widget on all public pages. The widget reuses UI from FasterFixes `widget-react` (copied into the plugin) and `@fasterfixes/core` for API types and HTTP helpers. It talks to the Shitty Hub support API at `https://shitty-hub.gornostay25.dev/support`.

Authentication differs from stock FasterFixes:

| Header | Source |
|--------|--------|
| `X-API-Key` | `hubApiKey` — plugin setting (Hub API key) |
| `X-Reviewer-Token` | `siteId` — plugin setting (site ID in hub) |

No `?ff_token=` URL param. No localStorage reviewer token. Widget visible to all visitors when the plugin is enabled and both settings are filled.

Widget config is hardcoded client-side (`enabled: true`, `branding: false`) — no `GET /api/v1/widget/config` call.

---

## Architecture

```
Admin (settingsSchema)
  hubApiKey, siteId  →  KV settings:*

Plugin runtime (page:fragments hook)
  read settings + plugin enabled
  if missing → skip injection
  inject body:end:
    <div id="hub-feedback-root"
         data-hub-api-key="..."
         data-site-id="...">

HubFeedback.astro (client:only react island in Base.astro)
  read #hub-feedback-root dataset → mount HubFeedbackWidget
  apiOrigin from constants.ts (not injected)

HubFeedbackWidget (copied from widget-react)
  FasterFixesClient({ apiKey: hubApiKey, apiOrigin }) from @fasterfixes/core
  WIDGET_CONFIG = { enabled: true, branding: false }
  → FeedbackProviderCore(client, reviewerToken=siteId, config=WIDGET_CONFIG)

Hub API
  https://shitty-hub.gornostay25.dev/support/api/v1/feedback/...
```

**Template change:** `Base.astro` adds `<EmDashBodyEnd page={pageCtx} />` (before the island) and imports `HubFeedback.astro`.

---

## Plugin structure

```
src/plugins/hub-feedback/
├── index.ts                    # descriptor + createPlugin
├── constants.ts                # HUB_API_ORIGIN, WIDGET_CONFIG, readHubFeedbackConfig()
├── astro/
│   └── HubFeedback.astro       # client:only react island
└── widget/
    ├── HubFeedbackMount.tsx      # reads data-* → HubFeedbackWidget
    ├── HubFeedbackWidget.tsx   # hardcoded config, no ff_token init
    ├── feedback-provider-core.tsx
    ├── context.ts
    ├── styles.ts
    ├── utils.ts
    └── components/
        ├── annotation-overlay.tsx
        ├── comment-popover.tsx
        ├── element-highlight.tsx
        ├── feedback-list.tsx
        ├── feedback-pin.tsx
        ├── floating-button.tsx
        └── pin-popover.tsx
```

### Copied from `temp/faster-fixes/packages/widget-react`

All of `widget/` except:

- `feedback-provider.tsx` — uses `resolveReviewerToken()`
- `use-feedback.ts` — not needed in v1
- `index.ts`, `internal.ts` — package exports

### npm dependencies (root `package.json`)

- `@fasterfixes/core`
- `@floating-ui/react`
- `modern-screenshot`

---

## Admin settings

Use [auto-generated settings UI](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/#auto-generated-settings-ui) — no custom `admin.tsx`.

```typescript
admin: {
  settingsSchema: {
    hubApiKey: { type: "secret", label: "Hub API Key" },
    siteId:    { type: "string", label: "Site ID" },
  },
},
```

On/off is controlled by plugin activate/deactivate in EmDash admin — no separate `enabled` toggle in settings.

`apiOrigin` is a plugin constant:

```typescript
const HUB_API_ORIGIN = "https://shitty-hub.gornostay25.dev/support";
```

---

## HTTP client

Use `FasterFixesClient` from `@fasterfixes/core` as-is (see `temp/faster-fixes/packages/widget-core/src/client.ts`). No custom client file.

```typescript
const client = new FasterFixesClient({
  apiKey: hubApiKey,
  apiOrigin: HUB_API_ORIGIN,
});
```

- `X-API-Key` ← `hubApiKey` (constructor `apiKey`)
- `X-Reviewer-Token` ← `siteId` — passed as `reviewerToken` prop to `FeedbackProviderCore`, which forwards it to every feedback API method
- Do **not** call `client.getConfig()` — widget config is hardcoded in `constants.ts`

---

## Data flow

### Page load (SSR + client)

1. **`page:fragments` hook** — if plugin disabled or settings incomplete, return `null`. Otherwise inject a single HTML fragment:

   ```html
   <div
     id="hub-feedback-root"
     data-hub-api-key="..."
     data-site-id="..."
   ></div>
   ```

   Attribute values are HTML-escaped. No inline script. No `window` global. `apiOrigin` is **not** injected — it lives in `constants.ts`.

2. **`HubFeedback.astro`** — React island runs after `EmDashBodyEnd`. Reads `#hub-feedback-root` via `dataset.hubApiKey` / `dataset.siteId`. If missing, no-op.

3. **`HubFeedbackWidget`** — create client, render `FeedbackProviderCore` immediately with:

   ```typescript
   const WIDGET_CONFIG: WidgetConfig = {
     enabled: true,
     branding: false,
   };
   ```

   `reviewerToken={siteId}`, `children={null}` (widget portals to `document.body`).

### Runtime API calls

| Action | Method | Path |
|--------|--------|------|
| List | GET | `/api/v1/feedback?url=...` |
| Create | POST | `/api/v1/feedback` |
| Update | PUT | `/api/v1/feedback/:id` |
| Delete | DELETE | `/api/v1/feedback/:id` |
| Screenshot | PUT | `/api/v1/feedback/:id/screenshot` |

Base URL: `https://shitty-hub.gornostay25.dev/support`

---

## Error handling

| Case | Behavior |
|------|----------|
| Plugin disabled or settings empty | Hook returns null — no `#hub-feedback-root`, no network |
| List/create/update fails during use | Existing widget-react popover error UI (retry, error message) |
| Invalid `hubApiKey` / `siteId` | Surfaces on first feedback API call inside widget UI |
| `hubApiKey` in client JS | Accepted — same exposure model as FasterFixes public `projectId` |

---

## Registration

**`astro.config.mjs`:**

```typescript
import { hubFeedbackPlugin } from "./src/plugins/hub-feedback/index.ts";

emdash({
  plugins: [demoBlocksPlugin(), hubFeedbackPlugin()],
}),
```

**Plugin descriptor** — native format, `capabilities: ["hooks.page-fragments:register"]`.

**`Base.astro`:**

```astro
import HubFeedback from "../plugins/hub-feedback/astro/HubFeedback.astro";
// ...
<EmDashBodyEnd page={pageCtx} />
<HubFeedback client:only="react" />
```

---

## Out of scope (v1)

- `?ff_token=` / localStorage reviewer flow
- `GET /api/v1/widget/config`
- Custom React admin settings page
- Widget position, accent color, or label customization
- Dashboard admin widget
- Server-side API proxy (hiding `hubApiKey` from browser)
- `@fasterfixes/react` package (FeedbackProvider wrapper)

---

## Manual verification

1. `bun install` — new deps resolve
2. `bun dev` — site starts, no console errors on `/`
3. EmDash admin → Plugins → enable **Hub Feedback**
4. Settings → enter valid `hubApiKey` + `siteId` → save
5. Open public site `/` — floating feedback button appears (bottom-right default)
6. Enter annotation mode → click element → submit comment — POST succeeds, pin appears
7. Disable plugin in admin — reload public site — widget gone, no `#hub-feedback-root`
8. Clear one setting — reload — widget gone
9. `bun run typecheck` — 0 errors

---

## Copy edits in ported widget files

- Remove `"use client"` directives if present
- Keep `@fasterfixes/core` imports
- No imports from `@fasterfixes/react`
