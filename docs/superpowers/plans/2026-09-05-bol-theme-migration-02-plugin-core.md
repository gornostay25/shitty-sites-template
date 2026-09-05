# BOL Migration — Part 2: Plugin Core

> **Part 2 of 5** · Index: [2026-09-05-bol-theme-migration.md](./2026-09-05-bol-theme-migration.md) · Spec: [design doc](../specs/2026-09-05-bol-theme-migration-design.md)

**Prerequisites:** Part 1 complete (i18n, tokens, Base shell).

**Delivers:** Registered `bol-theme` plugin, venue KV settings + hours API, JSON-LD hook, React `/venue` admin, UI string dictionaries en/hu/de.

**Next:** [Part 3 — Seed + chrome](./2026-09-05-bol-theme-migration-03-seed-chrome.md)

---

## Files touched in this part

| Path | Responsibility |
|------|----------------|
| `src/plugins/bol-theme/index.ts` | Descriptor, createPlugin, blocks, hooks, routes |
| `src/plugins/bol-theme/constants.ts` | Plugin constants |
| `src/plugins/bol-theme/admin.tsx` | Venue hours React admin |
| `src/plugins/bol-theme/components/VenueSettingsPage.tsx` | Hours grid UI |
| `src/plugins/bol-theme/utils/venue.ts` | Types, KV keys, `loadVenueSettings` |
| `src/plugins/bol-theme/utils/hours.ts` | Open/close minute logic |
| `src/plugins/bol-theme/utils/jsonld.ts` | `buildLocalBusinessGraph()` |
| `src/plugins/bol-theme/utils/i18n/*.ts` | UI strings en/hu/de |
| `src/plugins/bol-theme/astro/index.ts` | Export `blockComponents` map (empty until Part 4) |
| `astro.config.mjs` | Register `bolThemePlugin()` |

---

## Task 4: Plugin skeleton

**Files:**
- Create: `src/plugins/bol-theme/index.ts`
- Create: `src/plugins/bol-theme/constants.ts`
- Create: `src/plugins/bol-theme/astro/index.ts`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Create descriptor** (mirror `demo-blocks` pattern)

```typescript
export function bolThemePlugin(): PluginDescriptor {
  return {
    id: "bol-theme",
    version: "0.1.0",
    format: "native",
    entrypoint: new URL("./index.ts", import.meta.url).href,
    componentsEntry: new URL("./astro/index.ts", import.meta.url).href,
    adminEntry: new URL("./admin.tsx", import.meta.url).href,
  };
}
```

- [ ] **Step 2: Register in `astro.config.mjs`**

```javascript
import { bolThemePlugin } from "./src/plugins/bol-theme/index.ts";
// plugins: [bolThemePlugin(), hubFeedbackPlugin()],
```

- [ ] **Step 3: Export empty blockComponents from `astro/index.ts`**

- [ ] **Step 4: Verify plugin loads**

Reload `/_emdash/admin` → Plugins → `bol-theme` appears (restart dev server only if plugin just added and not visible).

---

## Task 5: Venue settings schema + KV routes

**Files:**
- Modify: `src/plugins/bol-theme/index.ts`
- Create: `src/plugins/bol-theme/utils/venue.ts`

**VenueSettings shape:**

```typescript
export type OpeningHoursRow = { open: string; close: string }; // "HH:MM"
export type VenueSettings = {
  phone: string;
  phoneDisplay: string;
  email: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  addressEn: string;
  addressHu: string;
  addressDe: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  schemaType: "BarOrPub" | "Restaurant";
  priceRange?: string;
  openingHours: OpeningHoursRow[]; // length 7, Mon-first
};
```

- [ ] **Step 1: Add `admin.settingsSchema`** for scalar fields (string, number, select for schemaType)

- [ ] **Step 2: Add route `venue/hours` GET/POST** for seven-row hours JSON at `settings:openingHours`

- [ ] **Step 3: Add route `venue/public` GET** — sanitized `VenueSettings` for Astro SSR

- [ ] **Step 4: Seed defaults in `plugin:install`** hook with Győr prototype values

- [ ] **Step 5: Manual check** — fill settings in admin gear form; GET `/_emdash/api/plugins/bol-theme/venue/public` returns JSON

---

## Task 6: Hours logic + JSON-LD builder

**Files:**
- Create: `src/plugins/bol-theme/utils/hours.ts`
- Create: `src/plugins/bol-theme/utils/jsonld.ts`
- Modify: `src/plugins/bol-theme/index.ts` — register `page:metadata` hook

- [ ] **Step 1: Port minute logic from prototype `docs/design/v1/src/data/hours.ts`** — algorithms only, rewrite types/exports

- [ ] **Step 2: Implement `buildLocalBusinessGraph`** — `@type`, `address`, `geo`, `telephone`, `email`, `sameAs[]`, `openingHoursSpecification[]`

- [ ] **Step 3: Register hook**

```typescript
hooks: {
  "page:metadata": async (event, ctx) => {
    if (event.page.path.startsWith("/_emdash")) return null;
    const venue = await loadVenueSettings(ctx);
    if (!venue?.phone) return null;
    return { kind: "jsonld", graph: buildLocalBusinessGraph(venue, event.page) };
  },
},
```

- [ ] **Step 4: Manual check** — view source on `/`, find `<script type="application/ld+json">`

---

## Task 7: Venue admin React page (hours grid)

**Files:**
- Create: `src/plugins/bol-theme/admin.tsx`
- Create: `src/plugins/bol-theme/components/VenueSettingsPage.tsx`

- [ ] **Step 1: Export `pages: { "/venue": VenueSettingsPage }` from admin.tsx**

- [ ] **Step 2: Build seven-row table** with `@emdash-cms/admin` Card, Input — Mon–Sun, open/close inputs

- [ ] **Step 3: Register in definePlugin admin.pages** — `{ path: "/venue", label: "Venue", icon: "mapPin" }`

- [ ] **Step 4: Manual check** — edit hours, save, confirm GET hours endpoint reflects changes

---

## Task 8: UI i18n dictionaries

**Files:**
- Create: `src/plugins/bol-theme/utils/i18n/en.ts`
- Create: `src/plugins/bol-theme/utils/i18n/hu.ts`
- Create: `src/plugins/bol-theme/utils/i18n/de.ts`
- Create: `src/plugins/bol-theme/utils/i18n/index.ts`

- [ ] **Step 1: Define `UiStrings` type** — nav, actions, contact templates, day names, open/closed tpl

- [ ] **Step 2: Implement en/hu/de** — type-enforced completeness

- [ ] **Step 3: Export `getUiStrings(Astro.currentLocale ?? "en")`**

---

## Part 2 completion gate

- [ ] `bol-theme` in admin Plugins list
- [ ] Venue scalar settings + hours API work
- [ ] JSON-LD on public pages when phone set
- [ ] `/venue` admin page saves hours
- [ ] `getUiStrings()` returns strings for en/hu/de
- [ ] Ready for Part 3 seed + theme chrome
