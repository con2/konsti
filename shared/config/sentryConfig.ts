export interface SentryConfig {
  tracesSampleRate: number;
  enableSentryInDev: boolean;
  maxValueLength: number;
}

export const sentryConfig: SentryConfig = {
  tracesSampleRate: 0,
  enableSentryInDev: false,
  maxValueLength: 100000,
};
