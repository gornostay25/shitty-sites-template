import { FasterFixesClient } from "@fasterfixes/core";
import { useMemo } from "react";
import { HUB_API_ORIGIN, WIDGET_CONFIG } from "../constants.ts";
import { FeedbackProviderCore } from "./feedback-provider-core";

type Props = {
	hubApiKey: string;
	siteId: string;
	apiOrigin?: string;
};

export function HubFeedbackWidget({
	hubApiKey,
	siteId,
	apiOrigin = HUB_API_ORIGIN,
}: Props) {
	const client = useMemo(
		() => new FasterFixesClient({ apiKey: hubApiKey, apiOrigin }),
		[hubApiKey, apiOrigin],
	);

	return (
		<FeedbackProviderCore
			client={client}
			reviewerToken={siteId}
			config={WIDGET_CONFIG}
			apiOrigin={apiOrigin}
		>
			{null}
		</FeedbackProviderCore>
	);
}
