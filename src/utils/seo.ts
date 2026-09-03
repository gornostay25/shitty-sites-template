import { getSeoMeta, type SeoMeta } from "emdash";
import type { SiteIdentity } from "./site-identity";

type SeoEntry = Parameters<typeof getSeoMeta>[0];

export function buildStaticPageSeo(opts: {
	title?: string;
	description?: string;
	path: string;
	image?: string;
	identity: SiteIdentity;
}): SeoMeta {
	const { identity, path, title, description, image } = opts;
	return getSeoMeta(
		{ data: {} },
		{
			siteTitle: identity.siteTitle,
			siteUrl: identity.siteUrl,
			path,
			titleSeparator: identity.seo?.titleSeparator,
			defaultTitle: title ?? identity.siteTitle,
			defaultDescription: description ?? identity.siteTagline,
			defaultOgImage: image ?? identity.seo?.defaultOgImage?.url,
		},
	);
}

export function buildContentSeo(opts: {
	entry: SeoEntry;
	path: string;
	identity: SiteIdentity;
	image?: string;
}): SeoMeta {
	const { entry, path, identity, image } = opts;
	return getSeoMeta(entry, {
		siteTitle: identity.siteTitle,
		siteUrl: identity.siteUrl,
		path,
		titleSeparator: identity.seo?.titleSeparator,
		defaultOgImage: image ?? identity.seo?.defaultOgImage?.url,
	});
}
