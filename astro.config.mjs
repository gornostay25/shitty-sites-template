import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { loadEnv } from "vite";
import { d1, r2, kvCache } from "@emdash-cms/cloudflare";
import emdash from "emdash/astro";
import { bolThemePlugin } from "./src/plugins/bol-theme/index.ts";
import { resolveHubFeedbackConfig } from "./src/hub-feedback/resolve-config.ts";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
const hubFeedbackConfig = resolveHubFeedbackConfig({
  apiKey: env.HUB_API_KEY ?? "",
  siteId: env.HUB_SITE_ID ?? "",
});

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    sessionKVBindingName: "bar-of-legends-SESSION",
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
    locales: ["en", "hu", "de"],
    fallback: { hu: "en", de: "en" },
    routing: {
      // EmDash single-template i18n — no src/pages/hu|de/ folders
      fallbackType: "rewrite",
    },
    // Do NOT use prefixDefaultLocale — breaks /_emdash/admin
  },
  fonts: [
    {
      name: "Bebas Neue",
      cssVariable: "--font-display-src",
      provider: fontProviders.google(),
      weights: [400],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["Arial Narrow", "ui-sans-serif", "sans-serif"],
    },
    {
      name: "Manrope",
      cssVariable: "--font-body-src",
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
  ],
  integrations: [
    react(), // Need for admin panel
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      objectCache: kvCache({
        binding: "bar-of-legends-CACHE",
        defaultTtl: 3600,
        keyPrefix: "em",
      }),
      plugins: [bolThemePlugin()],
      toolbar: false,
    }),
  ],
  devToolbar: { enabled: false },
});
