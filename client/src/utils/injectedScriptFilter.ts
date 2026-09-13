import { thirdPartyErrorFilterIntegration } from "@sentry/react";
import { config } from "shared/config";
import { sentryApplicationKeyPrefix } from "shared/config/sentryConfig";

export type InjectedScriptFilterOptions = Parameters<
  typeof thirdPartyErrorFilterIntegration
>[0];

// Singles out errors whose every frame comes from outside the app's own chunks,
// which the build stamps with the matching key - injected scripts carry none
export const injectedScriptFilterOptions: InjectedScriptFilterOptions = {
  filterKeys: [config.sentry().applicationKey],
  behaviour: config.sentry().dropInjectedScriptErrors
    ? "drop-error-if-exclusively-contains-third-party-frames"
    : "apply-tag-if-exclusively-contains-third-party-frames",
  // The SDK wraps timers and DOM handlers, and its wrapper lives in a stamped
  // chunk, so without this an injected script's error keeps a first-party frame
  // and survives
  ignoreSentryInternalFrames: true,
};

// The SDK exposes no reader for this, so the global it reads itself is the
// interface. Each chunk registers its key here as it loads, which is before
// init runs, and the dev server stamps nothing at all.
const metadataGlobal = globalThis as typeof globalThis & {
  _sentryModuleMetadata?: Record<string, Record<string, unknown>>;
};

// Built from the prefix rather than spelled out, or the quoted key would land
// in a chunk and blunt the build-time stamp check. Asks for this app's own key:
// a dependency stamped with another would otherwise answer for it
export const isBundleStamped = (): boolean => {
  const keyProperty = `${sentryApplicationKeyPrefix}${config.sentry().applicationKey}`;

  return Object.values(metadataGlobal._sentryModuleMetadata ?? {}).some(
    (metadata) => metadata[keyProperty] === true,
  );
};
