export const LOCALES = ["en", "hu", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  hu: "HU",
  de: "DE",
};

export function isValidLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
