import { type Locale } from "./config";
import en, { type Dictionary } from "./en";
import hu from "./hu";
import de from "./de";

const DICTIONARIES: Record<Locale, Dictionary> = { en, hu, de };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
