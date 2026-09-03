import type { SiteSettings } from "emdash";

const FALLBACK = {
	siteTitle: "ShittySites Demo",
	siteTagline: "Full EmDash capability reference — unstyled on purpose",
	siteUrl: "http://localhost:4321",
	postsPerPage: 10,
	dateFormat: "MMMM d, yyyy",
	timezone: "UTC",
} as const;

export interface SiteIdentity {
	/** Settings → General → Site title */
	siteTitle: string;
	/** Settings → General → Tagline */
	siteTagline: string;
	/** Settings → General → Logo (media object or null) */
	siteLogo: SiteSettings["logo"] | null;
	/** Settings → General → Favicon */
	siteFavicon: SiteSettings["favicon"] | null;
	/** Settings → General → Site URL — required for sitemap/canonical */
	siteUrl: string;
	social: SiteSettings["social"];
	seo: SiteSettings["seo"];
	postsPerPage: number;
	dateFormat: string;
	timezone: string;
}

export function resolveSiteIdentity(
	settings: Partial<SiteSettings> | null | undefined,
): SiteIdentity {
	return {
		siteTitle: settings?.title?.trim() || FALLBACK.siteTitle,
		siteTagline: settings?.tagline?.trim() || FALLBACK.siteTagline,
		siteLogo: settings?.logo ?? null,
		siteFavicon: settings?.favicon ?? null,
		siteUrl: settings?.url?.trim() || FALLBACK.siteUrl,
		social: settings?.social ?? {},
		seo: settings?.seo ?? {},
		postsPerPage: settings?.postsPerPage ?? FALLBACK.postsPerPage,
		dateFormat: settings?.dateFormat ?? FALLBACK.dateFormat,
		timezone: settings?.timezone ?? FALLBACK.timezone,
	};
}
