/** Block Kit `media_picker` URL safe for public `<img src>` (never `@fs` / absolute disk paths). */
export function safeMediaUrl(raw: unknown): string {
	if (typeof raw !== "string") return "";
	const value = raw.trim();
	if (!value) return "";
	if (value.includes("@fs") || value.startsWith("file:")) return "";
	if (value.startsWith("/Users/") || /^[A-Za-z]:\\/.test(value)) return "";
	if (value.startsWith("/_emdash/api/media/")) return value;
	if (value.startsWith("https://") || value.startsWith("http://")) return value;
	if (value.startsWith("/") && !value.startsWith("//")) return value;
	return "";
}
