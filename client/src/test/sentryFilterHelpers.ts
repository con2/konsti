import type { ErrorEvent, StackFrame } from "@sentry/react";
import { init, thirdPartyErrorFilterIntegration } from "@sentry/react";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";
import type { InjectedScriptFilterOptions } from "client/utils/injectedScriptFilter";
import { injectedScriptFilterOptions } from "client/utils/injectedScriptFilter";

export const errorEvent = (frames: StackFrame[]): ErrorEvent => ({
  type: undefined,
  exception: {
    values: [{ type: "RangeError", value: "boom", stacktrace: { frames } }],
  },
});

// Spread from what the app installs, so the tests exercise that rather than a
// copy of it. Pinned to dropping so the behaviour tests keep pinning what they
// are named for even while the config selects tagging
const dropInjectedScriptOptions: InjectedScriptFilterOptions = {
  ...injectedScriptFilterOptions,
  behaviour: "drop-error-if-exclusively-contains-third-party-frames",
};

export const initWithInjectedScriptFilter = (
  options: InjectedScriptFilterOptions = dropInjectedScriptOptions,
): (() => ErrorEvent[]) => {
  const { transport, getCapturedEvents } = createRecordingTransport();

  init({
    dsn: fakeDsn,
    transport,
    integrations: [thirdPartyErrorFilterIntegration(options)],
  });

  return () => getCapturedEvents() as ErrorEvent[];
};
