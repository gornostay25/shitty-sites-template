import { getRelativeLocaleUrl } from "astro:i18n";
import { en, type UiStrings } from "./en.ts";
import { uk } from "./uk.ts";

export { isNonDefaultLocale, NON_DEFAULT_LOCALES } from "./locales.ts";

const LOCALES = { en, uk } as const;

export function getUiStrings(locale: string | undefined | null): UiStrings {
	if (locale && locale in LOCALES) return LOCALES[locale as keyof typeof LOCALES];
	return en;
}

export function notFoundPath(locale: string | undefined | null): string {
	return getRelativeLocaleUrl(locale ?? "en", "/404");
}
