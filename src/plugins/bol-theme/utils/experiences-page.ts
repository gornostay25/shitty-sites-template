import { getRelativeLocaleUrl } from "astro:i18n";
import {
	getEmDashCollection,
	getEntryTerms,
	getSiteSettings,
	getTaxonomyTerms,
} from "emdash";
import type { Experience } from "../../../../emdash-env.d.ts";
import { fetchPublicVenue } from "./fetch-venue.ts";
import { getExperiencesFilterProps } from "../astro/routes/experiences-filter-props.ts";
import { getUiStrings } from "./i18n/index.ts";
import { resolveSiteIdentity } from "../../../utils/site-identity";
import { buildStaticPageSeo } from "../../../utils/seo";
import { EXPERIENCE_CATEGORY_TAXONOMY } from "../types/taxonomies.ts";
import {
	categoryLabelMap,
	flattenCategoryTerms,
	primaryTermSlug,
	type CategoryTerm,
} from "./taxonomy.ts";

export type ExperienceListItem = {
	id: string;
	categorySlug?: string;
	categoryLabel?: string;
	title: string;
	description?: string;
	meta?: string;
	image?: Experience["image"];
	ctaType: NonNullable<Experience["cta_type"]> | "ask";
};

export async function loadExperiencesPageData(locale: string, origin: string) {
	const path = getRelativeLocaleUrl(locale, "/experiences");
	const ui = getUiStrings(locale);

	const [{ entries, cacheHint }, taxonomyTerms, venue, settings] =
		await Promise.all([
			getEmDashCollection("experiences", {
				locale,
				orderBy: { sort_order: "asc" },
			}),
			getTaxonomyTerms(EXPERIENCE_CATEGORY_TAXONOMY),
			fetchPublicVenue(origin),
			getSiteSettings(),
		]);

	const categoryTerms: CategoryTerm[] = flattenCategoryTerms(taxonomyTerms);
	const labels = categoryLabelMap(categoryTerms);

	const items: ExperienceListItem[] = await Promise.all(
		entries.map(async (entry) => {
			const terms = await getEntryTerms(
				"experiences",
				entry.data.id,
				EXPERIENCE_CATEGORY_TAXONOMY,
			);
			const categorySlug = primaryTermSlug(terms);
			return {
				id: entry.id,
				categorySlug,
				categoryLabel: categorySlug
					? (labels[categorySlug] ?? categorySlug)
					: undefined,
				title: entry.data.title,
				description: entry.data.description,
				meta: entry.data.meta,
				image: entry.data.image,
				ctaType: entry.data.cta_type ?? "ask",
			};
		}),
	);

	const heroImage =
		items.find((item) => item.id === "tournaments-watchparties")?.image ??
		items[0]?.image;

	const identity = resolveSiteIdentity(settings);
	const filterProps = getExperiencesFilterProps(locale, categoryTerms);
	const seo = buildStaticPageSeo({
		title: `${ui.experiences.title} | ${identity.siteTitle}`,
		description: ui.experiences.subtitle,
		path,
		identity,
	});

	return {
		items,
		categoryTerms,
		venue,
		heroImage,
		seo,
		cacheHint,
		gridId: filterProps.gridId,
		filterProps,
	};
}
