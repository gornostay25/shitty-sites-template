# BOL Migration — Part 2: Plugin Core

> **Part 2 of 5** · Index: [2026-09-05-bol-theme-migration.md](./2026-09-05-bol-theme-migration.md) · Spec: [design doc](../specs/2026-09-05-bol-theme-migration-design.md)

**Prerequisites:** Part 1 complete (i18n, tokens, Base shell).

**Delivers:** Registered `bol-theme` plugin, venue KV settings + unified admin API, JSON-LD hook, React `/venue` admin (English-only), theme UI i18n en/hu/de.

**Status:** **Shipped** (2026-09-05) — Part 3 may proceed.

**Next:** [Part 3 — Seed + chrome](./2026-09-05-bol-theme-migration-03-seed-chrome.md)

---

## Official documentation

Verify against live docs ([Docs MCP](https://docs.emdashcms.com/docs-mcp/) · [llms.txt](https://docs.emdashcms.com/llms.txt)) before implementing.

| Task | Read first |
|------|------------|
| 4 — skeleton | [Your first native plugin](https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/) · [Register the plugin](https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/#register-the-plugin) |
| 5 — venue KV | [API routes](https://docs.emdashcms.com/plugins/creating-plugins/api-routes/) · [Plugin settings / KV](https://docs.emdashcms.com/plugins/creating-plugins/settings/) |
| 6 — JSON-LD | [Page fragments — use page:metadata for JSON-LD](https://docs.emdashcms.com/plugins/creating-native-plugins/page-fragments/#when-to-use-pagemetadata-instead) · [Hooks](https://docs.emdashcms.com/plugins/creating-plugins/hooks/) |
| 7 — React admin | [React admin pages](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/) · [Using admin components](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/#using-admin-components) · **EmDash 0.36 notes below** |
| 8 — theme i18n | Theme UI strings en/hu/de in `utils/i18n/` (admin stays English) |

**Project skills:** `.agents/skills/creating-plugins/` (hooks, API routes, admin UI, storage).

---

## Files touched in this part

| Path | Responsibility |
|------|----------------|
| `src/plugins/bol-theme/index.ts` | Descriptor, createPlugin, hooks, routes |
| `src/plugins/bol-theme/constants.ts` | Plugin constants |
| `src/plugins/bol-theme/admin.tsx` | Venue React admin entry |
| `src/plugins/bol-theme/components/VenueSettingsPage.tsx` | Full venue settings UI |
| `src/plugins/bol-theme/components/plugin-api.ts` | `apiFetch` + `parseApiResponse` wrapper |
| `src/plugins/bol-theme/utils/venue.ts` | Types, KV keys, load/save, `buildMapsUrl()` |
| `src/plugins/bol-theme/utils/hours.ts` | Open/close minute logic, closed-day handling |
| `src/plugins/bol-theme/utils/jsonld.ts` | `buildLocalBusinessGraph()` |
| `src/plugins/bol-theme/utils/i18n/*.ts` | Theme UI strings en/hu/de (`getUiStrings`) — not admin |
| `src/plugins/bol-theme/astro/index.ts` | Export `blockComponents` map (empty until Part 4) |
| `astro.config.mjs` | Register `bolThemePlugin()` |

---

## React admin — build wiring

EmDash [React admin docs](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/) describe a **separate admin build** (`tsdown` / `tsup` with `index` + `admin` entries) for **publishable npm plugins** — see [Build configuration](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/#build-configuration).

**`bol-theme` is an in-repo site plugin** (same pattern as `demo-blocks`). **Do not add `tsdown.config.ts` or a plugin `package.json`.** Astro/Vite bundles `admin.tsx` at site dev/build time via the descriptor’s `adminEntry` URL:

```typescript
const dir = new URL(".", import.meta.url);

// Descriptor (build time) — EmDash static-imports this in virtual:emdash/admin-registry
adminEntry: new URL("./admin.tsx", dir).href,
adminPages: [{ path: "/venue", label: "Venue", icon: "mapPin" }], // sidebar nav
```

```typescript
// admin.tsx — export shape per docs (pages keyed by path)
export const pages = {
  "/venue": VenueSettingsPage,
};
```

```typescript
// definePlugin (runtime) — pages paths must match admin.tsx keys
admin: {
  pages: [{ path: "/venue", label: "Venue", icon: "mapPin" }],
  // NO settingsSchema — all venue fields on VenueSettingsPage
},
```

**Rules:**

- Page paths in `admin.pages` / `adminPages` must match keys in `export const pages` (`/venue` ≡ `/venue/`).
- **EmDash 0.36:** `usePluginAPI()` is **not exported** from `@emdash-cms/admin`. Call plugin routes via `apiFetch()` + `parseApiResponse()` — see `components/plugin-api.ts`. Responses use `{ success, data }`; unwrapped `.data` is the route return value.
- Admin page UI: `@cloudflare/kumo` form primitives + `EditorHeader` / `SaveButton`. **English-only** — applies to `/venue` admin only; theme uses `utils/i18n/`.
- Route `venue/public` for SSR must set **`public: true`** on the route definition.
- **`mapsUrl` is not stored** — `buildMapsUrl(lat, lng)` on read; public route adds it to the response.
- Keep React + `@emdash-cms/admin` as site deps (transitive via `emdash`); do not bundle duplicates into the plugin.
- **No legacy KV shims** when renaming settings keys — update admin data directly.
- If `bol-theme` is ever extracted to an npm package, add `tsdown`/`tsup` then — out of scope for this migration.

---

## Task 4: Plugin skeleton

**Files:**
- Create: `src/plugins/bol-theme/index.ts`
- Create: `src/plugins/bol-theme/constants.ts`
- Create: `src/plugins/bol-theme/astro/index.ts`
- Create: `src/plugins/bol-theme/admin.tsx` (stub — required when `adminEntry` is set)
- Modify: `astro.config.mjs`

- [x] **Step 1: Create descriptor** (mirror `demo-blocks`; add `adminEntry` + `adminPages`)

```typescript
const dir = new URL(".", import.meta.url);

export function bolThemePlugin(): PluginDescriptor {
  return {
    id: "bol-theme",
    version: "0.1.0",
    format: "native",
    entrypoint: new URL("./index.ts", dir).href,
    componentsEntry: new URL("./astro/index.ts", dir).href,
    adminEntry: new URL("./admin.tsx", dir).href,
    adminPages: [{ path: "/venue", label: "Venue", icon: "mapPin" }],
  };
}
```

- [x] **Step 2: Stub `admin.tsx`** so Vite can import the admin registry (Task 7 replaces stub)

- [x] **Step 3: Register in `astro.config.mjs`**

- [x] **Step 4: Export empty blockComponents from `astro/index.ts`**

- [x] **Step 5: `createPlugin()` stub** — `admin.pages` mirrors descriptor `adminPages`

- [x] **Step 6: Verify plugin loads**

---

## Task 5: Venue settings + KV routes

**Files:**
- Modify: `src/plugins/bol-theme/index.ts`
- Create: `src/plugins/bol-theme/utils/venue.ts`

**VenueSettings shape (stored — no `mapsUrl`):**

```typescript
export type OpeningHoursRow = {
  closed?: boolean;  // when true, open/close ignored
  open: string;      // "HH:MM"
  close: string;
};

export type VenueSettings = {
  phone: string;
  email: string;
  lat: number;
  lng: number;
  address: string; // single physical address — not localized
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  schemaType: "BarOrPub" | "Restaurant";
  priceRange?: string;
  openingHours: OpeningHoursRow[]; // length 7, Mon-first
};

export type PublicVenueSettings = VenueSettings & {
  mapsUrl: string;
  phoneDisplay: string;
  phoneTel: string;
};

export function buildMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
```

- [x] **Step 1: Single route `venue/settings` GET/POST** — full `VenueSettings` payload (scalars in `settings:*` KV keys + `settings:openingHours` JSON)

- [x] **Step 2: Route `venue/public` GET** with **`public: true`** — returns `PublicVenueSettings` (includes computed `mapsUrl`)

- [x] **Step 3: Seed defaults in `plugin:install`** hook with Győr prototype values

- [x] **Step 4: Zod validation** on POST — require open/close when `closed` is not set; seven rows Mon–Sun

- [x] **Step 5: Manual check** — edit in `/_emdash/admin/plugins/bol-theme/venue`; GET `/_emdash/api/plugins/bol-theme/venue/public` returns JSON with `mapsUrl`

**Not shipped:** `admin.settingsSchema`, separate `venue/hours` route, stored `mapsUrl` KV key.

---

## Task 6: Hours logic + JSON-LD builder

**Files:**
- Create: `src/plugins/bol-theme/utils/hours.ts`
- Create: `src/plugins/bol-theme/utils/jsonld.ts`
- Modify: `src/plugins/bol-theme/index.ts` — register `page:metadata` hook

- [x] **Step 1: Port minute logic from prototype `docs/design/v1/src/data/hours.ts`** — including post-midnight close and **closed-day skip** in `computeStatus()`

- [x] **Step 2: Implement `buildLocalBusinessGraph`** — `@type`, `address`, `geo`, `telephone`, `email`, `sameAs[]`, `openingHoursSpecification[]` (closed days omitted). Import `PublicPageContext` from **`emdash`**.

- [x] **Step 3: Register `page:metadata` hook**

- [x] **Step 4: Manual check** — view source on `/`, find `<script type="application/ld+json">`

---

## Task 7: Venue admin React page

**Files:**
- Modify: `src/plugins/bol-theme/admin.tsx`
- Create: `src/plugins/bol-theme/components/VenueSettingsPage.tsx`
- Create: `src/plugins/bol-theme/components/plugin-api.ts`

Docs: [React admin pages](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/) · [Using admin components](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/#using-admin-components)

- [x] **Step 1: Implement `plugin-api.ts`** — `getPluginRoute()` / `postPluginRoute()` using `apiFetch` + `parseApiResponse`

- [x] **Step 2: Implement `VenueSettingsPage`** — load/save via `venue/settings`; one save for all sections

- [x] **Step 3: Export from `admin.tsx`**

```typescript
import { VenueSettingsPage } from "./components/VenueSettingsPage";

export const pages = {
  "/venue": VenueSettingsPage,
};
```

- [x] **Step 4: UI sections** — Contact, Location (address + lat/lng, **no maps URL field**), Social, SEO, Opening hours table with **Open switch** per day

- [x] **Step 5: Kumo + admin chrome** — `EditorHeader`, `SaveButton`, `LayerCard`, `Input`, `InputArea`, `Select`, `Switch`, `Table`, `Banner`, `Grid`

- [x] **Step 6: Manual check** — open `/_emdash/admin/plugins/bol-theme/venue`, toggle closed day, save; public API reflects changes

---

## Task 8: Theme UI i18n (en/hu/de)

**Files:**
- Create: `src/plugins/bol-theme/utils/i18n/en.ts`
- Create: `src/plugins/bol-theme/utils/i18n/hu.ts`
- Create: `src/plugins/bol-theme/utils/i18n/de.ts`
- Create: `src/plugins/bol-theme/utils/i18n/index.ts`

**Not** used in plugin admin — only public theme partials and blocks.

- [x] **Step 1: Define `UiStrings` type** — nav, actions, contact labels/templates, day names

- [x] **Step 2: Implement en/hu/de** — type-enforced completeness

- [x] **Step 3: Export `getUiStrings(Astro.currentLocale ?? "en")`**

---

## Part 2 completion gate

- [x] `bol-theme` in admin Plugins list
- [x] `venue/settings` + `venue/public` routes work
- [x] JSON-LD on public pages when phone set
- [x] `/venue` admin page saves all settings (including closed days)
- [x] `getUiStrings()` returns en/hu/de theme copy
- [x] Ready for Part 3 seed + theme chrome
