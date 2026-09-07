import type { TaxonomyTerm } from "emdash";

export type CategoryTerm = { slug: string; label: string };

/** Non-hierarchical taxonomies: top-level terms only, stable CMS order. */
export function flattenCategoryTerms(terms: TaxonomyTerm[]): CategoryTerm[] {
	return terms.map((term) => ({ slug: term.slug, label: term.label }));
}

export function primaryTermSlug(terms: TaxonomyTerm[]): string | undefined {
	return terms[0]?.slug;
}

export function categoryLabelMap(terms: CategoryTerm[]): Record<string, string> {
	return Object.fromEntries(terms.map((term) => [term.slug, term.label]));
}
