import { HUB_API_ORIGIN } from "./constants.ts";
import type { HubFeedbackOptions, HubFeedbackResolvedConfig } from "./types.ts";

export function resolveHubFeedbackConfig(
	options: HubFeedbackOptions,
): HubFeedbackResolvedConfig | null {
	const apiKey = options.apiKey?.trim();
	const siteId = options.siteId?.trim();
	if (!apiKey || !siteId) return null;

	return {
		apiKey,
		siteId,
		apiOrigin: options.apiOrigin?.trim() || HUB_API_ORIGIN,
	};
}
