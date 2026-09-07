import type { PublicVenueSettings } from "./venue.ts";

export const SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

type SocialHrefKey = "socialInstagram" | "socialFacebook" | "socialTiktok";

const SOCIAL_HREF_KEYS: Record<SocialNetwork, SocialHrefKey> = {
	instagram: "socialInstagram",
	facebook: "socialFacebook",
	tiktok: "socialTiktok",
};

export function socialLinksFromVenue(
	venue: PublicVenueSettings,
): { id: SocialNetwork; href: string }[] {
	return SOCIAL_NETWORKS.map((id) => ({
		id,
		href: venue[SOCIAL_HREF_KEYS[id]],
	}));
}

export function socialNavLinksFromVenue(
	_venue: PublicVenueSettings,
): { id: SocialNetwork; hrefKey: SocialHrefKey }[] {
	return SOCIAL_NETWORKS.map((id) => ({
		id,
		hrefKey: SOCIAL_HREF_KEYS[id],
	}));
}
