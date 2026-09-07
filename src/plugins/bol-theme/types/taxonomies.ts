export const DEFAULT_EXPERIENCE_CATEGORIES = ["gaming", "social", "events"] as const;
export type KnownExperienceCategory = (typeof DEFAULT_EXPERIENCE_CATEGORIES)[number];

export const DEFAULT_MENU_CATEGORIES = ["alcoholic", "nonalcoholic", "snacks"] as const;
export type KnownMenuCategory = (typeof DEFAULT_MENU_CATEGORIES)[number];

export const EXPERIENCE_CATEGORY_TAXONOMY = "experience_category";
export const MENU_CATEGORY_TAXONOMY = "menu_category";

const EXPERIENCE_CHIP_STYLES: Record<KnownExperienceCategory, string> = {
	gaming: "border-brand-muted/40 bg-brand-muted/15 text-brand-muted",
	social: "border-brand/40 bg-brand/15 text-brand",
	events: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const DEFAULT_EXPERIENCE_CHIP =
	"border-border bg-surface-2 text-muted-foreground";

export function isKnownExperienceCategory(
	slug: string,
): slug is KnownExperienceCategory {
	return (DEFAULT_EXPERIENCE_CATEGORIES as readonly string[]).includes(slug);
}

export function experienceChipClass(slug: string | undefined): string {
	if (!slug) return DEFAULT_EXPERIENCE_CHIP;
	return isKnownExperienceCategory(slug)
		? EXPERIENCE_CHIP_STYLES[slug]
		: DEFAULT_EXPERIENCE_CHIP;
}
