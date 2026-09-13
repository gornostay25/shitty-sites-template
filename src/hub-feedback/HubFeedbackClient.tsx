import { hubFeedbackConfig } from "./config.ts";
import { HubFeedbackWidget } from "./widget/HubFeedbackWidget.tsx";

export default function HubFeedbackClient() {
	if (!hubFeedbackConfig) return null;

	return (
		<HubFeedbackWidget
			hubApiKey={hubFeedbackConfig.apiKey}
			siteId={hubFeedbackConfig.siteId}
			apiOrigin={hubFeedbackConfig.apiOrigin}
		/>
	);
}
