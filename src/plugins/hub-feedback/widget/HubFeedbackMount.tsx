import { useEffect, useState } from "react";
import {
	HUB_FEEDBACK_ROOT_ID,
	readHubFeedbackConfig,
} from "../constants.ts";
import { HubFeedbackWidget } from "./HubFeedbackWidget";

export default function HubFeedbackMount() {
	const [config, setConfig] = useState<ReturnType<typeof readHubFeedbackConfig>>(
		null,
	);

	useEffect(() => {
		const root = document.getElementById(HUB_FEEDBACK_ROOT_ID);
		setConfig(readHubFeedbackConfig(root));
	}, []);

	if (!config) return null;

	return (
		<HubFeedbackWidget hubApiKey={config.hubApiKey} siteId={config.siteId} />
	);
}
