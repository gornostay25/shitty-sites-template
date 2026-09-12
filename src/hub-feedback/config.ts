import type { HubFeedbackResolvedConfig } from "./types.ts";

declare const __HUB_FEEDBACK_CONFIG__: HubFeedbackResolvedConfig | null;

/** Baked at build time via `vite.define` in astro.config.mjs. */
export const hubFeedbackConfig: HubFeedbackResolvedConfig | null =
	__HUB_FEEDBACK_CONFIG__;
