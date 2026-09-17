import { getRelativeLocaleUrl } from "astro:i18n";
import de from "./de.ts";
import en from "./en.ts";
import hu from "./hu.ts";

import type { UiStrings } from "./en.ts";

export { isNonDefaultLocale, NON_DEFAULT_LOCALES } from "./locales.ts";
export type { UiStrings };

const PREFIXED_LOCALES = ["hu", "de"] as const;

/** Locale from URL path (`/hu/…` → `hu`, default `en`). */
export function getRequestLocale(pathname: string): string {
	const segment = pathname.split("/").filter(Boolean)[0];
	if (segment && (PREFIXED_LOCALES as readonly string[]).includes(segment)) {
		return segment;
	}
	return "en";
}

/** Path without locale prefix for `getRelativeLocaleUrl`. */
export function getLocalizedPath(pathname: string): string {
	const parts = pathname.split("/").filter(Boolean);
	if (parts[0] && (PREFIXED_LOCALES as readonly string[]).includes(parts[0])) {
		parts.shift();
	}
	return parts.length ? `/${parts.join("/")}` : "/";
}

const LOCALES = {
	en,
	hu,
	de,
} as const;

export type BolUiLocale = keyof typeof LOCALES;

/** Theme UI copy by locale. Not used in plugin admin (English-only). */
export function getUiStrings(locale: string | undefined | null): UiStrings {
	if (locale && locale in LOCALES) {
		return LOCALES[locale as BolUiLocale] as UiStrings;
	}
	return en as unknown as UiStrings;
}

export function notFoundPath(locale: string | undefined | null): string {
	return getRelativeLocaleUrl(locale ?? "en", "/404");
}
