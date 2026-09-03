/**
 * DEMO BLOCKS — native plugin (descriptor + createPlugin in one file)
 *
 * Fork — client does not need custom blocks:
 *   1. Remove demoBlocksPlugin() from astro.config.mjs plugins array
 *   2. Delete src/plugins/demo-blocks/
 *
 * Fork — keep blocks, restyle:
 *   Edit src/plugins/demo-blocks/astro/*.astro; add Tailwind classes there.
 *
 * Block Kit constraints:
 *   - No object groups — flatten nested shapes to sibling fields
 *   - Repeater sub-fields are scalar only
 *   - No media picker in block modal yet — use collection image fields or /image slash
 *
 * Docs: https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/
 * PT renderers: https://docs.emdashcms.com/plugins/creating-native-plugins/portable-text-components/
 * Block Kit: https://docs.emdashcms.com/plugins/creating-plugins/block-kit/
 */
import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

const id = "demo-blocks";
const version = "0.1.0";
const dir = new URL(".", import.meta.url);

/** Descriptor factory — imported by astro.config.mjs at build time. */
export function demoBlocksPlugin(): PluginDescriptor {
	return {
		id,
		version,
		format: "native",
		entrypoint: new URL("./index.ts", dir).href,
		componentsEntry: new URL("./astro/index.ts", dir).href,
	};
}

/** Runtime — EmDash calls default export at request time. */
export function createPlugin() {
	return definePlugin({
		id,
		version,
		admin: {
			portableTextBlocks: [
				{
					type: "demo.callout",
					label: "Callout",
					category: "Demo",
					description: "Info or warning callout box",
					fields: [
						{ type: "text_input", action_id: "title", label: "Title" },
						{
							type: "text_input",
							action_id: "body",
							label: "Body",
							multiline: true,
						},
						{
							type: "select",
							action_id: "variant",
							label: "Variant",
							options: [
								{ label: "Info", value: "info" },
								{ label: "Warning", value: "warning" },
							],
						},
					],
				},
				{
					type: "demo.cta",
					label: "CTA strip",
					category: "Demo",
					fields: [
						{ type: "text_input", action_id: "headline", label: "Headline" },
						{
							type: "text_input",
							action_id: "buttonLabel",
							label: "Button label",
						},
						{ type: "text_input", action_id: "buttonUrl", label: "Button URL" },
					],
				},
				{
					type: "demo.stats",
					label: "Stats row",
					category: "Demo",
					fields: [
						{
							type: "repeater",
							action_id: "items",
							label: "Stats",
							item_label: "Stat",
							max_items: 6,
							fields: [
								{ type: "text_input", action_id: "label", label: "Label" },
								{ type: "text_input", action_id: "value", label: "Value" },
							],
						},
					],
				},
			],
		},
	});
}

export default createPlugin;
