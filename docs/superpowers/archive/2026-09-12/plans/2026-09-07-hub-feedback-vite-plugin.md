# Hub Feedback Vite Plugin — Implementation Plan

**Status:** Implemented (archived 2026-09-12) — spec at [`../specs/2026-09-07-hub-feedback-vite-plugin-design.md`](../specs/2026-09-07-hub-feedback-vite-plugin-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the EmDash native `hub-feedback` plugin with an in-repo Vite plugin that mounts the Shitty Hub feedback widget via `virtual:hub-feedback/client`, configured in `astro.config.mjs`.

**Architecture:** `hubFeedback({ apiKey, siteId })` registers a Vite plugin that resolves `virtual:hub-feedback/client` to a client bootstrap calling `mountHubFeedback()` with baked-in config. Widget UI moves from `src/plugins/hub-feedback/widget/` to `src/vite-plugins/hub-feedback/widget/`. No compile-time source annotations — metadata uses stock `@fasterfixes/core` `captureElementContext()`.

**Tech Stack:** Astro 7 SSR, Vite, React 19, `@fasterfixes/core`, `@floating-ui/react`, `modern-screenshot`, Bun

**Spec reference:** [`../specs/2026-09-07-hub-feedback-vite-plugin-design.md`](../specs/2026-09-07-hub-feedback-vite-plugin-design.md)

## Global Constraints

- `HUB_API_ORIGIN = "https://shitty-hub.gornostay25.dev/support"` (default in constants; overridable via `apiOrigin` option)
- `WIDGET_CONFIG = { enabled: true, branding: false }` — no `GET /api/v1/widget/config`
- Headers: `X-API-Key` ← `apiKey`, `X-Reviewer-Token` ← `siteId` on every feedback API call
- No `?ff_token=`, no localStorage reviewer token, no `@fasterfixes/react`
- No compile-time source annotations — no `data-hub-src`, no Astro AST transform, no file paths in client HTML
- Config in `astro.config.mjs` only — no EmDash admin settings UI
- Enable/disable: remove `import "virtual:hub-feedback/client"` from `Base.astro` manually
- No automated tests — manual verification gates only
- Use Bun (`bun install`, `bun dev`, `bun run typecheck`)
- Do not commit unless the user explicitly asks

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/vite-plugins/hub-feedback/index.ts` | `hubFeedback()` Vite plugin factory |
| `src/vite-plugins/hub-feedback/types.ts` | `HubFeedbackOptions` |
| `src/vite-plugins/hub-feedback/constants.ts` | `HUB_API_ORIGIN`, `WIDGET_CONFIG`, `HUB_FEEDBACK_ROOT_ID` |
| `src/vite-plugins/hub-feedback/virtual-client.ts` | `mountHubFeedback()` — create root div, React mount |
| `src/vite-plugins/hub-feedback/virtual.d.ts` | `declare module "virtual:hub-feedback/client"` |
| `src/vite-plugins/hub-feedback/widget/*` | Moved FasterFixes widget UI |
| `src/layouts/Base.astro` | `import "virtual:hub-feedback/client"` |
| `astro.config.mjs` | `hubFeedback()` in `vite.plugins`; remove from `emdash({ plugins })` |
| `README.md` | Vite plugin setup docs |

**Delete after migration:**

- `src/plugins/hub-feedback/` (entire directory)

---

### Task 1: Scaffold Vite plugin types and constants

**Files:**
- Create: `src/vite-plugins/hub-feedback/types.ts`
- Create: `src/vite-plugins/hub-feedback/constants.ts`
- Create: `src/vite-plugins/hub-feedback/virtual.d.ts`

**Interfaces:**
- Produces: `HubFeedbackOptions`, `HubFeedbackResolvedConfig`, `HUB_API_ORIGIN`, `WIDGET_CONFIG`, `HUB_FEEDBACK_ROOT_ID`, virtual module TS declaration
- Consumed by: Task 2 (`index.ts`), Task 3 (`virtual-client.ts`), Task 4 (widget)

- [ ] **Step 1: Create `types.ts`**

```typescript
export type HubFeedbackOptions = {
	apiKey: string;
	siteId: string;
	apiOrigin?: string;
};

export type HubFeedbackResolvedConfig = {
	apiKey: string;
	siteId: string;
	apiOrigin: string;
};
```

- [ ] **Step 2: Create `constants.ts`**

```typescript
import type { WidgetConfig } from "@fasterfixes/core";

export const HUB_API_ORIGIN = "https://shitty-hub.gornostay25.dev/support";

export const HUB_FEEDBACK_ROOT_ID = "hub-feedback-root";

export const WIDGET_CONFIG: WidgetConfig = {
	enabled: true,
	branding: false,
};
```

- [ ] **Step 3: Create `virtual.d.ts`**

```typescript
declare module "virtual:hub-feedback/client" {
	const noop: unknown;
	export default noop;
}
```

- [ ] **Step 4: Verify types resolve**

Run: `bun run typecheck`

Expected: passes (no consumers yet beyond declaration file).

---

### Task 2: Implement `hubFeedback()` Vite plugin

**Files:**
- Create: `src/vite-plugins/hub-feedback/index.ts`

**Interfaces:**
- Consumes: `HubFeedbackOptions`, `HUB_API_ORIGIN` from Task 1
- Produces: `hubFeedback(options: HubFeedbackOptions): Plugin` — resolves `virtual:hub-feedback/client`, emits client bootstrap with baked config or no-op when options missing

- [ ] **Step 1: Create `index.ts`**

```typescript
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { HUB_API_ORIGIN } from "./constants.ts";
import type { HubFeedbackOptions, HubFeedbackResolvedConfig } from "./types.ts";

const VIRTUAL_MODULE_ID = "virtual:hub-feedback/client";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const pluginDir = path.dirname(fileURLToPath(import.meta.url));

function resolveConfig(options: HubFeedbackOptions): HubFeedbackResolvedConfig | null {
	const apiKey = options.apiKey?.trim();
	const siteId = options.siteId?.trim();
	if (!apiKey || !siteId) return null;

	return {
		apiKey,
		siteId,
		apiOrigin: options.apiOrigin?.trim() || HUB_API_ORIGIN,
	};
}

function generateVirtualModule(config: HubFeedbackResolvedConfig): string {
	const virtualClientPath = path
		.join(pluginDir, "virtual-client.ts")
		.replace(/\\/g, "/");

	return `
import { mountHubFeedback } from ${JSON.stringify(virtualClientPath)};

mountHubFeedback(${JSON.stringify(config)});
`.trim();
}

/** Vite plugin — mounts Shitty Hub feedback widget via virtual:hub-feedback/client */
export function hubFeedback(options: HubFeedbackOptions): Plugin {
	let resolved: HubFeedbackResolvedConfig | null = null;

	return {
		name: "hub-feedback",
		enforce: "pre",

		config(_config, { command }) {
			resolved = resolveConfig(options);
			if (!resolved) {
				console.warn(
					"[hub-feedback] Missing apiKey or siteId — virtual:hub-feedback/client will be a no-op.",
				);
			}
		},

		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
		},

		load(id) {
			if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

			if (!resolved) {
				return "export {};\n";
			}

			return generateVirtualModule(resolved);
		},
	};
}
```

- [ ] **Step 2: Verify plugin file typechecks**

Run: `bun run typecheck`

Expected: passes.

---

### Task 3: Client bootstrap (`virtual-client.ts`)

**Files:**
- Create: `src/vite-plugins/hub-feedback/virtual-client.ts`

**Interfaces:**
- Consumes: `HUB_FEEDBACK_ROOT_ID` from Task 1; `HubFeedbackWidget` from Task 4
- Produces: `mountHubFeedback(config: HubFeedbackResolvedConfig): void` — SSR-safe no-op, creates `#hub-feedback-root`, React 19 `createRoot` mount

- [ ] **Step 1: Create `virtual-client.ts`**

```tsx
import { createRoot, type Root } from "react-dom/client";
import { HUB_FEEDBACK_ROOT_ID } from "./constants.ts";
import type { HubFeedbackResolvedConfig } from "./types.ts";
import { HubFeedbackWidget } from "./widget/HubFeedbackWidget.tsx";

let root: Root | null = null;

export function mountHubFeedback(config: HubFeedbackResolvedConfig): void {
	if (typeof document === "undefined") return;

	let container = document.getElementById(HUB_FEEDBACK_ROOT_ID);
	if (!container) {
		container = document.createElement("div");
		container.id = HUB_FEEDBACK_ROOT_ID;
		document.body.appendChild(container);
	}

	if (!root) {
		root = createRoot(container);
	}

	root.render(
		<HubFeedbackWidget
			hubApiKey={config.apiKey}
			siteId={config.siteId}
			apiOrigin={config.apiOrigin}
		/>,
	);
}
```

Note: Task 4 must land before this file can typecheck end-to-end. Implement Task 4 next if typecheck fails on missing widget path.

---

### Task 4: Move widget from EmDash plugin directory

**Files:**
- Move: `src/plugins/hub-feedback/widget/*` → `src/vite-plugins/hub-feedback/widget/`
- Modify: `src/vite-plugins/hub-feedback/widget/HubFeedbackWidget.tsx` (import path only if needed)

**Interfaces:**
- Produces: widget tree at new path; `HubFeedbackWidget({ hubApiKey, siteId, apiOrigin? })` unchanged
- Consumed by: Task 3 (`virtual-client.ts`)

- [ ] **Step 1: Move widget directory**

```bash
mkdir -p src/vite-plugins/hub-feedback/widget
mv src/plugins/hub-feedback/widget/* src/vite-plugins/hub-feedback/widget/
```

- [ ] **Step 2: Fix imports in moved files**

In `src/vite-plugins/hub-feedback/widget/HubFeedbackWidget.tsx`, update constants import:

```typescript
import { HUB_API_ORIGIN, WIDGET_CONFIG } from "../constants.ts";
```

All other widget files use relative imports within `widget/` — no changes expected unless they referenced `../constants.ts` (verify with ripgrep).

Run: `rg "plugins/hub-feedback|\\.\\./constants" src/vite-plugins/hub-feedback/widget`

Expected: only `HubFeedbackWidget.tsx` imports `../constants.ts`.

- [ ] **Step 3: Verify widget typechecks**

Run: `bun run typecheck`

Expected: passes once Task 3 file exists.

---

### Task 5: Wire `astro.config.mjs` and remove EmDash plugin

**Files:**
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: `hubFeedback()` from Task 2
- Removes: `hubFeedbackPlugin()` from `emdash({ plugins: [...] })`

- [ ] **Step 1: Update `astro.config.mjs`**

Remove:

```javascript
import { hubFeedbackPlugin } from "./src/plugins/hub-feedback/index.ts";
```

Add:

```javascript
import { hubFeedback } from "./src/vite-plugins/hub-feedback/index.ts";
```

Change `vite.plugins`:

```javascript
vite: {
  plugins: [
    tailwindcss(),
    hubFeedback({
      apiKey: process.env.HUB_API_KEY ?? "",
      siteId: process.env.HUB_SITE_ID ?? "",
    }),
  ],
},
```

Change `emdash({ plugins })`:

```javascript
plugins: [demoBlocksPlugin()],
```

Use placeholder empty strings in the template repo — document in README that fork sites must set real values (or inline literals during local dev). The plugin warns and no-ops when empty.

Alternative for local dev only (document, do not commit secrets):

```javascript
hubFeedback({
  apiKey: "your-hub-api-key",
  siteId: "your-site-id",
}),
```

- [ ] **Step 2: Verify config loads**

Run: `bun run typecheck`

Expected: passes.

---

### Task 6: Update `Base.astro`

**Files:**
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: `virtual:hub-feedback/client` from Task 2
- Removes: `HubFeedback.astro` island import and `<HubFeedback />` component

- [ ] **Step 1: Replace island with virtual import**

Remove:

```astro
import HubFeedback from "../plugins/hub-feedback/astro/HubFeedback.astro";
```

Add to frontmatter (with other imports):

```astro
import "virtual:hub-feedback/client";
```

Remove from body:

```astro
<HubFeedback />
```

Keep `<EmDashBodyEnd page={pageCtx} />` — no dependency on hub-feedback.

- [ ] **Step 2: Verify layout typechecks**

Run: `bun run typecheck`

Expected: passes; `virtual:hub-feedback/client` resolves via `virtual.d.ts`.

---

### Task 7: Delete EmDash plugin remnants

**Files:**
- Delete: `src/plugins/hub-feedback/` (entire directory)

**Interfaces:**
- Removes: EmDash descriptor, `createPlugin`, `HubFeedback.astro`, `HubFeedbackMount.tsx`, old `constants.ts` with `readHubFeedbackConfig`

- [ ] **Step 1: Confirm nothing else imports old path**

Run: `rg "plugins/hub-feedback|hubFeedbackPlugin|HubFeedbackMount|HubFeedback\\.astro" --glob '!docs/**'`

Expected: no matches outside docs/archive.

- [ ] **Step 2: Delete directory**

```bash
rm -rf src/plugins/hub-feedback
```

- [ ] **Step 3: Re-run typecheck**

Run: `bun run typecheck`

Expected: passes.

---

### Task 8: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-07-hub-feedback-vite-plugin-design.md` (status → ready for implementation if still Draft)
- Modify: `docs/superpowers/plans/README.md`

**Interfaces:**
- Documents: Vite plugin setup, config options, enable/disable via import removal

- [ ] **Step 1: Replace README Hub Feedback section**

```markdown
### Hub Feedback (Vite plugin)

Visual feedback widget for Shitty Hub. Configure in `astro.config.mjs`:

```js
import { hubFeedback } from "./src/vite-plugins/hub-feedback/index.ts";

vite: {
  plugins: [
    hubFeedback({
      apiKey: "...",
      siteId: "...",
    }),
  ],
},
```

Enable on public pages with one line in `src/layouts/Base.astro`:

```astro
import "virtual:hub-feedback/client";
```

Remove that import to disable the widget. No file paths are injected into client HTML.

- Plugin: `src/vite-plugins/hub-feedback/`
- API: `https://shitty-hub.gornostay25.dev/support`
- Spec: [docs/superpowers/specs/2026-09-07-hub-feedback-vite-plugin-design.md](./docs/superpowers/specs/2026-09-07-hub-feedback-vite-plugin-design.md)
```

- [ ] **Step 2: Update plans README**

Add row to `docs/superpowers/plans/README.md`:

```markdown
| [2026-09-07-hub-feedback-vite-plugin.md](./2026-09-07-hub-feedback-vite-plugin.md) | Replaces EmDash hub-feedback with Vite plugin |
```

- [ ] **Step 3: Set spec status**

In `docs/superpowers/specs/2026-09-07-hub-feedback-vite-plugin-design.md`, change status line to:

```markdown
**Status:** Approved — plan at [`../plans/2026-09-07-hub-feedback-vite-plugin.md`](../plans/2026-09-07-hub-feedback-vite-plugin.md)
```

Update `docs/superpowers/specs/README.md` status column similarly.

---

### Task 9: Build and manual verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `bun run typecheck`

Expected: `0 errors`.

- [ ] **Step 2: Production build**

Run: `bun run build`

Expected: succeeds; no `[hub-feedback] ... page:fragments` EmDash warnings.

- [ ] **Step 3: Dev server — widget visible**

Run: `bun dev`

With valid `apiKey` and `siteId` in `astro.config.mjs`:

1. Open a public page (e.g. `/`)
2. Feedback floating button appears
3. Submit a test comment
4. Network tab: POST to `.../support/api/v1/feedback` with `X-API-Key` and `X-Reviewer-Token`

- [ ] **Step 4: Metadata — no path leak**

After submit, inspect feedback payload (Hub API response or dashboard):

- `metadata.selectors` populated
- `metadata.sourceFile` is `null` on typical Astro SSR clicks (expected)
- View-source / DevTools on built HTML: no `data-hub-src` attributes added by this plugin

- [ ] **Step 5: Toggle off**

Remove `import "virtual:hub-feedback/client"` from `Base.astro`, restart dev:

Expected: no widget, no hub API calls from public pages.

- [ ] **Step 6: Regression**

1. `/_emdash/admin` loads
2. `demo-blocks` plugin still works on pages using demo PT blocks

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Vite plugin at `src/vite-plugins/hub-feedback/` | 1–2 |
| Config `hubFeedback({ apiKey, siteId })` in `astro.config.mjs` | 5 |
| Virtual module `import "virtual:hub-feedback/client"` | 2, 6 |
| Remove EmDash plugin + page:fragments | 5, 7 |
| No source annotations | (none — intentionally omitted) |
| Stock `captureElementContext` from core | 4 (widget unchanged) |
| Manual enable/disable via import removal | 6, 9 |
| README update | 8 |
| No new dependencies | (deps already in package.json) |

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-09-07-hub-feedback-vite-plugin.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach?
