# Hub Feedback Plugin — Implementation Plan

**Status:** Implemented (archived 2026-09-03) — spec at [`../specs/2026-09-03-hub-feedback-plugin-design.md`](../specs/2026-09-03-hub-feedback-plugin-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a native EmDash `hub-feedback` plugin that injects a Shitty Hub visual feedback widget on all public pages using copied FasterFixes widget UI and `@fasterfixes/core`.

**Architecture:** Plugin stores `hubApiKey` + `siteId` via auto-generated `settingsSchema`. A `page:fragments` hook injects `#hub-feedback-root` with `data-hub-api-key` and `data-site-id` when enabled. `HubFeedback.astro` mounts a React island that reads those attributes and renders copied `feedback-provider-core` with `FasterFixesClient` from `@fasterfixes/core` (`apiKey` = hub key, `reviewerToken` = siteId on every feedback call, hardcoded widget config, no `getConfig()` / no `ff_token` flow).

**Tech Stack:** EmDash 0.36 native plugin, Astro 7 SSR, React 19, `@fasterfixes/core`, `@floating-ui/react`, `modern-screenshot`, Bun

**Spec reference:** [`../specs/2026-09-03-hub-feedback-plugin-design.md`](../specs/2026-09-03-hub-feedback-plugin-design.md)

## Global Constraints

- EmDash `emdash@^0.36.0`; native trusted plugin in `plugins: []` (not sandboxed)
- `HUB_API_ORIGIN = "https://shitty-hub.gornostay25.dev/support"` (hardcoded constant)
- `WIDGET_CONFIG = { enabled: true, branding: false }` — no `GET /api/v1/widget/config`
- Headers: `X-API-Key` ← `hubApiKey`, `X-Reviewer-Token` ← `siteId` on every feedback API call
- No `?ff_token=`, no localStorage reviewer token, no `@fasterfixes/react`
- Admin: `settingsSchema` only (`hubApiKey` secret, `siteId` string) — no custom `admin.tsx`
- On/off via plugin activate/deactivate only
- No automated tests — manual verification gates only
- Use Bun (`bun install`, `bun dev`, `bun run typecheck`)
- Do not commit unless the user explicitly asks

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/plugins/hub-feedback/constants.ts` | `HUB_API_ORIGIN`, `WIDGET_CONFIG`, `readHubFeedbackConfig()` |
| `src/plugins/hub-feedback/index.ts` | Descriptor factory + `createPlugin()` with settings + `page:fragments` |
| `src/plugins/hub-feedback/widget/*` | Copied FasterFixes widget UI + entry components |
| `src/plugins/hub-feedback/astro/HubFeedback.astro` | React island mount |
| `src/layouts/Base.astro` | `EmDashBodyEnd` + island import |
| `astro.config.mjs` | Register `hubFeedbackPlugin()` |
| `package.json` | New runtime deps |

---

### Task 1: Add npm dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: installable deps for widget client + UI

- [ ] **Step 1: Add dependencies to `package.json`**

```json
"@fasterfixes/core": "^0.0.7",
"@floating-ui/react": "^0.27.16",
"modern-screenshot": "^4.6.8"
```

- [ ] **Step 2: Install**

```bash
bun install
```

Expected: lockfile updates, packages resolve with no peer errors.

---

### Task 2: Plugin constants

**Files:**
- Create: `src/plugins/hub-feedback/constants.ts`

**Interfaces:**
- Produces: `HUB_API_ORIGIN`, `WIDGET_CONFIG`, `readHubFeedbackConfig()`, `escapeHtmlAttr()`
- Consumed by: Task 4 (`HubFeedbackMount` reads `#hub-feedback-root` dataset), Task 5 (`page:fragments` hook)

**Client:** use `FasterFixesClient` from `@fasterfixes/core` (source: `temp/faster-fixes/packages/widget-core/`). No custom HTTP client file.

- `new FasterFixesClient({ apiKey: hubApiKey, apiOrigin })` → `X-API-Key`
- `FeedbackProviderCore` receives `reviewerToken={siteId}` → core passes `siteId` to every feedback method → `X-Reviewer-Token`
- Do **not** call `client.getConfig()` — pass hardcoded `WIDGET_CONFIG` instead

- [ ] **Step 1: Create `constants.ts`**

```typescript
import type { WidgetConfig } from "@fasterfixes/core";

export const HUB_API_ORIGIN = "https://shitty-hub.gornostay25.dev/support";

export const HUB_FEEDBACK_ROOT_ID = "hub-feedback-root";

export const WIDGET_CONFIG: WidgetConfig = {
	enabled: true,
	branding: false,
};

export type HubFeedbackMountConfig = {
	hubApiKey: string;
	siteId: string;
};

/** Escape values embedded in HTML data-* attributes from plugin KV. */
export function escapeHtmlAttr(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;");
}

/** Read server-injected settings from #hub-feedback-root data attributes. */
export function readHubFeedbackConfig(
	root: HTMLElement | null,
): HubFeedbackMountConfig | null {
	if (!root) return null;

	const hubApiKey = root.dataset.hubApiKey;
	const siteId = root.dataset.siteId;
	if (!hubApiKey || !siteId) return null;

	return { hubApiKey, siteId };
}
```

- [ ] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: passes for new files (may fail on missing widget files until Task 3).

---

### Task 3: Copy widget UI from FasterFixes

**Files:**
- Create: `src/plugins/hub-feedback/widget/context.ts`
- Create: `src/plugins/hub-feedback/widget/styles.ts`
- Create: `src/plugins/hub-feedback/widget/utils.ts`
- Create: `src/plugins/hub-feedback/widget/feedback-provider-core.tsx`
- Create: `src/plugins/hub-feedback/widget/components/annotation-overlay.tsx`
- Create: `src/plugins/hub-feedback/widget/components/comment-popover.tsx`
- Create: `src/plugins/hub-feedback/widget/components/element-highlight.tsx`
- Create: `src/plugins/hub-feedback/widget/components/feedback-list.tsx`
- Create: `src/plugins/hub-feedback/widget/components/feedback-pin.tsx`
- Create: `src/plugins/hub-feedback/widget/components/floating-button.tsx`
- Create: `src/plugins/hub-feedback/widget/components/pin-popover.tsx`

**Interfaces:**
- Produces: ported widget UI matching FasterFixes behavior
- Consumed by: Task 4

- [ ] **Step 1: Copy source files**

```bash
SRC="/Users/gornostay25/Work/freelance/emdash-template/temp/faster-fixes/packages/widget-react/src"
DST="/Users/gornostay25/Work/freelance/emdash-template/src/plugins/hub-feedback/widget"

mkdir -p "$DST/components"
cp "$SRC/context.ts" "$DST/"
cp "$SRC/styles.ts" "$DST/"
cp "$SRC/utils.ts" "$DST/"
cp "$SRC/feedback-provider-core.tsx" "$DST/"
cp "$SRC/components/"*.tsx "$DST/components/"
```

- [ ] **Step 2: Normalize imports in copied files**

In every copied file under `widget/`:

1. Remove `"use client";` lines if present
2. Change relative imports from `*.js` suffix to extensionless (Astro/Vite TS):

   - `./context.js` → `./context`
   - `./styles.js` → `./styles`
   - `./utils.js` → `./utils`
   - `./components/foo.js` → `./components/foo`
   - `./feedback-provider-core.js` → `./feedback-provider-core`

3. Keep `@fasterfixes/core` imports unchanged

- [ ] **Step 3: Typecheck widget tree**

```bash
bun run typecheck
```

Expected: only fails on missing entry files (`HubFeedbackWidget`, `mount`) until Task 4.

---

### Task 4: Widget entry — HubFeedbackWidget + mount

**Files:**
- Create: `src/plugins/hub-feedback/widget/HubFeedbackWidget.tsx`
- Create: `src/plugins/hub-feedback/widget/HubFeedbackMount.tsx`
- Create: `src/plugins/hub-feedback/astro/HubFeedback.astro`

**Interfaces:**
- Consumes: `FasterFixesClient` from `@fasterfixes/core`, `WIDGET_CONFIG`, `readHubFeedbackConfig`, `HUB_FEEDBACK_ROOT_ID` from Task 2
- Produces: `HubFeedbackMount` default export for Astro island

- [ ] **Step 1: Create `HubFeedbackWidget.tsx`**

```tsx
import { FasterFixesClient } from "@fasterfixes/core";
import { useMemo } from "react";
import { HUB_API_ORIGIN, WIDGET_CONFIG } from "../constants.ts";
import { FeedbackProviderCore } from "./feedback-provider-core";

type Props = {
	hubApiKey: string;
	siteId: string;
	apiOrigin?: string;
};

export function HubFeedbackWidget({
	hubApiKey,
	siteId,
	apiOrigin = HUB_API_ORIGIN,
}: Props) {
	const client = useMemo(
		() => new FasterFixesClient({ apiKey: hubApiKey, apiOrigin }),
		[hubApiKey, apiOrigin],
	);

	return (
		<FeedbackProviderCore
			client={client}
			reviewerToken={siteId}
			config={WIDGET_CONFIG}
			apiOrigin={apiOrigin}
		>
			{null}
		</FeedbackProviderCore>
	);
}
```

- [ ] **Step 2: Create `HubFeedbackMount.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
	HUB_FEEDBACK_ROOT_ID,
	readHubFeedbackConfig,
} from "../constants.ts";
import { HubFeedbackWidget } from "./HubFeedbackWidget";

export default function HubFeedbackMount() {
	const [config, setConfig] = useState<ReturnType<typeof readHubFeedbackConfig>>(
		null,
	);

	useEffect(() => {
		const root = document.getElementById(HUB_FEEDBACK_ROOT_ID);
		setConfig(readHubFeedbackConfig(root));
	}, []);

	if (!config) return null;

	return (
		<HubFeedbackWidget
			hubApiKey={config.hubApiKey}
			siteId={config.siteId}
		/>
	);
}
```

Note: `EmDashBodyEnd` must render **before** `<HubFeedback />` in `Base.astro` so `#hub-feedback-root` exists when the island hydrates.

- [ ] **Step 3: Create `astro/HubFeedback.astro`**

```astro
---
import HubFeedbackMount from "../widget/HubFeedbackMount.tsx";
---

<HubFeedbackMount client:only="react" />
```

- [ ] **Step 4: Typecheck**

```bash
bun run typecheck
```

Expected: PASS (or only unrelated pre-existing issues).

---

### Task 5: Plugin descriptor and page:fragments hook

**Files:**
- Create: `src/plugins/hub-feedback/index.ts`

**Interfaces:**
- Consumes: `escapeHtmlAttr`, `HUB_FEEDBACK_ROOT_ID` from `constants.ts`
- Produces: `hubFeedbackPlugin()` descriptor factory + default `createPlugin` export
- Side effect: injects `#hub-feedback-root` with `data-*` attributes on public pages (no inline script, no `window` global)

- [ ] **Step 1: Create `index.ts`**

Follow `src/plugins/demo-blocks/index.ts` native pattern:

```typescript
import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";
import { escapeHtmlAttr, HUB_FEEDBACK_ROOT_ID } from "./constants.ts";

const id = "hub-feedback";
const version = "0.1.0";
const dir = new URL(".", import.meta.url);

export function hubFeedbackPlugin(): PluginDescriptor {
	return {
		id,
		version,
		format: "native",
		entrypoint: new URL("./index.ts", dir).href,
		capabilities: ["hooks.page-fragments:register"],
	};
}

export function createPlugin() {
	return definePlugin({
		id,
		version,
		capabilities: ["hooks.page-fragments:register"],

		admin: {
			settingsSchema: {
				hubApiKey: {
					type: "secret",
					label: "Hub API Key",
					description: "API key for Shitty Hub support API",
				},
				siteId: {
					type: "string",
					label: "Site ID",
					description: "Site identifier in Shitty Hub (sent as X-Reviewer-Token)",
				},
			},
		},

		hooks: {
			"page:fragments": async (_event, ctx) => {
				const enabled = (await ctx.kv.get<boolean>("_emdash:enabled")) ?? true;
				if (!enabled) return null;

				const hubApiKey = await ctx.kv.get<string>("settings:hubApiKey");
				const siteId = await ctx.kv.get<string>("settings:siteId");
				if (!hubApiKey || !siteId) return null;

				return [
					{
						kind: "html" as const,
						placement: "body:end" as const,
						html: `<div id="${HUB_FEEDBACK_ROOT_ID}" data-hub-api-key="${escapeHtmlAttr(hubApiKey)}" data-site-id="${escapeHtmlAttr(siteId)}"></div>`,
						key: "hub-feedback-root",
					},
				];
			},
		},
	});
}

export default createPlugin;
```

- [ ] **Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: PASS.

---

### Task 6: Register plugin and update Base layout

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: `hubFeedbackPlugin()` from Task 5, `HubFeedback.astro` from Task 4

- [ ] **Step 1: Register in `astro.config.mjs`**

```typescript
import { hubFeedbackPlugin } from "./src/plugins/hub-feedback/index.ts";

// inside emdash({ ... })
plugins: [demoBlocksPlugin(), hubFeedbackPlugin()],
```

- [ ] **Step 2: Update `src/layouts/Base.astro`**

Add import near other layout imports:

```astro
import { EmDashHead, EmDashBodyEnd } from "emdash/ui";
import HubFeedback from "../plugins/hub-feedback/astro/HubFeedback.astro";
```

Replace `<EmDashHead page={pageCtx} />` import line if `EmDashHead` import needs merging (single import from `emdash/ui`).

Before `</body>`, after footer/theme-switcher block (**order matters** — `EmDashBodyEnd` first):

```astro
<EmDashBodyEnd page={pageCtx} />
<HubFeedback />
```

Use `<HubFeedback client:only="react" />` only if the island fails without directive on the import — prefer directive on the component in `HubFeedback.astro` (already set).

- [ ] **Step 3: Dev smoke test**

```bash
bun dev
```

Open `http://localhost:4321/` — page loads with no console errors. Widget absent until settings configured (Task 7).

---

### Task 7: Manual end-to-end verification

**Files:** none

- [ ] **Step 1: Configure plugin in admin**

1. Open `http://localhost:4321/_emdash/admin`
2. Plugins → enable **Hub Feedback**
3. Settings → set valid `hubApiKey` and `siteId` → Save

- [ ] **Step 2: Verify widget on public site**

1. Open `http://localhost:4321/`
2. Confirm floating feedback button (bottom-right)
3. DevTools → `#hub-feedback-root` has `data-hub-api-key` and `data-site-id` (no `window.__HUB_FEEDBACK_CONFIG__`)
4. Confirm no inline config script in DOM

- [ ] **Step 3: Submit feedback**

1. Click widget → annotation mode → click page element
2. Enter comment → submit
3. Expect pin on page; network tab shows `POST` to `https://shitty-hub.gornostay25.dev/support/api/v1/feedback` with `X-API-Key` and `X-Reviewer-Token` headers

- [ ] **Step 4: Verify disable paths**

1. Disable plugin in admin → reload `/` → no widget, no `#hub-feedback-root`
2. Re-enable, clear `siteId` → reload → no widget

- [ ] **Step 5: Final typecheck**

```bash
bun run typecheck
```

Expected: 0 errors.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Native plugin `hub-feedback` | Task 5, 6 |
| `settingsSchema` hubApiKey + siteId | Task 5 |
| Hardcoded `HUB_API_ORIGIN` | Task 2, 5 |
| Hardcoded `WIDGET_CONFIG`, no config fetch | Task 2, 4 |
| `FasterFixesClient` headers (hubApiKey + siteId as reviewerToken) | Task 4 |
| No ff_token / localStorage | Task 4 (no token utils imported) |
| Copy widget-react UI | Task 3 |
| `@fasterfixes/core` dependency | Task 1, 2, 3 |
| `data-*` server→client bridge (no window global) | Task 2, 4, 5 |
| `EmDashBodyEnd` + island in Base | Task 6 |
| Manual verification | Task 7 |

---

## Plan complete

Saved to `docs/superpowers/archive/2026-09-03/plans/2026-09-03-hub-feedback-plugin.md`.

**Execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach?
