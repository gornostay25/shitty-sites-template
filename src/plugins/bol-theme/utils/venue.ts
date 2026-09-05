import type { PluginContext } from "emdash";
import { OPENING_HOURS_KV_KEY } from "../constants.ts";
import { formatPhoneDisplay, formatPhoneTel } from "./phone.ts";

export type OpeningHoursRow = {
	/** When true, the venue is closed this day; open/close times are ignored. */
	closed?: boolean;
	open: string;
	close: string;
};

export type VenueSettings = {
	phone: string;
	email: string;
	lat: number;
	lng: number;
	address: string;
	socialInstagram: string;
	socialFacebook: string;
	socialTiktok: string;
	schemaType: "BarOrPub" | "Restaurant";
	priceRange?: string;
	openingHours: OpeningHoursRow[];
};

export type PublicVenueSettings = VenueSettings & {
	mapsUrl: string;
	phoneDisplay: string;
	phoneTel: string;
};

/** Google Maps search link from venue coordinates. */
export function buildMapsUrl(lat: number, lng: number): string {
	return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

const SCALAR_KEYS = [
	"phone",
	"email",
	"lat",
	"lng",
	"address",
	"socialInstagram",
	"socialFacebook",
	"socialTiktok",
	"schemaType",
	"priceRange",
] as const;

/** Győr prototype defaults — seeded on plugin:install. */
export const DEFAULT_OPENING_HOURS: OpeningHoursRow[] = [
	{ open: "14:00", close: "23:00" },
	{ open: "14:00", close: "24:00" },
	{ open: "14:00", close: "01:00" },
	{ open: "14:00", close: "24:00" },
	{ open: "14:00", close: "02:00" },
	{ open: "14:00", close: "02:00" },
	{ open: "14:00", close: "23:00" },
];

export const DEFAULT_VENUE_SCALAR: Omit<VenueSettings, "openingHours"> = {
	phone: "+36961234567",
	email: "baroflegendsgyor@gmail.com",
	lat: 47.6877,
	lng: 17.6326,
	address: "Szabadsajtó utca 2, 9021 Győr, Hungary",
	socialInstagram: "#",
	socialFacebook: "#",
	socialTiktok: "#",
	schemaType: "BarOrPub",
	priceRange: "",
};

export function isOpeningHoursRow(value: unknown): value is OpeningHoursRow {
	if (!value || typeof value !== "object") return false;
	const row = value as Record<string, unknown>;
	if (typeof row.open !== "string" || typeof row.close !== "string") return false;
	if (row.closed === true) return true;
	return row.open.length > 0 && row.close.length > 0;
}

export function parseOpeningHours(value: unknown): OpeningHoursRow[] | null {
	if (!Array.isArray(value) || value.length !== 7) return null;
	if (!value.every(isOpeningHoursRow)) return null;
	return value;
}

type KvReader = Pick<PluginContext, "kv">;

async function readScalarSettings(
	ctx: KvReader,
): Promise<Omit<VenueSettings, "openingHours">> {
	const entries = await Promise.all(
		SCALAR_KEYS.map(async (key) => {
			const value = await ctx.kv.get(`settings:${key}`);
			return [key, value] as const;
		}),
	);

	const raw = Object.fromEntries(entries) as Record<
		string,
		string | number | undefined
	>;

	return {
		phone: String(raw.phone ?? DEFAULT_VENUE_SCALAR.phone),
		email: String(raw.email ?? DEFAULT_VENUE_SCALAR.email),
		lat: Number(raw.lat ?? DEFAULT_VENUE_SCALAR.lat),
		lng: Number(raw.lng ?? DEFAULT_VENUE_SCALAR.lng),
		address: String(raw.address ?? DEFAULT_VENUE_SCALAR.address),
		socialInstagram: String(
			raw.socialInstagram ?? DEFAULT_VENUE_SCALAR.socialInstagram,
		),
		socialFacebook: String(
			raw.socialFacebook ?? DEFAULT_VENUE_SCALAR.socialFacebook,
		),
		socialTiktok: String(raw.socialTiktok ?? DEFAULT_VENUE_SCALAR.socialTiktok),
		schemaType:
			raw.schemaType === "Restaurant" ? "Restaurant" : "BarOrPub",
		priceRange: raw.priceRange ? String(raw.priceRange) : undefined,
	};
}

/** Persist scalar KV fields and opening hours from a full settings payload. */
export async function saveVenueSettings(
	ctx: KvReader,
	settings: VenueSettings,
): Promise<void> {
	const { openingHours, ...scalar } = settings;

	for (const key of SCALAR_KEYS) {
		const value = scalar[key];
		await ctx.kv.set(`settings:${key}`, value ?? "");
	}

	await ctx.kv.set(OPENING_HOURS_KV_KEY, openingHours);
}

/** Load merged venue settings from plugin KV. */
export async function loadVenueSettings(
	ctx: KvReader,
): Promise<VenueSettings> {
	const scalar = await readScalarSettings(ctx);
	const storedHours = await ctx.kv.get<OpeningHoursRow[]>(OPENING_HOURS_KV_KEY);
	const openingHours =
		parseOpeningHours(storedHours) ?? DEFAULT_OPENING_HOURS;

	return { ...scalar, openingHours };
}

/** Public API payload — venue settings plus a maps link derived from coordinates. */
export async function loadPublicVenueSettings(
	ctx: KvReader,
): Promise<PublicVenueSettings> {
	const settings = await loadVenueSettings(ctx);
	return {
		...settings,
		mapsUrl: buildMapsUrl(settings.lat, settings.lng),
		phoneDisplay: formatPhoneDisplay(settings.phone),
		phoneTel: formatPhoneTel(settings.phone),
	};
}

export async function seedVenueDefaults(ctx: KvReader): Promise<void> {
	for (const [key, value] of Object.entries(DEFAULT_VENUE_SCALAR)) {
		const existing = await ctx.kv.get(`settings:${key}`);
		if (existing === undefined || existing === null) {
			await ctx.kv.set(`settings:${key}`, value);
		}
	}

	const existingHours = await ctx.kv.get(OPENING_HOURS_KV_KEY);
	if (existingHours === undefined || existingHours === null) {
		await ctx.kv.set(OPENING_HOURS_KV_KEY, DEFAULT_OPENING_HOURS);
	}
}
