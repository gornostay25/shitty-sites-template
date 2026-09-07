import { getUiStrings } from "../../utils/i18n/index.ts";
import type { CategoryTerm } from "../../utils/taxonomy.ts";

export function getExperiencesFilterProps(
	locale: string | undefined | null,
	categoryTerms: CategoryTerm[],
) {
	const ui = getUiStrings(locale);
	return {
		gridId: "experience-grid",
		filterLabel: ui.experiences.filterLabel,
		allLabel: ui.experiences.filters.all,
		categories: categoryTerms,
	};
}
