import {
  type Breadcrumb,
  type BrowserOptions,
  thirdPartyErrorFilterIntegration,
} from "@sentry/react";
import { config } from "shared/config";
import { sentryDataCollection } from "shared/config/sentryConfig";
import { ApiDevEndpoint, ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  injectedScriptFilterOptions,
  isBundleStamped,
} from "client/utils/injectedScriptFilter";
import { updateServerAppBuildTime } from "client/views/admin/adminSlice";

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

// The requests the data polling loop repeats every interval
const polledPaths = new Set<string>([
  ApiEndpoint.SETTINGS,
  ApiDevEndpoint.TEST_SETTINGS,
  ApiEndpoint.PROGRAM_ITEMS,
  ApiEndpoint.USERS,
  ApiEndpoint.GROUP,
  ApiEndpoint.SIGNUP_MESSAGE,
]);

const isPolledRequest = (data: Breadcrumb["data"]): boolean => {
  if (data?.method !== "GET" || typeof data.url !== "string") {
    return false;
  }
  return polledPaths.has(new URL(data.url, location.href).pathname);
};

// A poll that succeeded, or one that found nothing new, would crowd the useful breadcrumbs out
// of the buffer, so only a failed one is kept
const isPollNoise = (breadcrumb: Breadcrumb): boolean => {
  if (breadcrumb.category === "redux.action") {
    return breadcrumb.data?.type === updateServerAppBuildTime.type;
  }
  if (breadcrumb.category !== "fetch" || !isPolledRequest(breadcrumb.data)) {
    return false;
  }
  const status: unknown = breadcrumb.data?.status_code;
  return typeof status === "number" && status < 400;
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
    beforeBreadcrumb: (breadcrumb) => {
      return isPollNoise(breadcrumb) ? null : breadcrumb;
    },
  };
};
