import { getRelativeLocaleUrl } from "astro:i18n";
import type { UiStrings } from "./i18n/en.ts";

export type NavItem = {
	href: string;
	label: string;
	active: boolean;
};

export function buildPrimaryNav(
	locale: string,
	pathname: string,
	ui: UiStrings,
): NavItem[] {
	const homeHref = getRelativeLocaleUrl(locale, "/");
	const experiencesHref = getRelativeLocaleUrl(locale, "/experiences");
	const normalizedPath =
		pathname.replace(/\/$/, "") || (locale === "en" ? "" : `/${locale}`);

	return [
		{
			href: homeHref,
			label: ui.nav.home,
			active:
				normalizedPath === "" ||
				normalizedPath === "/" ||
				normalizedPath === `/${locale}`,
		},
		{
			href: `${homeHref}#menu`,
			label: ui.nav.menu,
			active: false,
		},
		{
			href: experiencesHref,
			label: ui.nav.experiences,
			active: pathname.includes("/experiences"),
		},
		{
			href: `${homeHref}#contact`,
			label: ui.nav.contact,
			active: false,
		},
	];
}
