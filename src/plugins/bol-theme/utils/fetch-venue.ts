import { PLUGIN_ID } from "../constants.ts";
import { formatPhoneDisplay, formatPhoneTel } from "./phone.ts";
import {
	buildMapsUrl,
	DEFAULT_OPENING_HOURS,
	DEFAULT_VENUE_SCALAR,
	type PublicVenueSettings,
} from "./venue.ts";

function defaultPublicVenue(): PublicVenueSettings {
	return {
		...DEFAULT_VENUE_SCALAR,
		openingHours: DEFAULT_OPENING_HOURS,
		mapsUrl: buildMapsUrl(DEFAULT_VENUE_SCALAR.lat, DEFAULT_VENUE_SCALAR.lng),
		phoneDisplay: formatPhoneDisplay(DEFAULT_VENUE_SCALAR.phone),
		phoneTel: formatPhoneTel(DEFAULT_VENUE_SCALAR.phone),
	};
}

/** Load public venue settings during Astro SSR. */
export async function fetchPublicVenue(
	siteOrigin: string,
): Promise<PublicVenueSettings> {
	try {
		const response = await fetch(
			`${siteOrigin}/_emdash/api/plugins/${PLUGIN_ID}/venue/public`,
		);
		if (!response.ok) return defaultPublicVenue();

		const payload = (await response.json()) as {
			success?: boolean;
			data?: PublicVenueSettings;
		};
		return payload.data ?? defaultPublicVenue();
	} catch {
		return defaultPublicVenue();
	}
}

export function bookingMailto(email: string): string {
	const subject = encodeURIComponent("Table booking — Bar of Legends");
	return `mailto:${email}?subject=${subject}`;
}

export function eventMailto(email: string): string {
	const subject = encodeURIComponent("Event enquiry — Bar of Legends");
	return `mailto:${email}?subject=${subject}`;
}
