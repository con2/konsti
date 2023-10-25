import { init, Integrations, Handlers } from "@sentry/node";
import express, { Express } from "express";
import { postSentryTunnel } from "server/features/sentry-tunnel/sentryTunnelController";
import { config } from "shared/config";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const initSentry = (app: Express, enableSentry: boolean): void => {
  init({
    dsn: getDsn(enableSentry),
    integrations: [
      // Enable HTTP calls tracing
      new Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Integrations.Express({
        // To trace all requests to the default router
        app,
      }),
      new Integrations.OnUnhandledRejection({
        mode: "none",
      }),
    ],
    tracesSampleRate: config.shared().tracesSampleRate,
    environment: process.env.SETTINGS,
  });

  // The request handler must be the first middleware on the app
  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Handlers.tracingHandler());

  // Sentry tunnel endpoint which accepts text/plain payload
  app.post(
    ApiEndpoint.SENTRY_TUNNEL,
    express.text({
      limit: "5000kb", // limit: 5MB
      type: "text/plain",
    }),
    (req, res) => {
      postSentryTunnel(req, res);
    },
  );
};

export const getDsn = (enableSentry: boolean): string | undefined => {
  if (!enableSentry) {
    return undefined;
  }
  switch (process.env.SETTINGS) {
    case "production":
      return "https://0278d6bfb3f04c70acf826ecbd86ae58@o1321706.ingest.sentry.io/6579204";
    case "staging":
      return "https://ab176c60aac24be8af2f6c790f1437ac@o1321706.ingest.sentry.io/6578390";
    case "development":
      return config.shared().enableSentryInDev
        ? "https://6f41ef28d9664c1a8c3e25f58cecacf7@o1321706.ingest.sentry.io/6579493"
        : undefined;
    default:
      return undefined;
  }
};
