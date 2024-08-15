import { init } from "@sentry/node";
import { config } from "shared/config";

export const getDsn = (): string | undefined => {
  switch (process.env.SETTINGS) {
    case "production":
      return "https://0278d6bfb3f04c70acf826ecbd86ae58@o1321706.ingest.sentry.io/6579204";
    case "staging":
      return "https://ab176c60aac24be8af2f6c790f1437ac@o1321706.ingest.sentry.io/6578390";
    case "development":
      return config.sentry().enableSentryInDev
        ? "https://6f41ef28d9664c1a8c3e25f58cecacf7@o1321706.ingest.sentry.io/6579493"
        : undefined;
    default:
      return undefined;
  }
};

init({
  dsn: getDsn(),
  tracesSampleRate: config.sentry().tracesSampleRate,
  environment: process.env.SETTINGS,
  maxValueLength: config.sentry().maxValueLength,
});
