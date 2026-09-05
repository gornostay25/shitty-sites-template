import parsePhoneNumberFromString, {
	type CountryCode,
} from "libphonenumber-js";

/** Fallback region when the number has no international prefix. */
export const VENUE_PHONE_DEFAULT_COUNTRY: CountryCode = "HU";

function parseVenuePhone(
	phone: string,
	defaultCountry: CountryCode = VENUE_PHONE_DEFAULT_COUNTRY,
) {
	const trimmed = phone.trim();
	if (!trimmed) return undefined;

	return (
		parsePhoneNumberFromString(trimmed) ??
		parsePhoneNumberFromString(trimmed, defaultCountry)
	);
}

/** Human-readable international format for the public site. */
export function formatPhoneDisplay(
	phone: string,
	defaultCountry: CountryCode = VENUE_PHONE_DEFAULT_COUNTRY,
): string {
	const trimmed = phone.trim();
	if (!trimmed) return "";

	const parsed = parseVenuePhone(trimmed, defaultCountry);
	if (parsed) return parsed.formatInternational();

	return trimmed;
}

/** E.164 for `tel:` links when parsing succeeds. */
export function formatPhoneTel(
	phone: string,
	defaultCountry: CountryCode = VENUE_PHONE_DEFAULT_COUNTRY,
): string {
	const trimmed = phone.trim();
	if (!trimmed) return "";

	const parsed = parseVenuePhone(trimmed, defaultCountry);
	if (parsed?.isValid()) return parsed.format("E.164");

	return trimmed;
}
