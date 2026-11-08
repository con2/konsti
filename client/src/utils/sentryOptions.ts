import {
  type BrowserOptions,
  thirdPartyErrorFilterIntegration,
} from "@sentry/react";
import { config } from "shared/config";
import { sentryDataCollection } from "shared/config/sentryConfig";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  injectedScriptFilterOptions,
  isBundleStamped,
} from "client/utils/injectedScriptFilter";

const getDsn = (): string | undefined => {
  switch (process.env.SETTINGS) {
    case "production":
      return "https://5b75f3722ea14d6d9307f4c736b3b58a@o1321706.ingest.sentry.io/6579203";
    case "staging":
      return "https://446b1c1e5b3048c4bb00b19b74aa55e6@o1321706.ingest.sentry.io/6578391";
    case "development":
      return config.sentry().enableSentryInDev
        ? "https://1fb97a74de6a44e3b16e8d29aeec3363@o1321706.ingest.sentry.io/6579491"
        : undefined;
    default:
      return undefined;
  }
};

export const getSentryOptions = (): BrowserOptions => {
  return {
    dsn: getDsn(),
    // Drop the default session tracking and client reports
    // Tunnel traffic is error events only
    integrations: (defaultIntegrations) => [
      ...defaultIntegrations.filter(
        (integration) => integration.name !== "BrowserSession",
      ),
      // Left out when this bundle carries no stamps, as a dev server's modules do
      // not, because every frame would then read as third-party
      ...(isBundleStamped()
        ? [thirdPartyErrorFilterIntegration(injectedScriptFilterOptions)]
        : []),
    ],
    sendClientReports: false,
    normalizeDepth: 10,
    environment: process.env.SETTINGS,
    tunnel: ApiEndpoint.SENTRY_TUNNEL,
    maxValueLength: config.sentry().maxValueLength,
    dataCollection: sentryDataCollection,
    // A captured non-Error has no stack of its own, and a synthetic one would group it by call site
    attachStacktrace: false,
  };
};
