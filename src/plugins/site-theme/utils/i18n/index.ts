import { en, type UiStrings } from "./en.ts";
import { uk } from "./uk.ts";

const LOCALES = { en, uk } as const;

export function getUiStrings(locale: string | undefined | null): UiStrings {
	if (locale && locale in LOCALES) return LOCALES[locale as keyof typeof LOCALES];
	return en;
}
