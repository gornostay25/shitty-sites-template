/** Non-default locale codes — keep in sync with `astro.config.mjs` i18n.locales (minus defaultLocale). */
export const NON_DEFAULT_LOCALES = ["uk"] as const;

export function isNonDefaultLocale(slug: string): boolean {
	return (NON_DEFAULT_LOCALES as readonly string[]).includes(slug);
}
