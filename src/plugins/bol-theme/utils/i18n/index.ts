import { getRelativeLocaleUrl } from "astro:i18n";
import de from "./de.ts";
import en from "./en.ts";
import hu from "./hu.ts";

import type { UiStrings } from "./en.ts";

export { isNonDefaultLocale, NON_DEFAULT_LOCALES } from "./locales.ts";
export type { UiStrings };

const LOCALES = {
	en,
	hu,
	de,
} as const;

export type BolUiLocale = keyof typeof LOCALES;

/** Theme UI copy by locale. Not used in plugin admin (English-only). */
export function getUiStrings(locale: string | undefined | null): UiStrings {
	if (locale && locale in LOCALES) {
		return LOCALES[locale as BolUiLocale];
	}
	return en;
}

export function notFoundPath(locale: string | undefined | null): string {
	return getRelativeLocaleUrl(locale ?? "en", "/404");
}
