import type { BolLocale } from "./hours.ts";

/** Format a HUF price: "2 490 Ft" (en/hu) or "2.490 Ft" (de). */
export function formatHUF(price: number, locale: string): string {
	const digits = String(price);
	let grouped: string;
	if (locale === "de") {
		grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	} else {
		grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
	}
	return `${grouped}\u00A0Ft`;
}

/** Replace simple {placeholders} in dictionary templates. */
export function applyTemplate(
	template: string,
	values: Record<string, string>,
): string {
	return Object.entries(values).reduce(
		(acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
		template,
	);
}

export function toBolLocale(locale: string | undefined | null): BolLocale {
	if (locale === "hu" || locale === "de") return locale;
	return "en";
}
