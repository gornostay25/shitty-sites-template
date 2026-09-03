import type { WidgetConfig } from "@fasterfixes/core";

export const HUB_API_ORIGIN = "https://shitty-hub.gornostay25.dev/support";

export const HUB_FEEDBACK_ROOT_ID = "hub-feedback-root";

export const WIDGET_CONFIG: WidgetConfig = {
	enabled: true,
	branding: false,
};

export type HubFeedbackMountConfig = {
	hubApiKey: string;
	siteId: string;
};

/** Escape values embedded in HTML data-* attributes from plugin KV. */
export function escapeHtmlAttr(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;");
}

/** Read server-injected settings from #hub-feedback-root data attributes. */
export function readHubFeedbackConfig(
	root: HTMLElement | null,
): HubFeedbackMountConfig | null {
	if (!root) return null;

	const hubApiKey = root.dataset.hubApiKey;
	const siteId = root.dataset.siteId;
	if (!hubApiKey || !siteId) return null;

	return { hubApiKey, siteId };
}
