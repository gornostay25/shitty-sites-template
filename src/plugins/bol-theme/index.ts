/**
 * BOL THEME — native plugin (descriptor + createPlugin in one file)
 *
 * Theme chrome, venue settings, JSON-LD, and Portable Text blocks for
 * Bar of Legends. Part 2 delivers plugin core; Part 4 adds PT blocks.
 */
import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";
import { z } from "astro/zod";
import { PLUGIN_ID, PLUGIN_VERSION } from "./constants.ts";
import { buildLocalBusinessGraph } from "./utils/jsonld.ts";
import {
	loadPublicVenueSettings,
	loadVenueSettings,
	parseOpeningHours,
	saveVenueSettings,
	seedVenueDefaults,
	type VenueSettings,
} from "./utils/venue.ts";

const dir = new URL(".", import.meta.url);

const openingHoursSchema = z.array(
	z
		.object({
			closed: z.boolean().optional(),
			open: z.string(),
			close: z.string(),
		})
		.superRefine((row, ctx) => {
			if (row.closed) return;
			if (!row.open || !row.close) {
				ctx.addIssue({
					code: "custom",
					message: "Open and close times are required when the day is open",
				});
			}
		}),
);

const venueSettingsSchema = z.object({
	phone: z.string(),
	email: z.string(),
	lat: z.number(),
	lng: z.number(),
	address: z.string(),
	socialInstagram: z.string(),
	socialFacebook: z.string(),
	socialTiktok: z.string(),
	schemaType: z.enum(["BarOrPub", "Restaurant"]),
	priceRange: z.string().optional(),
	openingHours: openingHoursSchema,
});

/** Descriptor factory — imported by astro.config.mjs at build time. */
export function bolThemePlugin(): PluginDescriptor {
	return {
		id: PLUGIN_ID,
		version: PLUGIN_VERSION,
		format: "native",
		entrypoint: new URL("./index.ts", dir).href,
		componentsEntry: new URL("./astro/index.ts", dir).href,
		adminEntry: new URL("./admin.tsx", dir).href,
		adminPages: [{ path: "/venue", label: "Venue", icon: "mapPin" }],
	};
}

/** Runtime — EmDash calls default export at request time. */
export function createPlugin() {
	return definePlugin({
		id: PLUGIN_ID,
		version: PLUGIN_VERSION,

		admin: {
			pages: [{ path: "/venue", label: "Venue", icon: "mapPin" }],
			portableTextBlocks: [
				{
					type: "bol.hero",
					label: "Hero",
					category: "Bar of Legends",
					description: "Full-viewport hero with background image and CTAs",
					fields: [
						{ type: "text_input", action_id: "kicker", label: "Kicker" },
						{ type: "text_input", action_id: "titleTop", label: "Title (line 1)" },
						{
							type: "text_input",
							action_id: "titleAccent",
							label: "Title accent (line 2)",
						},
						{
							type: "text_input",
							action_id: "subtitle",
							label: "Subtitle",
							multiline: true,
						},
						{ type: "text_input", action_id: "ctaMenu", label: "Menu CTA label" },
						{ type: "text_input", action_id: "ctaBook", label: "Book CTA label" },
						{
							type: "text_input",
							action_id: "scrollHint",
							label: "Scroll hint (optional)",
						},
						{
							type: "media_picker",
							action_id: "backgroundImageUrl",
							label: "Background image (optional)",
							mime_type_filter: "image/",
							placeholder: "Leave empty for default hero image",
						},
					],
				},
				{
					type: "bol.benefits",
					label: "Benefits",
					category: "Bar of Legends",
					description: "Three-column benefit cards with icons",
					fields: [
						{ type: "text_input", action_id: "eyebrow", label: "Eyebrow" },
						{ type: "text_input", action_id: "title", label: "Title" },
						{
							type: "repeater",
							action_id: "items",
							label: "Benefits",
							item_label: "Benefit",
							max_items: 3,
							fields: [
								{
									type: "select",
									action_id: "icon",
									label: "Icon",
									options: [
										{ label: "Beer", value: "beer" },
										{ label: "Gamepad", value: "gamepad" },
										{ label: "People", value: "users" },
									],
								},
								{ type: "text_input", action_id: "title", label: "Title" },
								{
									type: "text_input",
									action_id: "body",
									label: "Body",
									multiline: true,
								},
							],
						},
					],
				},
				{
					type: "bol.menu",
					label: "Menu",
					category: "Bar of Legends",
					description: "Menu section — queries menu_items collection",
					fields: [
						{ type: "text_input", action_id: "eyebrow", label: "Eyebrow" },
						{ type: "text_input", action_id: "title", label: "Title" },
						{
							type: "text_input",
							action_id: "subtitle",
							label: "Subtitle",
							multiline: true,
						},
						{
							type: "text_input",
							action_id: "footnote",
							label: "Footnote",
							multiline: true,
						},
					],
				},
				{
					type: "bol.gallery",
					label: "Gallery",
					category: "Bar of Legends",
					description: "Bento gallery — queries gallery_items collection",
					fields: [
						{ type: "text_input", action_id: "eyebrow", label: "Eyebrow" },
						{ type: "text_input", action_id: "title", label: "Title" },
						{
							type: "text_input",
							action_id: "subtitle",
							label: "Subtitle",
							multiline: true,
						},
					],
				},
				{
					type: "bol.contact",
					label: "Contact",
					category: "Bar of Legends",
					description: "Hours, map, phone, and socials from venue settings",
					fields: [
						{ type: "text_input", action_id: "eyebrow", label: "Eyebrow" },
						{ type: "text_input", action_id: "title", label: "Title" },
						{
							type: "text_input",
							action_id: "subtitle",
							label: "Subtitle",
							multiline: true,
						},
						{ type: "toggle", action_id: "showHours", label: "Show opening hours" },
						{ type: "toggle", action_id: "showMap", label: "Show map" },
						{ type: "toggle", action_id: "showPhone", label: "Show phone & email" },
						{ type: "toggle", action_id: "showSocials", label: "Show social links" },
					],
				},
			],
		},

		hooks: {
			"plugin:install": async (_event, ctx) => {
				await seedVenueDefaults(ctx);
			},

			"page:metadata": async (event, ctx) => {
				if (event.page.path.startsWith("/_emdash")) return null;

				const venue = await loadVenueSettings(ctx);
				if (!venue.phone) return null;

				return {
					kind: "jsonld",
					id: "bol-theme:local-business",
					graph: buildLocalBusinessGraph(venue, event.page),
				};
			},
		},

		routes: {
			"venue/settings": {
				handler: async (ctx) => {
					if (ctx.request.method === "GET") {
						return loadVenueSettings(ctx);
					}

					if (ctx.request.method === "POST") {
						const parsed = venueSettingsSchema.safeParse(ctx.input);
						if (!parsed.success) {
							throw new Response(
								JSON.stringify({ error: "Invalid venue settings payload" }),
								{
									status: 400,
									headers: { "Content-Type": "application/json" },
								},
							);
						}

						if (parsed.data.openingHours.length !== 7) {
							throw new Response(
								JSON.stringify({
									error: "Expected seven opening-hours rows (Mon–Sun)",
								}),
								{
									status: 400,
									headers: { "Content-Type": "application/json" },
								},
							);
						}

						if (!parseOpeningHours(parsed.data.openingHours)) {
							throw new Response(
								JSON.stringify({ error: "Invalid opening hours" }),
								{
									status: 400,
									headers: { "Content-Type": "application/json" },
								},
							);
						}

						const settings: VenueSettings = {
							...parsed.data,
							priceRange: parsed.data.priceRange || undefined,
						};
						await saveVenueSettings(ctx, settings);
						return settings;
					}

					throw new Response("Method not allowed", { status: 405 });
				},
			},

			"venue/public": {
				public: true,
				handler: async (ctx) => {
					if (ctx.request.method !== "GET") {
						throw new Response("Method not allowed", { status: 405 });
					}
					return loadPublicVenueSettings(ctx);
				},
			},
		},
	});
}

export default createPlugin;
