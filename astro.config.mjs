import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import { d1, r2, kvCache } from "@emdash-cms/cloudflare";
import emdash from "emdash/astro";
import { demoBlocksPlugin } from "./src/plugins/demo-blocks/index.ts";
import { resolveHubFeedbackConfig } from "./src/hub-feedback/resolve-config.ts";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
const hubFeedbackConfig = resolveHubFeedbackConfig({
  apiKey: env.HUB_API_KEY ?? "",
  siteId: env.HUB_SITE_ID ?? "",
});

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    sessionKVBindingName: "shittysites-template-SESSION",
  }),
  vite: {
    define: {
      __HUB_FEEDBACK_CONFIG__: JSON.stringify(hubFeedbackConfig),
    },
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["astro/logger/console"],
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "uk"],
    fallback: { uk: "en" },
    routing: {
      // EmDash single-template i18n — no src/pages/uk/ folders
      fallbackType: "rewrite",
    },
    // Do NOT use prefixDefaultLocale — breaks /_emdash/admin
  },
  integrations: [
    react(), // kept — client islands / native plugin React admin UI; demo pages are Astro-only
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      /**
       * OBJECT CACHE — KV-backed query cache for Cloudflare Workers.
       *
       * Caches content queries, site settings, menus, and taxonomy terms.
       * Admin edits auto-invalidate affected entries. Preview/visual editing
       * bypass the cache.
       *
       * defaultTtl (seconds, default 3600):
       *   Lower (e.g. 300) when scheduled publishing must appear quickly
       *   without waiting for a collection change. Default is fine for most sites.
       *
       * keyPrefix (default "em"):
       *   Change when multiple EmDash sites share one KV namespace
       *   (e.g. keyPrefix: "client-acme") to avoid key collisions.
       *
       * Docs: https://docs.emdashcms.com/deployment/object-cache/
       */
      objectCache: kvCache({
        binding: "shittysites-template-CACHE",
        defaultTtl: 3600,
        keyPrefix: "em",
      }),
      // Fork: import { siteThemePlugin } from "./src/plugins/site-theme/index.ts";
      // plugins: [siteThemePlugin(), demoBlocksPlugin()],
      plugins: [demoBlocksPlugin()],
      toolbar: false,
    }),
  ],
  // fonts: commented with pointer to Astro fonts docs — add via fontProviders when theming
  devToolbar: { enabled: false },
});
