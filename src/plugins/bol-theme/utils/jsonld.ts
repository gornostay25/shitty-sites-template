import type { PublicPageContext } from "emdash";
import { VENUE_CITY, VENUE_NAME } from "../constants.ts";
import { rowToDayHours } from "./hours.ts";
import { formatPhoneTel } from "./phone.ts";
import type { VenueSettings } from "./venue.ts";

const SCHEMA_DAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
] as const;

function formatSchemaTime(minutes: number): string {
	const normalized = minutes % 1440;
	const h = Math.floor(normalized / 60);
	const m = normalized % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildOpeningHoursSpecification(venue: VenueSettings) {
	return venue.openingHours.flatMap((row, index) => {
		const dayHours = rowToDayHours(row);
		if (!dayHours || dayHours.open >= dayHours.close) return [];

		return {
			"@type": "OpeningHoursSpecification",
			dayOfWeek: SCHEMA_DAYS[index],
			opens: formatSchemaTime(dayHours.open),
			closes: formatSchemaTime(dayHours.close),
		};
	});
}

function collectSameAs(venue: VenueSettings): string[] {
	return [
		venue.socialInstagram,
		venue.socialFacebook,
		venue.socialTiktok,
	].filter((url) => url && url !== "#");
}

export function buildLocalBusinessGraph(
	venue: VenueSettings,
	page: PublicPageContext,
) {
	const graph: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": venue.schemaType,
		name: VENUE_NAME,
		url: page.canonical ?? undefined,
		telephone: formatPhoneTel(venue.phone),
		email: venue.email,
		address: {
			"@type": "PostalAddress",
			streetAddress: venue.address,
			addressLocality: VENUE_CITY,
			addressCountry: "HU",
		},
		geo: {
			"@type": "GeoCoordinates",
			latitude: venue.lat,
			longitude: venue.lng,
		},
		openingHoursSpecification: buildOpeningHoursSpecification(venue),
	};

	const sameAs = collectSameAs(venue);
	if (sameAs.length > 0) graph.sameAs = sameAs;
	if (venue.priceRange) graph.priceRange = venue.priceRange;

	return graph;
}
