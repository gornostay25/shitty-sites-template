/**
 * SITE THEME — generic native plugin scaffold (not registered in astro.config.mjs).
 *
 * Fork: enable siteThemePlugin() in astro.config.mjs; delete demo-blocks if unused.
 * Docs: https://docs.emdashcms.com/plugins/creating-native-plugins/
 */
import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";
import { PLUGIN_ID, PLUGIN_VERSION } from "./constants.ts";

export function siteThemePlugin(): PluginDescriptor {
	const dir = new URL(".", import.meta.url);
	return {
		id: PLUGIN_ID,
		version: PLUGIN_VERSION,
		format: "native",
		entrypoint: new URL("./index.ts", dir).href,
		componentsEntry: new URL("./astro/index.ts", dir).href,
		adminEntry: new URL("./admin.tsx", dir).href,
	};
}

export function createPlugin() {
	return definePlugin({
		id: PLUGIN_ID,
		version: PLUGIN_VERSION,
		admin: { portableTextBlocks: [] },
	});
}

export default createPlugin;
