import type { DataCollection } from "@sentry/core";

export interface SentryConfig {
  tracesSampleRate: number;
  enableSentryInDev: boolean;
  maxValueLength: number;
  applicationKey: string;
  dropInjectedScriptErrors: boolean;
}

export const sentryConfig: SentryConfig = {
  tracesSampleRate: 0,
  enableSentryInDev: false,
  maxValueLength: 100000,
  // Marks the app's own chunks at build time so the SDK can tell them from code
  // injected into the page. The build plugin and the SDK must agree on it.
  applicationKey: "konsti",
  // Discard injected-script errors, or keep them and only tag them. Tagging
  // loses nothing and is the reversible way to see what the filter removes,
  // at the cost of the noise still reaching Sentry through the tunnel
  dropInjectedScriptErrors: true,
};

// What the build plugin puts before the application key in each chunk's module
// metadata, spelled once here because neither Sentry package exports it
export const sentryApplicationKeyPrefix = "_sentryBundlerPluginAppKey:";

// The whole property the stamp writes, for the build-time check and the tests.
// Runtime code has to build it from the prefix instead: spelling it out would
// put the quoted key in a chunk, which is half of what that check reads as proof
export const sentryApplicationKeyProperty = `${sentryApplicationKeyPrefix}${sentryConfig.applicationKey}`;

const forwardingKeys = ["forwarded", "-ip", "remote-", "via", "-user"];

// Sentry 11 collects request bodies, cookies and user details unless told not to.
// This is its documented equivalent of the restrictive version 10 defaults, and
// `satisfies` turns a misspelled key, which Sentry would ignore, into a type error.
export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: forwardingKeys },
    response: { deny: forwardingKeys },
  },
  httpBodies: [],
  // Only parameters known to carry nothing private are kept, matched as substrings: the rest
  // hold group codes, serials, usernames and the Kompassi callback's OIDC code and state
  urlQueryParams: { allow: ["programType", "invalid", "error"] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
} satisfies DataCollection;
