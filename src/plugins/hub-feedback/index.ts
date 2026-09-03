import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";
import { escapeHtmlAttr, HUB_FEEDBACK_ROOT_ID } from "./constants.ts";

const id = "hub-feedback";
const version = "0.1.0";
const dir = new URL(".", import.meta.url);

/** Descriptor factory — imported by astro.config.mjs at build time. */
export function hubFeedbackPlugin(): PluginDescriptor {
	return {
		id,
		version,
		format: "native",
		entrypoint: new URL("./index.ts", dir).href,
		capabilities: ["hooks.page-fragments:register"],
	};
}

/** Runtime — EmDash calls default export at request time. */
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
					description:
						"Site identifier in Shitty Hub (sent as X-Reviewer-Token)",
				},
			},
		},

		hooks: {
			"page:fragments": async (_event, ctx) => {
				const enabled =
					(await ctx.kv.get<boolean>("_emdash:enabled")) ?? true;
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
