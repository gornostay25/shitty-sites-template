"use client";

import type { ReactNode } from "react";
import { FeedbackProviderCore } from "@fasterfixes/react/internal";
import { FasterFixesClient } from "@fasterfixes/core";

/**
 * Self-hosted FasterFixes visual feedback widget.
 * Prototype credentials — hardcoded per project scope.
 */
const FF_API_ORIGIN = "https://shitty-hub.gornostay25.dev/support";
const FF_API_KEY = "QTQyNEM2NkQtMDc0RS00MkI2LTlFNzctMjQzMjkxQUMyMDkwCg==";
const FF_REVIEWER_TOKEN = "Wp8vvVsTzFfb9Yqcoxe3Z";

const ffClient = new FasterFixesClient({
  apiKey: FF_API_KEY,
  apiOrigin: FF_API_ORIGIN,
});

export default function FeedbackWidget({ children }: { children: ReactNode }) {
  return (
    <FeedbackProviderCore
      client={ffClient}
      reviewerToken={FF_REVIEWER_TOKEN}
      config={{ enabled: true, branding: false }}
      captureDiagnostics={true}
      apiOrigin={FF_API_ORIGIN}
      color="var(--color-accent)"
      position="bottom-right"
    >
      {children}
    </FeedbackProviderCore>
  );
}
